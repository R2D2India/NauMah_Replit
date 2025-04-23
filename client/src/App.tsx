import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { setupScrollBehavior } from "./lib/scrollUtils";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";

// A simplified AdminLayout component
function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

// A simplified AppLayout component
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  
  // Initialize scroll behavior fix
  useEffect(() => {
    setupScrollBehavior();
  }, []);
  
  // If the URL starts with /admin, use the admin layout
  const isAdminRoute = location.startsWith("/admin");
  
  return (
    <>
      {isAdminRoute ? (
        <AdminLayout>
          <Switch>
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin/dashboard">
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      ) : (
        <AppLayout>
          <Suspense fallback={<div>Loading...</div>}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/tracker" component={lazy(() => import("./pages/Tracker"))} />
              <Route path="/diet-exercise" component={lazy(() => import("./pages/DietExercise"))} />
              <Route path="/resources" component={lazy(() => import("./pages/Resources"))} />
              <Route path="/journal">
                {() => {
                  window.location.href = "/resources#journal-section";
                  return <div>Redirecting...</div>;
                }}
              </Route>
              <Route path="/privacy" component={Privacy} />
              <Route path="/terms" component={Terms} />
              <Route path="/disclaimer" component={lazy(() => import("./pages/Disclaimer"))} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </AppLayout>
      )}
    </>
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