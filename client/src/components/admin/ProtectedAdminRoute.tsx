import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [checkedSession, setCheckedSession] = useState(false);

  // Check if user is admin - custom function to avoid stale data
  const fetchSession = async () => {
    console.log("Checking admin session with direct fetch...");
    try {
      const res = await fetch("/api/admin/session", {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
      
      console.log("Direct session check response status:", res.status);
      
      if (!res.ok) {
        console.error("Direct session check failed with status:", res.status);
        return { isAdmin: false };
      }
      
      const data = await res.json();
      console.log("Direct session check result:", data);
      return data;
    } catch (error) {
      console.error("Direct session check fetch error:", error);
      return { isAdmin: false };
    }
  };

  // Use React Query for session data
  const { data: sessionData, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/admin/session"],
    queryFn: fetchSession,
    staleTime: 0, // Never consider cached data fresh
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    retry: 1, // Only retry once to avoid excessive requests
  });

  useEffect(() => {
    const checkSession = async () => {
      if (!isLoading) {
        if (!sessionData?.isAdmin) {
          toast({
            title: "Authentication Required",
            description: "Please login to access the admin dashboard.",
            variant: "destructive",
          });
          setLocation("/admin/login");
        }
        setCheckedSession(true);
      }
    };
    
    checkSession();
  }, [sessionData, isLoading, setLocation, toast]);

  // Force a refetch when the component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  if (isLoading || !checkedSession) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !sessionData?.isAdmin) {
    return null;
  }

  return <>{children}</>;
}