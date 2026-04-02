import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import LoginPage from "./pages/login";
import DashboardPage from "./pages/dashboard";
import CriteriaPage from "./pages/criteria";
import CriteriaFormPage from "./pages/criteria-form";
import ScreenPage from "./pages/screen";
import WatchlistPage from "./pages/watchlist";
import StocksPage from "./pages/stocks";
import { AppLayout } from "./components/Layout";
import { useEffect } from "react";
import { getToken } from "./lib/auth";
import { useLocation } from "wouter";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, setLocation] = useLocation();
  const token = getToken();

  useEffect(() => {
    if (!token && location !== "/") {
      setLocation("/");
    }
  }, [token, location, setLocation]);

  if (!token) return null;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  const [location, setLocation] = useLocation();
  const token = getToken();

  useEffect(() => {
    if (token && location === "/") {
      setLocation("/dashboard");
    }
  }, [token, location, setLocation]);

  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
      <Route path="/criteria"><ProtectedRoute component={CriteriaPage} /></Route>
      <Route path="/criteria/new"><ProtectedRoute component={CriteriaFormPage} /></Route>
      <Route path="/criteria/:id/edit"><ProtectedRoute component={CriteriaFormPage} /></Route>
      <Route path="/screen/:id"><ProtectedRoute component={ScreenPage} /></Route>
      <Route path="/watchlist"><ProtectedRoute component={WatchlistPage} /></Route>
      <Route path="/stocks"><ProtectedRoute component={StocksPage} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
