import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  Loader2,
  BarChart3,
  Activity,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Shield,
  ShieldCheck,
  Crown,
  UserCog
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const statusColors: Record<string, string> = {
  draft: "#94a3b8",
  eligibility_checked: "#3b82f6",
  form_completed: "#8b5cf6",
  payment_pending: "#eab308",
  payment_completed: "#22c55e",
  ready_to_submit: "#10b981",
  redirected: "#6366f1",
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // User management state
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "user" as "user" | "admin" });

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.getStats.useQuery(undefined, {
    enabled: isAuthenticated && isAdmin
  });

  const { data: applications, isLoading: appsLoading, refetch: refetchApps } = trpc.admin.getApplications.useQuery(undefined, {
    enabled: isAuthenticated && isAdmin
  });

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.getUsers.useQuery(undefined, {
    enabled: isAuthenticated && isAdmin
  });

  const { data: dailyStats, isLoading: dailyLoading } = trpc.admin.getDailyStats.useQuery(
    { days: 30 },
    { enabled: isAuthenticated && isAdmin }
  );

  // Mutations for user CRUD
  const utils = trpc.useUtils();
  
  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      setIsCreateDialogOpen(false);
      setNewUser({ name: "", email: "", role: "user" });
      utils.admin.getUsers.invalidate();
      utils.admin.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      utils.admin.getUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      utils.admin.getUsers.invalidate();
      utils.admin.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
    if (!authLoading && isAuthenticated && !isAdmin) {
      navigate("/dashboard");
    }
  }, [authLoading, isAuthenticated, user, navigate, isAdmin]);

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const applicationStatusData = stats?.applications.byStatus 
    ? Object.entries(stats.applications.byStatus).map(([name, value]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: statusColors[name] || "#94a3b8"
      }))
    : [];

  const chartData = dailyStats?.map(d => ({
    date: format(new Date(d.date), "MMM d"),
    events: d.count
  })) || [];

  const conversionRate = stats?.applications.total && stats?.eligibility.total
    ? ((stats.applications.total / stats.eligibility.total) * 100).toFixed(1)
    : "0";

  const paymentConversionRate = stats?.applications.total && stats?.payments.total
    ? ((stats.payments.total / stats.applications.total) * 100).toFixed(1)
    : "0";

  // Filter users by search
  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getRoleBadge = (role: string, isImmutable?: boolean) => {
    if (role === "super_admin") {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
          <Crown className="w-3 h-3 mr-1" />
          Super Admin
        </Badge>
      );
    }
    if (role === "admin") {
      return (
        <Badge variant="default">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return <Badge variant="secondary">User</Badge>;
  };

  const handleRefresh = () => {
    refetchStats();
    refetchApps();
    refetchUsers();
    toast.success("Data refreshed");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {isSuperAdmin ? (
                  <Crown className="w-8 h-8 text-yellow-500" />
                ) : (
                  <Shield className="w-8 h-8 text-primary" />
                )}
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                {isSuperAdmin 
                  ? "Super Administrator Access - Full Control" 
                  : "Administrator Access - View & Monitor"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Registered accounts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.applications.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total applications started
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{((stats?.payments.totalAmount || 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.payments.total || 0} successful payments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Eligibility to application
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eligibility Checks</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.eligibility.total || 0}</div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-green-600">
                    {stats?.eligibility.eligible || 0} eligible
                  </span>
                  <span className="text-red-600">
                    {stats?.eligibility.ineligible || 0} ineligible
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Conversion</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentConversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Applications to payments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Help Queries</CardTitle>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.helpQueries.total || 0}</div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-green-600">
                    {stats?.helpQueries.helpful || 0} helpful
                  </span>
                  <span className="text-red-600">
                    {stats?.helpQueries.notHelpful || 0} not helpful
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users">
                <UserCog className="w-4 h-4 mr-2" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="applications">
                <FileText className="w-4 h-4 mr-2" />
                Applications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Activity Chart */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Daily Activity (30 days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                              dataKey="date" 
                              className="text-xs"
                              tick={{ fill: 'currentColor' }}
                            />
                            <YAxis 
                              className="text-xs"
                              tick={{ fill: 'currentColor' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="events" 
                              stroke="hsl(var(--primary))" 
                              fill="hsl(var(--primary) / 0.2)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No activity data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Application Status Distribution */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Application Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {applicationStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={applicationStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => 
                                `${name} (${(percent * 100).toFixed(0)}%)`
                              }
                              labelLine={false}
                            >
                              {applicationStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No application data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserCog className="w-5 h-5" />
                        User Management
                      </CardTitle>
                      <CardDescription>
                        {isSuperAdmin 
                          ? "Full CRUD access - Create, edit, and delete users" 
                          : "View-only access - Contact super admin for changes"}
                      </CardDescription>
                    </div>
                    {isSuperAdmin && (
                      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add User
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                              Add a new user to the system
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                placeholder="John Doe"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="john@example.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="role">Role</Label>
                              <Select
                                value={newUser.role}
                                onValueChange={(value: "user" | "admin") => setNewUser({ ...newUser, role: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => createUserMutation.mutate(newUser)}
                              disabled={createUserMutation.isPending || !newUser.name || !newUser.email}
                            >
                              {createUserMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : null}
                              Create User
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Badge variant="outline">{filteredUsers.length} users</Badge>
                  </div>

                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 text-sm font-medium">ID</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Name</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Email</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Role</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Login Method</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Last Active</th>
                            {isSuperAdmin && <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u: any) => (
                            <tr key={u.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-2 text-sm font-mono">#{u.id}</td>
                              <td className="py-3 px-2 text-sm font-medium">{u.name || "—"}</td>
                              <td className="py-3 px-2 text-sm">{u.email || "—"}</td>
                              <td className="py-3 px-2">{getRoleBadge(u.role, u.isImmutable)}</td>
                              <td className="py-3 px-2">
                                <Badge variant="outline">{u.loginMethod || "manus"}</Badge>
                              </td>
                              <td className="py-3 px-2 text-sm text-muted-foreground">
                                {u.lastSignedIn ? format(new Date(u.lastSignedIn), "MMM d, yyyy HH:mm") : "Never"}
                              </td>
                              {isSuperAdmin && (
                                <td className="py-3 px-2 text-right">
                                  {!u.isImmutable ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setSelectedUser(u);
                                          setIsEditDialogOpen(true);
                                        }}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete {u.name || u.email}? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => deleteUserMutation.mutate({ id: u.id })}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Protected
                                    </Badge>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Edit User Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                      Update user information
                    </DialogDescription>
                  </DialogHeader>
                  {selectedUser && (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                          id="edit-name"
                          value={selectedUser.name || ""}
                          onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={selectedUser.email || ""}
                          onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-role">Role</Label>
                        <Select
                          value={selectedUser.role}
                          onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => updateUserMutation.mutate({
                        id: selectedUser.id,
                        name: selectedUser.name,
                        email: selectedUser.email,
                        role: selectedUser.role,
                      })}
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>
                    All ETIAS application preparations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {appsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : applications && applications.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 text-sm font-medium">ID</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Applicant</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Nationality</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.slice(0, 20).map((app) => (
                            <tr key={app.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-2 text-sm">#{app.id}</td>
                              <td className="py-3 px-2 text-sm">
                                {app.firstName && app.lastName 
                                  ? `${app.firstName} ${app.lastName}`
                                  : <span className="text-muted-foreground">Not provided</span>}
                              </td>
                              <td className="py-3 px-2 text-sm">{app.nationality || "-"}</td>
                              <td className="py-3 px-2">
                                <Badge 
                                  variant="secondary" 
                                  style={{ backgroundColor: statusColors[app.status] + "20", color: statusColors[app.status] }}
                                >
                                  {app.status.replace(/_/g, " ")}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-sm text-muted-foreground">
                                {format(new Date(app.createdAt), "MMM d, yyyy")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No applications yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
