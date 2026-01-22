import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  Globe, 
  ArrowRight, 
  Lock, 
  FileCheck, 
  CreditCard,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Star
} from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HelpChat from "@/components/HelpChat";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-20 pb-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <Shield className="w-4 h-4 mr-2" />
              Official ETIAS Preparation Service
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Prepare Your ETIAS Application{" "}
              <span className="text-primary">with Confidence</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Our guided assistance platform helps you prepare all required information for your 
              European Travel Information and Authorisation System application before submitting 
              on the official EU website.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/eligibility">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 py-6">
                  Check Your Eligibility
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6 bg-background">
                    View My Applications
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6 bg-background">
                    Sign In to Continue
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl font-bold text-primary mb-1">50K+</div>
              <div className="text-sm text-muted-foreground">Applications Prepared</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl font-bold text-primary mb-1">99.2%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl font-bold text-primary mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">AI Support</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-3xl font-bold text-primary mb-1">
                4.9 <Star className="w-6 h-6 fill-primary" />
              </div>
              <div className="text-sm text-muted-foreground">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our streamlined process guides you through every step of preparing your ETIAS application
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                icon: CheckCircle2,
                title: "Check Eligibility",
                description: "Answer a few questions to confirm you need ETIAS authorization for your trip"
              },
              {
                step: "2",
                icon: FileCheck,
                title: "Complete Form",
                description: "Fill out your information with real-time validation and contextual help"
              },
              {
                step: "3",
                icon: CreditCard,
                title: "Secure Payment",
                description: "Pay the service fee through our secure, PCI-compliant payment system"
              },
              {
                step: "4",
                icon: ExternalLink,
                title: "Submit Officially",
                description: "We redirect you to the official EU website to complete your submission"
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{item.description}</CardDescription>
                  </CardContent>
                </Card>
                {index < 3 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-muted-foreground/30 transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Our Service</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make ETIAS preparation simple, secure, and stress-free
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>GDPR Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Your data is protected with bank-level encryption and handled in full compliance 
                  with European data protection regulations.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <HelpCircle className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Help</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Get instant answers to your questions about ETIAS requirements, eligibility, 
                  and the application process from our intelligent assistant.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Save Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Create an account to save your application progress and return anytime to 
                  complete your preparation at your own pace.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-16">
        <div className="container">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Important Information</h3>
                  <p className="text-muted-foreground mb-4">
                    This platform is an <strong>assistance service</strong> that helps you prepare your ETIAS 
                    application. We do not submit applications on your behalf. After completing the preparation 
                    process, you will be securely redirected to the official EU ETIAS website to submit your 
                    application directly.
                  </p>
                  <a 
                    href="https://travel-europe.europa.eu/etias_en" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline font-medium"
                  >
                    Visit Official EU ETIAS Website
                    <ExternalLink className="ml-2 w-4 h-4" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Your ETIAS Preparation?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Join thousands of travelers who have successfully prepared their ETIAS applications 
              with our guided assistance platform.
            </p>
            <Link href="/eligibility">
              <Button size="lg" variant="secondary" className="text-base px-8 py-6">
                Check Your Eligibility Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <HelpChat />
    </div>
  );
}
