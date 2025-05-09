import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      console.log("Attempting login with credentials:", credentials.username);
      
      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(credentials),
          credentials: "include"
        });
        
        console.log("Login response status:", response.status);
        
        if (!response.ok) {
          const error = await response.json();
          console.error("Login error:", error);
          throw new Error(error.message || "Login failed");
        }
        
        const data = await response.json();
        console.log("Login success:", data);
        return data;
      } catch (error) {
        console.error("Login fetch error:", error);
        throw error;
      }
    },
    onSuccess: async () => {
      // Check the session immediately
      try {
        const sessionResponse = await fetch("/api/admin/session", {
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache",
          }
        });
        
        const sessionData = await sessionResponse.json();
        console.log("Session check after login:", sessionData);
        
        if (sessionData?.isAdmin) {
          toast({
            title: "Login Successful",
            description: "Welcome to the admin dashboard.",
          });
          
          // Invalidate all queries to ensure fresh data
          queryClient.invalidateQueries();
          
          // Redirect to dashboard
          setLocation("/admin/dashboard");
        } else {
          toast({
            title: "Session Error",
            description: "Login succeeded but session was not established properly.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Session check error:", error);
        toast({
          title: "Session Error", 
          description: "Please try again or use a different browser.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-background to-muted/50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-3">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loginMutation.isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMutation.isPending}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}