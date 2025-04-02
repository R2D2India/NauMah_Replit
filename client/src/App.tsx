import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<div>Loading...</div>}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/tracker" component={lazy(() => import("./pages/Tracker"))} />
            <Route path="/resources" component={lazy(() => import("./pages/Resources"))} />
            <Route path="/journal" component={lazy(() => import("./pages/Journal"))} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;