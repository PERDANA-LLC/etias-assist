import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  ExternalLink, 
  Download, 
  Shield, 
  Clock,
  AlertTriangle,
  Loader2,
  Copy,
  Check
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HelpChat from "@/components/HelpChat";
import { OFFICIAL_ETIAS_URL } from "@shared/etias";
import { format } from "date-fns";

export default function Success() {
  const params = useParams<{ applicationId: string }>();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const applicationId = parseInt(params.applicationId);

  const { data: application, isLoading: appLoading } = trpc.application.get.useQuery(
    { id: applicationId },
    { enabled: !!applicationId && isAuthenticated }
  );

  const markRedirectedMutation = trpc.application.markRedirected.useMutation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const handleRedirect = async () => {
    setRedirecting(true);
    try {
      await markRedirectedMutation.mutateAsync({ id: applicationId });
      window.open(OFFICIAL_ETIAS_URL, "_blank");
    } catch (error) {
      console.error("Failed to mark as redirected:", error);
      window.open(OFFICIAL_ETIAS_URL, "_blank");
    } finally {
      setRedirecting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-3xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Application Ready!</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your ETIAS application has been prepared and is ready to submit on the official EU website.
            </p>
          </div>

          {/* Application Summary */}
          {application && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Application Summary</CardTitle>
                <CardDescription>
                  Review your information before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Personal Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Full Name</span>
                        <span className="font-medium">{application.firstName} {application.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date of Birth</span>
                        <span>{application.dateOfBirth ? format(new Date(application.dateOfBirth), "MMM d, yyyy") : "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nationality</span>
                        <span>{application.nationality}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Passport Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Passport Number</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium font-mono">{application.passportNumber}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(application.passportNumber || "")}
                          >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expiry Date</span>
                        <span>{application.passportExpiryDate ? format(new Date(application.passportExpiryDate), "MMM d, yyyy") : "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Travel Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destinations</span>
                      <span className="text-right max-w-[250px]">
                        {application.destinationCountries 
                          ? (application.destinationCountries as string[]).join(", ")
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Travel Dates</span>
                      <span>
                        {application.plannedArrivalDate && application.plannedDepartureDate
                          ? `${format(new Date(application.plannedArrivalDate), "MMM d")} - ${format(new Date(application.plannedDepartureDate), "MMM d, yyyy")}`
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Important Notice */}
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Before You Submit</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Have your passport ready for reference</li>
                <li>You will need to pay the official ETIAS fee (€7) on the EU website</li>
                <li>The official application takes approximately 10-15 minutes to complete</li>
                <li>Most applications are processed within minutes, but some may take up to 96 hours</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Shield className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to Submit Your Application</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Click the button below to open the official EU ETIAS website in a new tab. 
                  Use the information you've prepared to complete your application.
                </p>
                <Button 
                  size="lg" 
                  className="w-full max-w-sm"
                  onClick={handleRedirect}
                  disabled={redirecting}
                >
                  {redirecting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Go to Official EU ETIAS Website
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  You will be redirected to: {OFFICIAL_ETIAS_URL}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Complete the Official Application</h4>
                  <p className="text-sm text-muted-foreground">
                    Fill in your details on the official EU ETIAS website using the information you've prepared.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-primary">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Pay the Official Fee</h4>
                  <p className="text-sm text-muted-foreground">
                    Pay the €7 ETIAS fee directly on the EU website (applicants aged 18-70).
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-primary">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Receive Your Authorization</h4>
                  <p className="text-sm text-muted-foreground">
                    Most applications are approved within minutes. You'll receive confirmation via email.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-primary">4</span>
                </div>
                <div>
                  <h4 className="font-medium">Travel to Europe</h4>
                  <p className="text-sm text-muted-foreground">
                    Your ETIAS is valid for 3 years or until your passport expires. Enjoy your trip!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <Link href="/dashboard">
              <Button variant="outline">
                Back to My Applications
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
      <HelpChat />
    </div>
  );
}
