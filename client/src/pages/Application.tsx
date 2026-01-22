import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  FileText, 
  Phone, 
  Plane, 
  Shield, 
  CheckCircle2,
  HelpCircle,
  Save,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HelpChat from "@/components/HelpChat";
import { SCHENGEN_COUNTRIES, APPLICATION_STEPS } from "@shared/etias";

type FormData = {
  // Personal info
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: "male" | "female" | "other" | "";
  // Passport info
  passportNumber: string;
  passportIssuingCountry: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  // Contact info
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  // Travel details
  destinationCountries: string[];
  plannedArrivalDate: string;
  plannedDepartureDate: string;
  accommodationAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  // Security questions
  hasCriminalRecord: boolean;
  hasVisaDenied: boolean;
  hasDeportationHistory: boolean;
};

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  placeOfBirth: "",
  gender: "",
  passportNumber: "",
  passportIssuingCountry: "",
  passportIssueDate: "",
  passportExpiryDate: "",
  phoneNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: "",
  destinationCountries: [],
  plannedArrivalDate: "",
  plannedDepartureDate: "",
  accommodationAddress: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  hasCriminalRecord: false,
  hasVisaDenied: false,
  hasDeportationHistory: false,
};

export default function Application() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(2); // Start at Personal Info (step 2)
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const applicationId = params.id ? parseInt(params.id) : undefined;
  
  const { data: application, isLoading: appLoading } = trpc.application.get.useQuery(
    { id: applicationId! },
    { enabled: !!applicationId }
  );
  
  const updateMutation = trpc.application.update.useMutation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  // Load application data
  useEffect(() => {
    if (application) {
      setFormData({
        firstName: application.firstName || "",
        lastName: application.lastName || "",
        dateOfBirth: application.dateOfBirth ? new Date(application.dateOfBirth).toISOString().split('T')[0] : "",
        placeOfBirth: application.placeOfBirth || "",
        gender: (application.gender as FormData["gender"]) || "",
        passportNumber: application.passportNumber || "",
        passportIssuingCountry: application.passportIssuingCountry || "",
        passportIssueDate: application.passportIssueDate ? new Date(application.passportIssueDate).toISOString().split('T')[0] : "",
        passportExpiryDate: application.passportExpiryDate ? new Date(application.passportExpiryDate).toISOString().split('T')[0] : "",
        phoneNumber: application.phoneNumber || "",
        addressLine1: application.addressLine1 || "",
        addressLine2: application.addressLine2 || "",
        city: application.city || "",
        postalCode: application.postalCode || "",
        country: application.country || "",
        destinationCountries: (application.destinationCountries as string[]) || [],
        plannedArrivalDate: application.plannedArrivalDate ? new Date(application.plannedArrivalDate).toISOString().split('T')[0] : "",
        plannedDepartureDate: application.plannedDepartureDate ? new Date(application.plannedDepartureDate).toISOString().split('T')[0] : "",
        accommodationAddress: application.accommodationAddress || "",
        emergencyContactName: application.emergencyContactName || "",
        emergencyContactPhone: application.emergencyContactPhone || "",
        hasCriminalRecord: application.hasCriminalRecord || false,
        hasVisaDenied: application.hasVisaDenied || false,
        hasDeportationHistory: application.hasDeportationHistory || false,
      });
      if (application.currentStep) {
        setCurrentStep(application.currentStep);
      }
    }
  }, [application]);

  const updateField = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 2) { // Personal Info
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.placeOfBirth.trim()) newErrors.placeOfBirth = "Place of birth is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
    } else if (step === 3) { // Passport
      if (!formData.passportNumber.trim()) newErrors.passportNumber = "Passport number is required";
      if (!formData.passportIssuingCountry) newErrors.passportIssuingCountry = "Issuing country is required";
      if (!formData.passportIssueDate) newErrors.passportIssueDate = "Issue date is required";
      if (!formData.passportExpiryDate) newErrors.passportExpiryDate = "Expiry date is required";
    } else if (step === 4) { // Contact
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
      if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.country) newErrors.country = "Country is required";
    } else if (step === 5) { // Travel
      if (formData.destinationCountries.length === 0) newErrors.destinationCountries = "Select at least one destination";
      if (!formData.plannedArrivalDate) newErrors.plannedArrivalDate = "Arrival date is required";
      if (!formData.plannedDepartureDate) newErrors.plannedDepartureDate = "Departure date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveProgress = async () => {
    if (!applicationId) return;
    
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: applicationId,
        data: {
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
          placeOfBirth: formData.placeOfBirth || undefined,
          gender: formData.gender || undefined,
          passportNumber: formData.passportNumber || undefined,
          passportIssuingCountry: formData.passportIssuingCountry || undefined,
          passportIssueDate: formData.passportIssueDate ? new Date(formData.passportIssueDate) : undefined,
          passportExpiryDate: formData.passportExpiryDate ? new Date(formData.passportExpiryDate) : undefined,
          phoneNumber: formData.phoneNumber || undefined,
          addressLine1: formData.addressLine1 || undefined,
          addressLine2: formData.addressLine2 || undefined,
          city: formData.city || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
          destinationCountries: formData.destinationCountries.length > 0 ? formData.destinationCountries : undefined,
          plannedArrivalDate: formData.plannedArrivalDate ? new Date(formData.plannedArrivalDate) : undefined,
          plannedDepartureDate: formData.plannedDepartureDate ? new Date(formData.plannedDepartureDate) : undefined,
          accommodationAddress: formData.accommodationAddress || undefined,
          emergencyContactName: formData.emergencyContactName || undefined,
          emergencyContactPhone: formData.emergencyContactPhone || undefined,
          hasCriminalRecord: formData.hasCriminalRecord,
          hasVisaDenied: formData.hasVisaDenied,
          hasDeportationHistory: formData.hasDeportationHistory,
          currentStep,
        }
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    
    await saveProgress();
    
    if (currentStep === 7) {
      // Go to payment
      navigate(`/payment/${applicationId}`);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 2) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = ((currentStep - 1) / (APPLICATION_STEPS.length - 1)) * 100;

  const stepIcons: Record<number, React.ReactNode> = {
    1: <CheckCircle2 className="w-5 h-5" />,
    2: <User className="w-5 h-5" />,
    3: <FileText className="w-5 h-5" />,
    4: <Phone className="w-5 h-5" />,
    5: <Plane className="w-5 h-5" />,
    6: <Shield className="w-5 h-5" />,
    7: <CheckCircle2 className="w-5 h-5" />,
    8: <CheckCircle2 className="w-5 h-5" />,
  };

  if (authLoading || appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentStepInfo = APPLICATION_STEPS.find(s => s.id === currentStep);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">ETIAS Application Preparation</h1>
                <p className="text-muted-foreground">
                  {currentStepInfo?.title}: {currentStepInfo?.description}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={saveProgress}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Progress
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex justify-between mt-4 overflow-x-auto pb-2">
              {APPLICATION_STEPS.slice(1, -1).map((step) => (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center min-w-[80px] ${
                    step.id === currentStep 
                      ? "text-primary" 
                      : step.id < currentStep 
                        ? "text-primary/60" 
                        : "text-muted-foreground"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    step.id === currentStep 
                      ? "bg-primary text-primary-foreground" 
                      : step.id < currentStep 
                        ? "bg-primary/20" 
                        : "bg-muted"
                  }`}>
                    {step.id < currentStep ? <CheckCircle2 className="w-4 h-4" /> : stepIcons[step.id]}
                  </div>
                  <span className="text-xs text-center">{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {stepIcons[currentStep]}
                {currentStepInfo?.title}
              </CardTitle>
              <CardDescription>
                {currentStepInfo?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 2: Personal Information */}
              {currentStep === 2 && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      placeholder="As shown on passport"
                      className={errors.firstName ? "border-destructive" : ""}
                    />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      placeholder="As shown on passport"
                      className={errors.lastName ? "border-destructive" : ""}
                    />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField("dateOfBirth", e.target.value)}
                      className={errors.dateOfBirth ? "border-destructive" : ""}
                    />
                    {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placeOfBirth">
                      Place of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="placeOfBirth"
                      value={formData.placeOfBirth}
                      onChange={(e) => updateField("placeOfBirth", e.target.value)}
                      placeholder="City, Country"
                      className={errors.placeOfBirth ? "border-destructive" : ""}
                    />
                    {errors.placeOfBirth && <p className="text-sm text-destructive">{errors.placeOfBirth}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Gender <span className="text-destructive">*</span>
                    </Label>
                    <RadioGroup
                      value={formData.gender}
                      onValueChange={(value) => updateField("gender", value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">Female</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">Other</Label>
                      </div>
                    </RadioGroup>
                    {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
                  </div>
                </div>
              )}

              {/* Step 3: Passport Information */}
              {currentStep === 3 && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="passportNumber" className="flex items-center gap-2">
                      Passport Number <span className="text-destructive">*</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enter your passport number exactly as it appears on your passport</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="passportNumber"
                      value={formData.passportNumber}
                      onChange={(e) => updateField("passportNumber", e.target.value.toUpperCase())}
                      placeholder="e.g., AB1234567"
                      className={errors.passportNumber ? "border-destructive" : ""}
                    />
                    {errors.passportNumber && <p className="text-sm text-destructive">{errors.passportNumber}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportIssuingCountry">
                      Issuing Country <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={formData.passportIssuingCountry} 
                      onValueChange={(value) => updateField("passportIssuingCountry", value)}
                    >
                      <SelectTrigger className={errors.passportIssuingCountry ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHENGEN_COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.passportIssuingCountry && <p className="text-sm text-destructive">{errors.passportIssuingCountry}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportIssueDate">
                      Issue Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="passportIssueDate"
                      type="date"
                      value={formData.passportIssueDate}
                      onChange={(e) => updateField("passportIssueDate", e.target.value)}
                      className={errors.passportIssueDate ? "border-destructive" : ""}
                    />
                    {errors.passportIssueDate && <p className="text-sm text-destructive">{errors.passportIssueDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportExpiryDate" className="flex items-center gap-2">
                      Expiry Date <span className="text-destructive">*</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Must be valid for at least 3 months after your planned departure</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="passportExpiryDate"
                      type="date"
                      value={formData.passportExpiryDate}
                      onChange={(e) => updateField("passportExpiryDate", e.target.value)}
                      className={errors.passportExpiryDate ? "border-destructive" : ""}
                    />
                    {errors.passportExpiryDate && <p className="text-sm text-destructive">{errors.passportExpiryDate}</p>}
                  </div>
                </div>
              )}

              {/* Step 4: Contact Information */}
              {currentStep === 4 && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phoneNumber">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => updateField("phoneNumber", e.target.value)}
                      placeholder="+1 234 567 8900"
                      className={errors.phoneNumber ? "border-destructive" : ""}
                    />
                    {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addressLine1">
                      Address Line 1 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="addressLine1"
                      value={formData.addressLine1}
                      onChange={(e) => updateField("addressLine1", e.target.value)}
                      placeholder="Street address"
                      className={errors.addressLine1 ? "border-destructive" : ""}
                    />
                    {errors.addressLine1 && <p className="text-sm text-destructive">{errors.addressLine1}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      value={formData.addressLine2}
                      onChange={(e) => updateField("addressLine2", e.target.value)}
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className={errors.city ? "border-destructive" : ""}
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => updateField("postalCode", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="country">
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={formData.country} 
                      onValueChange={(value) => updateField("country", value)}
                    >
                      <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHENGEN_COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
                  </div>
                </div>
              )}

              {/* Step 5: Travel Details */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>
                      Destination Countries <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select all Schengen countries you plan to visit
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                      {SCHENGEN_COUNTRIES.map((country) => (
                        <div key={country} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dest-${country}`}
                            checked={formData.destinationCountries.includes(country)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateField("destinationCountries", [...formData.destinationCountries, country]);
                              } else {
                                updateField("destinationCountries", formData.destinationCountries.filter(c => c !== country));
                              }
                            }}
                          />
                          <Label htmlFor={`dest-${country}`} className="text-sm cursor-pointer">
                            {country}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {errors.destinationCountries && <p className="text-sm text-destructive">{errors.destinationCountries}</p>}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="plannedArrivalDate">
                        Planned Arrival Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="plannedArrivalDate"
                        type="date"
                        value={formData.plannedArrivalDate}
                        onChange={(e) => updateField("plannedArrivalDate", e.target.value)}
                        className={errors.plannedArrivalDate ? "border-destructive" : ""}
                      />
                      {errors.plannedArrivalDate && <p className="text-sm text-destructive">{errors.plannedArrivalDate}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plannedDepartureDate">
                        Planned Departure Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="plannedDepartureDate"
                        type="date"
                        value={formData.plannedDepartureDate}
                        onChange={(e) => updateField("plannedDepartureDate", e.target.value)}
                        className={errors.plannedDepartureDate ? "border-destructive" : ""}
                      />
                      {errors.plannedDepartureDate && <p className="text-sm text-destructive">{errors.plannedDepartureDate}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accommodationAddress">Accommodation Address</Label>
                    <Textarea
                      id="accommodationAddress"
                      value={formData.accommodationAddress}
                      onChange={(e) => updateField("accommodationAddress", e.target.value)}
                      placeholder="Hotel or accommodation address in Europe (optional)"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                      <Input
                        id="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={(e) => updateField("emergencyContactName", e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                      <Input
                        id="emergencyContactPhone"
                        type="tel"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => updateField("emergencyContactPhone", e.target.value)}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Security Questions */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please answer the following questions honestly. False declarations may result in 
                      denial of entry to the Schengen Area.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 rounded-lg border">
                      <Checkbox
                        id="hasCriminalRecord"
                        checked={formData.hasCriminalRecord}
                        onCheckedChange={(checked) => updateField("hasCriminalRecord", checked)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="hasCriminalRecord" className="cursor-pointer">
                          Have you ever been convicted of a criminal offense in any country?
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          This includes any convictions, regardless of whether they have been expunged
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-4 rounded-lg border">
                      <Checkbox
                        id="hasVisaDenied"
                        checked={formData.hasVisaDenied}
                        onCheckedChange={(checked) => updateField("hasVisaDenied", checked)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="hasVisaDenied" className="cursor-pointer">
                          Have you ever been denied a visa or entry to any country?
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Include any visa refusals or entry denials from any country
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-4 rounded-lg border">
                      <Checkbox
                        id="hasDeportationHistory"
                        checked={formData.hasDeportationHistory}
                        onCheckedChange={(checked) => updateField("hasDeportationHistory", checked)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="hasDeportationHistory" className="cursor-pointer">
                          Have you ever been deported or removed from any country?
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Include voluntary departures under threat of deportation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Review */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <Alert className="border-primary/20 bg-primary/5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      Please review your information carefully before proceeding to payment.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">Personal Information</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Name:</span> {formData.firstName} {formData.lastName}</div>
                        <div><span className="text-muted-foreground">Date of Birth:</span> {formData.dateOfBirth}</div>
                        <div><span className="text-muted-foreground">Place of Birth:</span> {formData.placeOfBirth}</div>
                        <div><span className="text-muted-foreground">Gender:</span> {formData.gender}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">Passport Information</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Passport Number:</span> {formData.passportNumber}</div>
                        <div><span className="text-muted-foreground">Issuing Country:</span> {formData.passportIssuingCountry}</div>
                        <div><span className="text-muted-foreground">Issue Date:</span> {formData.passportIssueDate}</div>
                        <div><span className="text-muted-foreground">Expiry Date:</span> {formData.passportExpiryDate}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">Travel Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Destinations:</span> {formData.destinationCountries.join(", ")}</div>
                        <div><span className="text-muted-foreground">Arrival:</span> {formData.plannedArrivalDate}</div>
                        <div><span className="text-muted-foreground">Departure:</span> {formData.plannedDepartureDate}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 2}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {currentStep === 7 ? "Proceed to Payment" : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <HelpChat />
    </div>
  );
}
