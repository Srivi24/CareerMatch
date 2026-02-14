import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";

import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import AssessmentWizard from "@/pages/AssessmentWizard";
import ResultsPage from "@/pages/ResultsPage";
import AdminPage from "@/pages/AdminPage";
import CareersCoursesPage from "@/pages/CareersCoursesPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Student Routes */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/careers">
        <ProtectedRoute>
          <CareersCoursesPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/assessment/:id">
        <ProtectedRoute>
          <AssessmentWizard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/results/:id">
        <ProtectedRoute>
          <ResultsPage />
        </ProtectedRoute>
      </Route>

      {/* Admin Route */}
      <Route path="/admin">
        <ProtectedRoute adminOnly>
          <AdminPage />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light" storageKey="career-path-theme">
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
