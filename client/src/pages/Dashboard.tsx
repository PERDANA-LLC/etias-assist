import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  CreditCard,
  ExternalLink,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HelpChat from "@/components/HelpChat";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", icon: <FileText className="w-4 h-4" /> },
  eligibility_checked: { label: "Eligibility Confirmed", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: <CheckCircle2 className="w-4 h-4" /> },
  form_completed: { label: "Form Completed", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: <FileText className="w-4 h-4" /> },
  payment_pending: { label: "Payment Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: <CreditCard className="w-4 h-4" /> },
  payment_completed: { label: "Payment Complete", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: <CheckCircle2 className="w-4 h-4" /> },
  ready_to_submit: { label: "Ready to Submit", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", icon: <CheckCircle2 className="w-4 h-4" /> },
  redirected: { label: "Redirected to EU", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", icon: <ExternalLink className="w-4 h-4" /> },
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const { data: applications, isLoading } = trpc.application.list.useQuery(undefined, {
    enabled: isAuthenticated
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getActionButton = (app: NonNullable<typeof applications>[0]) => {
    switch (app.status) {
      case "draft":
      case "eligibility_checked":
      case "form_completed":
        return (
          <Link href={`/application/${app.id}`}>
            <Button size="sm">
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        );
      case "payment_pending":
        return (
          <Link href={`/payment/${app.id}`}>
            <Button size="sm">
              Complete Payment <CreditCard className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        );
      case "ready_to_submit":
        return (
          <Link href={`/success/${app.id}`}>
            <Button size="sm">
              Submit to EU <ExternalLink className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        );
      case "redirected":
        return (
          <Button size="sm" variant="outline" disabled>
            Completed
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Applications</h1>
              <p className="text-muted-foreground">
                Manage your ETIAS application preparations
              </p>
            </div>
            <Link href="/eligibility">
              <Button>
                <Plus className="mr-2 w-4 h-4" />
                New Application
              </Button>
            </Link>
          </div>

          {applications && applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((app) => {
                const status = statusConfig[app.status] || statusConfig.draft;
                return (
                  <Card key={app.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className={status.color}>
                              {status.icon}
                              <span className="ml-1">{status.label}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Application #{app.id}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {app.firstName && app.lastName && (
                              <p className="font-medium">
                                {app.firstName} {app.lastName}
                              </p>
                            )}
                            {app.nationality && (
                              <p className="text-sm text-muted-foreground">
                                Nationality: {app.nationality}
                              </p>
                            )}
                            {app.destinationCountries && (app.destinationCountries as string[]).length > 0 && (
                              <p className="text-sm text-muted-foreground">
                                Destinations: {(app.destinationCountries as string[]).slice(0, 3).join(", ")}
                                {(app.destinationCountries as string[]).length > 3 && ` +${(app.destinationCountries as string[]).length - 3} more`}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Created: {format(new Date(app.createdAt), "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Updated: {format(new Date(app.updatedAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getActionButton(app)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  Start your ETIAS application preparation by checking your eligibility first.
                </p>
                <Link href="/eligibility">
                  <Button>
                    <Plus className="mr-2 w-4 h-4" />
                    Start New Application
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                • Your application data is securely stored and encrypted
              </p>
              <p>
                • You can save your progress and return at any time
              </p>
              <p>
                • After completing payment, you will be redirected to the official EU ETIAS website to submit your application
              </p>
              <p>
                • We do not submit applications on your behalf
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <HelpChat />
    </div>
  );
}
