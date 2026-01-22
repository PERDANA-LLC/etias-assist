// ETIAS Eligible Countries (Non-EU countries that require ETIAS)
export const ETIAS_ELIGIBLE_COUNTRIES = [
  "Albania", "Andorra", "Antigua and Barbuda", "Argentina", "Australia",
  "Bahamas", "Barbados", "Bosnia and Herzegovina", "Brazil", "Brunei",
  "Canada", "Chile", "Colombia", "Costa Rica", "Dominica",
  "El Salvador", "Georgia", "Grenada", "Guatemala", "Honduras",
  "Hong Kong", "Israel", "Japan", "Kiribati", "Macao",
  "Malaysia", "Marshall Islands", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Montenegro", "New Zealand", "Nicaragua",
  "North Macedonia", "Palau", "Panama", "Paraguay", "Peru",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Serbia", "Seychelles", "Singapore",
  "Solomon Islands", "South Korea", "Taiwan", "Timor-Leste", "Tonga",
  "Trinidad and Tobago", "Tuvalu", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Vanuatu", "Vatican City", "Venezuela"
];

// EU/Schengen Countries (destinations)
export const SCHENGEN_COUNTRIES = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
  "Denmark", "Estonia", "Finland", "France", "Germany", "Greece",
  "Hungary", "Iceland", "Italy", "Latvia", "Liechtenstein", "Lithuania",
  "Luxembourg", "Malta", "Netherlands", "Norway", "Poland", "Portugal",
  "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland"
];

// Travel purposes
export const TRAVEL_PURPOSES = [
  { value: "tourism", label: "Tourism / Leisure" },
  { value: "business", label: "Business" },
  { value: "transit", label: "Transit" },
  { value: "medical", label: "Medical Treatment" },
  { value: "study_short", label: "Short-term Study (up to 90 days)" },
  { value: "other", label: "Other" }
];

// Application form steps
export const APPLICATION_STEPS = [
  { id: 1, title: "Eligibility", description: "Check if you need ETIAS" },
  { id: 2, title: "Personal Info", description: "Your personal details" },
  { id: 3, title: "Passport", description: "Passport information" },
  { id: 4, title: "Contact", description: "Contact details" },
  { id: 5, title: "Travel", description: "Travel plans" },
  { id: 6, title: "Security", description: "Security questions" },
  { id: 7, title: "Review", description: "Review your application" },
  { id: 8, title: "Payment", description: "Complete payment" }
];

// Service fee in cents (EUR)
export const SERVICE_FEE_CENTS = 1900; // €19.00
export const SERVICE_FEE_CURRENCY = "EUR";

// Official ETIAS website
export const OFFICIAL_ETIAS_URL = "https://travel-europe.europa.eu/etias_en";

// Validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[1-9]\d{6,14}$/,
  passportNumber: /^[A-Z0-9]{5,20}$/i,
  postalCode: /^[A-Z0-9\s-]{3,12}$/i
};

// Help topics for AI assistant
export const HELP_TOPICS = {
  eligibility: "ETIAS eligibility requirements and which countries need authorization",
  application: "How to complete the ETIAS application form",
  payment: "Payment process and accepted payment methods",
  processing: "ETIAS processing times and validity",
  documents: "Required documents for ETIAS application",
  travel: "Travel rules and restrictions with ETIAS"
};
