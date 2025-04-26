import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, LogIn, ShieldAlert, Key, Eye, EyeOff, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Password reset schema
const resetPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AdminPage() {
  const [, navigate] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("users");
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [pregnancyData, setPregnancyData] = useState<any[]>([]);
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [medicationChecks, setMedicationChecks] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  
  // Function to force refresh using XMLHttpRequest as a fallback
  const forceRefreshWithXHR = () => {
    console.log("Using XHR as fallback for data fetch");
    try {
      const xhr = new XMLHttpRequest();
      const timestamp = Date.now();
      
      xhr.open('GET', `/api/admin/users?_=${timestamp}`, true);
      xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      xhr.setRequestHeader('Pragma', 'no-cache');
      xhr.setRequestHeader('Expires', '0');
      xhr.setRequestHeader('X-Production-XHR-Fetch', 'true');
      xhr.withCredentials = true;
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log("XHR response received, status:", xhr.status);
          console.log("XHR response text (first 100 chars):", xhr.responseText.substring(0, 100) + "...");
          
          try {
            const data = JSON.parse(xhr.responseText);
            console.log("XHR fetch found", data.length, "users");
            
            if (Array.isArray(data) && data.length > 0) {
              setUsers(data);
              console.log("Users updated via XHR");
              
              // Force a UI update
              setTimeout(() => {
                const tempTab = activeTab;
                setActiveTab("settings");
                setTimeout(() => setActiveTab(tempTab), 50);
              }, 200);
            }
          } catch (e) {
            console.error("Failed to parse XHR JSON response", e);
          }
        } else {
          console.error("XHR fetch failed with status:", xhr.status);
        }
      };
      
      xhr.onerror = function() {
        console.error("XHR request failed");
      };
      
      xhr.send();
    } catch (e) {
      console.error("XHR fallback failed", e);
    }
  };

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const resetPasswordForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Check admin session on load and pre-load data
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Checking admin session...");
        const response = await fetch("/api/admin/session", {
          method: "GET", 
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Admin session check response:", data);
        
        if (data.isAdmin) {
          console.log("Valid admin session found");
          setIsAdmin(true);
          if (data.email) {
            setAdminEmail(data.email);
          }
          
          // Pre-load user data to ensure it's always available
          try {
            console.log("Pre-loading user data...");
            const userResponse = await fetch("/api/admin/users", {
              credentials: "include",
              headers: {
                "Accept": "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache"
              }
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              console.log(`Pre-loaded ${userData.length} users`);
              if (Array.isArray(userData) && userData.length > 0) {
                setUsers(userData);
              }
            }
          } catch (userError) {
            console.error("Error pre-loading user data:", userError);
          }
        } else {
          console.log("No admin session found");
        }
      } catch (error) {
        console.error("Error checking admin session:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Periodically check session to ensure it doesn't expire
    const sessionCheckInterval = setInterval(checkSession, 60000);
    return () => clearInterval(sessionCheckInterval);
  }, []);

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      setLoginError(null);
      console.log("Attempting admin login with email:", data.username);
      
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        },
        credentials: "include",
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      console.log("Login response:", result);
      
      if (result.success) {
        console.log("Login successful, setting admin state");
        
        // Reset all data states before setting admin flag
        setUsers([]);
        setPregnancyData([]);
        setMoodEntries([]);
        setMedicationChecks([]);
        setSupportMessages([]);
        
        setIsAdmin(true);
        setAdminEmail(data.username);
        
        // After login immediately try to load the user data
        // with a production-specific approach for reliable data loading
        setTimeout(async () => {
          try {
            console.log("Production post-login data load starting");
            
            // Create a unique cache buster
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000000);
            const cacheBuster = `nocache=${timestamp}-${random}`;
            
            // Make the request with all cache prevention headers
            const response = await fetch(`/api/admin/users?${cacheBuster}`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Production-Login-Load': 'true'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log("Post-login load found", data.length, "users");
              
              if (Array.isArray(data) && data.length > 0) {
                setUsers(data);
                console.log("User data loaded directly after login");
              }
            }
          } catch (e) {
            console.error("Post-login data load failed", e);
            // If direct fetch fails, try XHR as fallback
            forceRefreshWithXHR();
          }
        }, 500);
      } else {
        console.error("Login failed:", result.message);
        setLoginError(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("An error occurred during login");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include"
      });
      setIsAdmin(false);
      setAdminEmail(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleResetPassword = async (data: z.infer<typeof resetPasswordSchema>) => {
    try {
      setResetError(null);
      setResetSuccess(null);
      
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResetSuccess("Password updated successfully");
        resetPasswordForm.reset();
      } else {
        setResetError(result.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setResetError("An error occurred while updating the password");
    }
  };

  const fetchData = async (endpoint: string, setterFunction: React.Dispatch<React.SetStateAction<any[]>>) => {
    try {
      setDataLoading(true);
      
      // Add cache busting parameter with timestamp
      const cacheBuster = `t=${Date.now()}`;
      const url = endpoint.includes('?') ? `${endpoint}&${cacheBuster}` : `${endpoint}?${cacheBuster}`;
      
      console.log(`Fetching data from: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const dataCount = Array.isArray(data) ? data.length : 0;
      const dataCountHeader = response.headers.get('X-Data-Count');
      const dataTimeHeader = response.headers.get('X-Data-Time');
      
      console.log(`Data received from ${endpoint}: ${dataCount} items`);
      console.log(`Response headers: X-Data-Count=${dataCountHeader}, X-Data-Time=${dataTimeHeader}`);
      console.log(`First item sample:`, data.length > 0 ? JSON.stringify(data[0]) : 'No data');
      
      if (Array.isArray(data)) {
        console.log(`Setting ${dataCount} items from ${endpoint}`);
        setterFunction(data);
        
        // Force a component update with a timeout
        setTimeout(() => {
          console.log(`Current state after setting ${endpoint} data:`, 
            endpoint.includes('users') ? `${users.length} users` : 
            endpoint.includes('pregnancy') ? `${pregnancyData.length} pregnancy records` : 
            endpoint.includes('mood') ? `${moodEntries.length} mood entries` : 
            endpoint.includes('medication') ? `${medicationChecks.length} medication checks` : 
            endpoint.includes('support') ? `${supportMessages.length} support messages` : 'unknown');
        }, 100);
      } else {
        console.error(`Expected array but received: ${typeof data}`, data);
        setterFunction([]);
      }
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error);
      // Don't reset the existing data on error to avoid flickering empty tables
    } finally {
      setDataLoading(false);
    }
  };

  const loadTabData = async (tab: string) => {
    console.log(`Loading data for tab: ${tab}`);
    
    switch (tab) {
      case "users":
        await fetchData("/api/admin/users", setUsers);
        break;
      case "pregnancy":
        await fetchData("/api/admin/pregnancy-data", setPregnancyData);
        break;
      case "mood":
        await fetchData("/api/admin/mood-entries", setMoodEntries);
        break;
      case "medication":
        await fetchData("/api/admin/medication-checks", setMedicationChecks);
        break;
      case "support":
        await fetchData("/api/admin/support-messages", setSupportMessages);
        break;
      case "settings":
        // No data to load for settings tab
        setDataLoading(false);
        break;
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (isAdmin) {
      console.log(`Admin authenticated, loading initial data for tab: ${activeTab}`);
      // Small delay to ensure everything is initialized
      setTimeout(() => {
        loadTabData(activeTab);
      }, 500);
    }
  }, [isAdmin, activeTab]);
  
  // Refresh data periodically (every 30 seconds)
  useEffect(() => {
    if (!isAdmin) return;
    
    const refreshInterval = setInterval(() => {
      if (!dataLoading) {
        console.log('Refreshing admin data...');
        loadTabData(activeTab);
      }
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [isAdmin, activeTab, dataLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-primary" />
              <span>Admin Login</span>
            </CardTitle>
            <CardDescription>
              Login to access the NauMah admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-400">
                            <User size={18} />
                          </span>
                          <Input
                            placeholder="Enter admin email"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-400">
                            <Key size={18} />
                          </span>
                          <Input
                            type="password"
                            placeholder="Enter admin password"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {loginError && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <LogIn size={18} className="mr-2" />
                  )}
                  Login
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShieldAlert className="h-6 w-6 text-primary mr-2" />
            NauMah Admin
          </h1>
          <div className="flex items-center gap-4">
            {adminEmail && (
              <span className="text-sm text-gray-600">
                Logged in as: <span className="font-semibold">{adminEmail}</span>
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid grid-cols-6 w-full">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="pregnancy">Pregnancy</TabsTrigger>
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="medication">Medication</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Data</CardTitle>
                  <CardDescription>List of all registered users in the system</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadTabData("users")}
                >
                  Refresh Data
                </Button>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2 flex justify-between items-center">
                      <span>
                        {users.length > 0 ? (
                          <span>Showing {users.length} users</span>
                        ) : (
                          <span>No users found in database</span>
                        )}
                      </span>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={async () => {
                          console.log("PRODUCTION DIRECT DOM UPDATE ATTEMPT");
                          try {
                            setDataLoading(true);
                            
                            // Extremely aggressive cache prevention
                            const uniqueId = Math.random().toString(36).substring(2, 15) + 
                                           Math.random().toString(36).substring(2, 15);
                            const timestamp = Date.now();
                            const url = `/api/admin/users?_nocache=${timestamp}&_uid=${uniqueId}`;
                            
                            console.log("Direct DOM production fix - fetching from:", url);
                            
                            // Direct XHR fetch with credentials
                            const xhr = new XMLHttpRequest();
                            xhr.open('GET', url, true);
                            xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
                            xhr.setRequestHeader('Pragma', 'no-cache');
                            xhr.setRequestHeader('Expires', '0');
                            xhr.setRequestHeader('X-Production-Emergency', 'true');
                            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                            xhr.withCredentials = true;
                            
                            xhr.onload = function() {
                              if (xhr.status >= 200 && xhr.status < 300) {
                                try {
                                  console.log("XHR response received:", xhr.status);
                                  console.log("Raw response (first 100 chars):", xhr.responseText.substring(0, 100));
                                  
                                  // Parse the response
                                  const userData = JSON.parse(xhr.responseText);
                                  
                                  if (Array.isArray(userData) && userData.length > 0) {
                                    console.log("DIRECT DOM UPDATE: Found", userData.length, "users");
                                    
                                    // Update React state first as a fallback
                                    setUsers(userData);
                                    
                                    // DIRECT DOM MANIPULATION FOR PRODUCTION
                                    // First, clear current table rows except header
                                    setTimeout(() => {
                                      try {
                                        const table = document.querySelector('table');
                                        if (table) {
                                          const tbody = table.querySelector('tbody');
                                          if (tbody) {
                                            // Check if we need to replace "No users found" row
                                            const emptyRow = tbody.querySelector('tr td[colspan="8"]');
                                            if (emptyRow) {
                                              // Clear the tbody
                                              tbody.innerHTML = '';
                                            }
                                            
                                            // Add new rows with user data
                                            userData.forEach(user => {
                                              const row = document.createElement('tr');
                                              row.className = 'border-b transition-colors hover:bg-muted/50';
                                              
                                              // Add cells
                                              [
                                                user.id,
                                                user.username,
                                                user.email || '',
                                                `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`,
                                                user.mobileNumber || user.mobile_number || '—',
                                                user.age || '—',
                                                user.pregnancyWeek || user.pregnancyMonth || user.pregnancyTrimester || '—',
                                                new Date(user.createdAt || user.created_at).toLocaleDateString()
                                              ].forEach(text => {
                                                const cell = document.createElement('td');
                                                cell.className = 'p-4 align-middle';
                                                cell.textContent = String(text);
                                                row.appendChild(cell);
                                              });
                                              
                                              tbody.appendChild(row);
                                            });
                                            
                                            // Update count text
                                            const countSpan = document.querySelector('.text-sm.text-muted-foreground span');
                                            if (countSpan) {
                                              countSpan.textContent = `Showing ${userData.length} users`;
                                            }
                                            
                                            console.log("PRODUCTION FIX: Direct DOM update completed");
                                          }
                                        }
                                      } catch (domError) {
                                        console.error("Direct DOM manipulation failed:", domError);
                                      }
                                    }, 200);
                                  } else {
                                    console.error("No user data found in response");
                                  }
                                } catch (parseError) {
                                  console.error("Failed to parse response:", parseError);
                                }
                              } else {
                                console.error("XHR request failed:", xhr.status);
                                
                                // Last resort - try direct API request and alert
                                try {
                                  const emergencyFetch = new XMLHttpRequest();
                                  emergencyFetch.open('GET', '/api/admin/users?_emergency=true', true);
                                  emergencyFetch.withCredentials = true;
                                  emergencyFetch.send();
                                } catch (e) {
                                  console.error("Emergency XHR failed:", e);
                                }
                              }
                              setDataLoading(false);
                            };
                            
                            xhr.onerror = function() {
                              console.error("XHR network error");
                              setDataLoading(false);
                            };
                            
                            xhr.send();
                          } catch (e) {
                            console.error("Production fix attempt failed:", e);
                            setDataLoading(false);
                          }
                        }}
                      >
                        Force Refresh
                      </Button>
                    </div>
                    <Table>
                      <TableCaption>List of all registered users</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Pregnancy Week</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center">
                              <div>No users found</div>
                              <Button 
                                onClick={() => loadTabData("users")} 
                                variant="ghost" 
                                size="sm"
                                className="mt-2"
                              >
                                Try Again
                              </Button>
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.id}</TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                {user.firstName || user.first_name} {user.lastName || user.last_name}
                              </TableCell>
                              <TableCell>{user.mobileNumber || user.mobile_number || "—"}</TableCell>
                              <TableCell>{user.age || "—"}</TableCell>
                              <TableCell>{user.pregnancyWeek || user.pregnancyMonth || user.pregnancyTrimester || "—"}</TableCell>
                              <TableCell>{new Date(user.createdAt || user.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pregnancy" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pregnancy Data</CardTitle>
                  <CardDescription>Pregnancy information for all users</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadTabData("pregnancy")}
                >
                  Refresh Data
                </Button>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {pregnancyData.length > 0 ? (
                        <span>Showing {pregnancyData.length} pregnancy records</span>
                      ) : (
                        <span>No pregnancy data found in database</span>
                      )}
                    </div>
                    <Table>
                      <TableCaption>Pregnancy data for all users</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Current Week</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead>Updated At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pregnancyData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">No pregnancy data found</TableCell>
                          </TableRow>
                        ) : (
                          pregnancyData.map((data) => (
                            <TableRow key={data.id}>
                              <TableCell>{data.id}</TableCell>
                              <TableCell>{data.userId || data.user_id}</TableCell>
                              <TableCell>{data.currentWeek || data.current_week}</TableCell>
                              <TableCell>{new Date(data.dueDate || data.due_date).toLocaleDateString()}</TableCell>
                              <TableCell>{new Date(data.createdAt || data.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>{new Date(data.updatedAt || data.updated_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mood" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mood Entries</CardTitle>
                  <CardDescription>All mood tracking entries</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadTabData("mood")}
                >
                  Refresh Data
                </Button>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {moodEntries.length > 0 ? (
                        <span>Showing {moodEntries.length} mood entries</span>
                      ) : (
                        <span>No mood entries found in database</span>
                      )}
                    </div>
                    <Table>
                      <TableCaption>Mood entries from all users</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Week</TableHead>
                          <TableHead>Mood</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {moodEntries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">No mood entries found</TableCell>
                          </TableRow>
                        ) : (
                          moodEntries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>{entry.id}</TableCell>
                              <TableCell>{entry.userId || entry.user_id}</TableCell>
                              <TableCell>{entry.week}</TableCell>
                              <TableCell>{entry.mood}</TableCell>
                              <TableCell>{entry.note || "—"}</TableCell>
                              <TableCell>{new Date(entry.createdAt || entry.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medication" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Medication Checks</CardTitle>
                  <CardDescription>All medication safety checks</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadTabData("medication")}
                >
                  Refresh Data
                </Button>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {medicationChecks.length > 0 ? (
                        <span>Showing {medicationChecks.length} medication checks</span>
                      ) : (
                        <span>No medication checks found in database</span>
                      )}
                    </div>
                    <Table>
                      <TableCaption>Medication safety checks from all users</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Medication</TableHead>
                          <TableHead>Safe</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {medicationChecks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">No medication checks found</TableCell>
                          </TableRow>
                        ) : (
                          medicationChecks.map((check) => (
                            <TableRow key={check.id}>
                              <TableCell>{check.id}</TableCell>
                              <TableCell>{check.userId || check.user_id}</TableCell>
                              <TableCell>{check.medicationName || check.medication_name}</TableCell>
                              <TableCell>
                                {check.isSafe === true && "Safe"}
                                {check.isSafe === false && "Not Safe"}
                                {check.is_safe === true && "Safe"}
                                {check.is_safe === false && "Not Safe"}
                                {(check.isSafe === null && check.is_safe === null) && "Unknown"}
                              </TableCell>
                              <TableCell>{check.notes || "—"}</TableCell>
                              <TableCell>{new Date(check.createdAt || check.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Support Messages</CardTitle>
                  <CardDescription>Messages from the contact form</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadTabData("support")}
                >
                  Refresh Data
                </Button>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {supportMessages.length > 0 ? (
                        <span>Showing {supportMessages.length} support messages</span>
                      ) : (
                        <span>No support messages found in database</span>
                      )}
                    </div>
                    <Table>
                      <TableCaption>Support messages from users</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Read</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supportMessages.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">No support messages found</TableCell>
                          </TableRow>
                        ) : (
                          supportMessages.map((message) => (
                            <TableRow key={message.id}>
                              <TableCell>{message.id}</TableCell>
                              <TableCell>{message.name}</TableCell>
                              <TableCell>{message.email}</TableCell>
                              <TableCell>{message.subject || "—"}</TableCell>
                              <TableCell className="max-w-xs truncate">{message.message}</TableCell>
                              <TableCell>{message.isRead || message.is_read ? "Yes" : "No"}</TableCell>
                              <TableCell>{new Date(message.createdAt || message.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Admin Settings</CardTitle>
                  <CardDescription>Change your admin password</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => resetPasswordForm.reset()}
                >
                  Reset Form
                </Button>
              </CardHeader>
              <CardContent>
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                    <FormField
                      control={resetPasswordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-gray-400">
                                <Key size={18} />
                              </span>
                              <Input
                                type={showCurrentPassword ? "text" : "password"}
                                placeholder="Enter current password"
                                className="pl-10 pr-10"
                                {...field}
                              />
                              <span 
                                className="absolute right-3 top-3 text-gray-400 cursor-pointer" 
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={resetPasswordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-gray-400">
                                <Key size={18} />
                              </span>
                              <Input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                className="pl-10 pr-10"
                                {...field}
                              />
                              <span 
                                className="absolute right-3 top-3 text-gray-400 cursor-pointer" 
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={resetPasswordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-gray-400">
                                <Key size={18} />
                              </span>
                              <Input
                                type="password"
                                placeholder="Confirm new password"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {resetError && (
                      <Alert variant="destructive">
                        <AlertDescription>{resetError}</AlertDescription>
                      </Alert>
                    )}
                    {resetSuccess && (
                      <Alert variant="default" className="bg-green-50 border-green-200">
                        <AlertDescription>{resetSuccess}</AlertDescription>
                      </Alert>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={resetPasswordForm.formState.isSubmitting}
                    >
                      {resetPasswordForm.formState.isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Key size={18} className="mr-2" />
                      )}
                      Update Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}