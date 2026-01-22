import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HelpChat from "@/components/HelpChat";
import { SERVICE_FEE_CENTS } from "@shared/etias";
import { toast } from "sonner";

export default function Payment() {
  const params = useParams<{ applicationId: string }>();
  const [location, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const applicationId = parseInt(params.applicationId);

  // Check for cancelled payment
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("cancelled") === "true") {
      toast.error("Payment was cancelled. You can try again when ready.");
    }
  }, []);

  const { data: application, isLoading: appLoading } = trpc.application.get.useQuery(
    { id: applicationId },
    { enabled: !!applicationId && isAuthenticated }
  );

  const createCheckoutMutation = trpc.payment.createCheckoutSession.useMutation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const result = await createCheckoutMutation.mutateAsync({
        applicationId
      });

      if (result.url) {
        toast.info("Redirecting to secure checkout...");
        // Open Stripe checkout in new tab
        window.open(result.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const serviceFee = SERVICE_FEE_CENTS / 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Payment Info */}
            <div>
              <h1 className="text-2xl font-bold mb-2">Complete Payment</h1>
              <p className="text-muted-foreground mb-6">
                Secure payment for ETIAS application assistance
              </p>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Secure Checkout
                  </CardTitle>
                  <CardDescription>
                    You'll be redirected to our secure payment page powered by Stripe
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">What's included:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ Eligibility verification</li>
                        <li>✓ Application form validation</li>
                        <li>✓ 24/7 AI-powered support</li>
                        <li>✓ Secure data handling</li>
                        <li>✓ Guided submission process</li>
                      </ul>
                    </div>

                    <Alert className="border-primary/20 bg-primary/5">
                      <Shield className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-sm">
                        Your payment is processed securely through Stripe. We never store your card details.
                      </AlertDescription>
                    </Alert>

                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleCheckout}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Pay €{serviceFee.toFixed(2)} Securely
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      You will be redirected to Stripe's secure checkout page
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>Secured by 256-bit SSL encryption</span>
                  </div>
                </CardContent>
              </Card>

              {/* Security Badges */}
              <div className="mt-6 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>PCI Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span>Secure Payment</span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {application && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Applicant</span>
                        <span>{application.firstName} {application.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nationality</span>
                        <span>{application.nationality}</span>
                      </div>
                      {application.destinationCountries && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Destinations</span>
                          <span className="text-right max-w-[150px]">
                            {(application.destinationCountries as string[]).slice(0, 2).join(", ")}
                            {(application.destinationCountries as string[]).length > 2 && "..."}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ETIAS Assistance Service</span>
                      <span>€{serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Processing Fee</span>
                      <span>€0.00</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>€{serviceFee.toFixed(2)}</span>
                  </div>

                  <Alert className="border-primary/20 bg-primary/5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      This is a one-time payment for our ETIAS application assistance service. 
                      The official ETIAS fee (€7) is paid separately on the EU website.
                    </AlertDescription>
                  </Alert>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Secure data handling & GDPR compliant</p>
                    <p>• 24/7 AI-powered support</p>
                    <p>• Application review & validation</p>
                    <p>• Guided submission process</p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 with any future date and CVC to test payments.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <HelpChat />
    </div>
  );
}
