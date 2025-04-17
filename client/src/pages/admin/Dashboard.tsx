import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, RefreshCw, Users } from "lucide-react";

interface WaitlistEntry {
  id: number;
  name: string;
  email: string;
  mobile: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is admin
  const { data: sessionData, isLoading: checkingSession } = useQuery({
    queryKey: ["/api/admin/session"],
    queryFn: async () => {
      const res = await fetch("/api/admin/session", {
        credentials: "include"
      });
      return res.json();
    },
  });

  // Fetch waitlist entries
  const { 
    data: waitlistData, 
    isLoading: loadingWaitlist,
    refetch: refetchWaitlist
  } = useQuery({
    queryKey: ["/api/admin/waitlist"],
    queryFn: async () => {
      const res = await fetch("/api/admin/waitlist", {
        credentials: "include"
      });
      return res.json() as Promise<WaitlistEntry[]>;
    },
    enabled: !!sessionData?.isAdmin,
  });

  useEffect(() => {
    // Redirect to login if not admin
    if (!checkingSession && sessionData && !sessionData.isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Please log in as an administrator.",
        variant: "destructive",
      });
      setLocation("/admin/login");
    }
  }, [sessionData, checkingSession, setLocation, toast]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include"
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Logout Successful",
          description: "You have been logged out.",
        });
        setLocation("/admin/login");
      } else {
        toast({
          title: "Logout Failed",
          description: data.message || "Failed to log out. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "An error occurred during logout.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionData?.isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your application data</p>
        </div>
        <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Waitlist Entries</CardTitle>
              <CardDescription>
                Total registrations
              </CardDescription>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{waitlistData?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Waitlist Entries</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetchWaitlist()}
              disabled={loadingWaitlist}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingWaitlist ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>
            View all user waitlist registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingWaitlist ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : waitlistData && waitlistData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead className="w-[150px]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitlistData.slice().reverse().map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.id}</TableCell>
                      <TableCell>{entry.name}</TableCell>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>{entry.mobile}</TableCell>
                      <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-center items-center py-8 text-muted-foreground">
              No waitlist entries found
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}