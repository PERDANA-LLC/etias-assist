import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Loader2,
  BarChart3,
  Activity
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { format } from "date-fns";
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

  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin"
  });

  const { data: applications, isLoading: appsLoading } = trpc.admin.getApplications.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin"
  });

  const { data: users, isLoading: usersLoading } = trpc.admin.getUsers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin"
  });

  const { data: dailyStats, isLoading: dailyLoading } = trpc.admin.getDailyStats.useQuery(
    { days: 30 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
    if (!authLoading && isAuthenticated && user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role !== "admin") {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor system performance, user analytics, and application statistics
            </p>
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
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
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

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Registered Users</CardTitle>
                  <CardDescription>
                    All platform users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : users && users.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 text-sm font-medium">ID</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Name</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Email</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Role</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Joined</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Last Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.slice(0, 20).map((u) => (
                            <tr key={u.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-2 text-sm">#{u.id}</td>
                              <td className="py-3 px-2 text-sm">{u.name || "-"}</td>
                              <td className="py-3 px-2 text-sm">{u.email || "-"}</td>
                              <td className="py-3 px-2">
                                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                  {u.role}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-sm text-muted-foreground">
                                {format(new Date(u.createdAt), "MMM d, yyyy")}
                              </td>
                              <td className="py-3 px-2 text-sm text-muted-foreground">
                                {format(new Date(u.lastSignedIn), "MMM d, yyyy")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No users yet
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
