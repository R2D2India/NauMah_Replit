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

  // Check if user is admin
  const { data: sessionData, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/admin/session"],
    queryFn: async () => {
      const res = await fetch("/api/admin/session", {
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Failed to check session");
      }
      
      return res.json();
    },
    staleTime: 0, // Always refetch when component mounts
    refetchOnWindowFocus: true,
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