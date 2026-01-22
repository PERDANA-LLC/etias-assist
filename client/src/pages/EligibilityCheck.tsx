import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Globe, FileCheck, AlertTriangle, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HelpChat from "@/components/HelpChat";
import { ETIAS_ELIGIBLE_COUNTRIES, TRAVEL_PURPOSES } from "@shared/etias";

type Step = "nationality" | "passport" | "purpose" | "result";

export default function EligibilityCheck() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>("nationality");
  const [nationality, setNationality] = useState("");
  const [hasValidPassport, setHasValidPassport] = useState<boolean | null>(null);
  const [travelPurpose, setTravelPurpose] = useState("");
  const [result, setResult] = useState<{
    isEligible: boolean;
    reason: string;
    requiresVisa: boolean;
    nextSteps: string;
  } | null>(null);

  const checkMutation = trpc.eligibility.check.useMutation();
  const createAppMutation = trpc.application.create.useMutation();

  const steps: Step[] = ["nationality", "passport", "purpose", "result"];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (step === "nationality" && nationality) {
      setStep("passport");
    } else if (step === "passport" && hasValidPassport !== null) {
      setStep("purpose");
    } else if (step === "purpose") {
      // Perform eligibility check
      try {
        const checkResult = await checkMutation.mutateAsync({
          nationality,
          hasValidPassport: hasValidPassport!,
          travelPurpose: travelPurpose || undefined
        });
        setResult(checkResult);
        setStep("result");
      } catch (error) {
        console.error("Eligibility check failed:", error);
      }
    }
  };

  const handleBack = () => {
    if (step === "passport") setStep("nationality");
    else if (step === "purpose") setStep("passport");
    else if (step === "result") setStep("purpose");
  };

  const handleStartApplication = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    try {
      const app = await createAppMutation.mutateAsync({
        nationality,
        travelPurpose: travelPurpose || undefined
      });
      navigate(`/application/${app.id}`);
    } catch (error) {
      console.error("Failed to create application:", error);
    }
  };

  const canProceed = () => {
    if (step === "nationality") return nationality !== "";
    if (step === "passport") return hasValidPassport !== null;
    if (step === "purpose") return true; // Purpose is optional
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">ETIAS Eligibility Check</h1>
            <p className="text-muted-foreground">
              Answer a few questions to determine if you need ETIAS authorization for your trip to Europe.
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStepIndex + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step === "nationality" && <Globe className="w-5 h-5 text-primary" />}
                {step === "passport" && <FileCheck className="w-5 h-5 text-primary" />}
                {step === "purpose" && <Globe className="w-5 h-5 text-primary" />}
                {step === "result" && (result?.isEligible ? 
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> : 
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                {step === "nationality" && "What is your nationality?"}
                {step === "passport" && "Do you have a valid passport?"}
                {step === "purpose" && "What is the purpose of your travel?"}
                {step === "result" && "Eligibility Result"}
              </CardTitle>
              <CardDescription>
                {step === "nationality" && "Select the country that issued your passport"}
                {step === "passport" && "Your passport must be valid for at least 3 months beyond your planned stay"}
                {step === "purpose" && "This helps us provide relevant information (optional)"}
                {step === "result" && "Based on your answers"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === "nationality" && (
                <div className="space-y-4">
                  <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      {ETIAS_ELIGIBLE_COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other (Not Listed)</SelectItem>
                    </SelectContent>
                  </Select>
                  {nationality === "other" && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Not in the list?</AlertTitle>
                      <AlertDescription>
                        If your country is not listed, you may be an EU/EEA citizen (who doesn't need ETIAS) 
                        or you may require a Schengen visa instead. Please check the official EU website for 
                        visa requirements.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {step === "passport" && (
                <RadioGroup
                  value={hasValidPassport === null ? "" : hasValidPassport.toString()}
                  onValueChange={(value) => setHasValidPassport(value === "true")}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="true" id="passport-yes" />
                    <Label htmlFor="passport-yes" className="flex-1 cursor-pointer">
                      <div className="font-medium">Yes, I have a valid passport</div>
                      <div className="text-sm text-muted-foreground">
                        My passport will be valid for at least 3 months after my planned departure from the Schengen Area
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="false" id="passport-no" />
                    <Label htmlFor="passport-no" className="flex-1 cursor-pointer">
                      <div className="font-medium">No, or my passport is expiring soon</div>
                      <div className="text-sm text-muted-foreground">
                        I need to renew my passport before applying for ETIAS
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {step === "purpose" && (
                <div className="space-y-4">
                  <Select value={travelPurpose} onValueChange={setTravelPurpose}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select travel purpose (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAVEL_PURPOSES.map((purpose) => (
                        <SelectItem key={purpose.value} value={purpose.value}>
                          {purpose.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Note: ETIAS is valid for short stays up to 90 days within any 180-day period. 
                    For longer stays or work purposes, you may need a different type of visa.
                  </p>
                </div>
              )}

              {step === "result" && result && (
                <div className="space-y-6">
                  <Alert variant={result.isEligible ? "default" : "destructive"} className={result.isEligible ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""}>
                    {result.isEligible ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle className={result.isEligible ? "text-green-800 dark:text-green-200" : ""}>
                      {result.isEligible ? "You are eligible for ETIAS" : "ETIAS may not be required"}
                    </AlertTitle>
                    <AlertDescription className={result.isEligible ? "text-green-700 dark:text-green-300" : ""}>
                      {result.reason}
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Next Steps</h4>
                    <p className="text-sm text-muted-foreground">{result.nextSteps}</p>
                  </div>

                  {result.isEligible && (
                    <div className="space-y-4">
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleStartApplication}
                        disabled={createAppMutation.isPending}
                      >
                        {createAppMutation.isPending ? "Creating..." : "Start Application Preparation"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      {!isAuthenticated && (
                        <p className="text-sm text-center text-muted-foreground">
                          You'll need to sign in to save your application progress
                        </p>
                      )}
                    </div>
                  )}

                  {result.requiresVisa && (
                    <a 
                      href="https://ec.europa.eu/home-affairs/policies/schengen-borders-and-visa/visa-policy_en"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:underline"
                    >
                      Check Schengen Visa Requirements
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              {step !== "result" && (
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === "nationality"}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed() || checkMutation.isPending}
                  >
                    {checkMutation.isPending ? "Checking..." : step === "purpose" ? "Check Eligibility" : "Continue"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {step === "result" && (
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Check Again
                  </Button>
                  <Link href="/">
                    <Button variant="outline">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <HelpChat />
    </div>
  );
}
