import { ReactNode, useEffect } from "react";
import { useNavigate } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const [, navigate] = useNavigate();
  const { toast } = useToast();

  // Check if user is admin
  const { data: sessionData, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/session"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/session");
      return res.json();
    },
  });

  useEffect(() => {
    if (!isLoading && !sessionData?.isAdmin) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the admin dashboard.",
        variant: "destructive",
      });
      navigate("/admin/login");
    }
  }, [sessionData, isLoading, navigate, toast]);

  if (isLoading) {
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