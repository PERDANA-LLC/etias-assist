import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import EligibilityCheck from "./pages/EligibilityCheck";
import Application from "./pages/Application";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Payment from "./pages/Payment";
import Success from "./pages/Success";
import AdminLogin from "./pages/AdminLogin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/eligibility" component={EligibilityCheck} />
      <Route path="/application" component={Application} />
      <Route path="/application/:id" component={Application} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/payment/:applicationId" component={Payment} />
      <Route path="/success/:applicationId" component={Success} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
