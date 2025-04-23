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

  // Check admin session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/session");
        const data = await response.json();
        
        if (data.isAdmin) {
          setIsAdmin(true);
          if (data.email) {
            setAdminEmail(data.email);
          }
        }
      } catch (error) {
        console.error("Error checking admin session:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      setLoginError(null);
      const response = await apiRequest("POST", "/api/admin/login", data);
      const result = await response.json();
      
      if (result.success) {
        setIsAdmin(true);
        setAdminEmail(data.username);
      } else {
        setLoginError(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("An error occurred during login");
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
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
      
      const response = await apiRequest("POST", "/api/admin/reset-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
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
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      setterFunction(data);
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error);
    }
  };

  const loadTabData = async (tab: string) => {
    setDataLoading(true);
    
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
        break;
    }
    
    setDataLoading(false);
  };

  // Load data when tab changes
  useEffect(() => {
    if (isAdmin) {
      loadTabData(activeTab);
    }
  }, [isAdmin, activeTab]);

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
              <CardHeader>
                <CardTitle>User Data</CardTitle>
                <CardDescription>List of all registered users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
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
                          <TableCell colSpan={8} className="text-center">No users found</TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.mobileNumber || "—"}</TableCell>
                            <TableCell>{user.age || "—"}</TableCell>
                            <TableCell>{user.pregnancyWeek || user.pregnancyMonth || user.pregnancyTrimester || "—"}</TableCell>
                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pregnancy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pregnancy Data</CardTitle>
                <CardDescription>Pregnancy information for all users</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
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
                            <TableCell>{data.userId}</TableCell>
                            <TableCell>{data.currentWeek}</TableCell>
                            <TableCell>{new Date(data.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(data.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(data.updatedAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mood" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mood Entries</CardTitle>
                <CardDescription>All mood tracking entries</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
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
                            <TableCell>{entry.userId}</TableCell>
                            <TableCell>{entry.week}</TableCell>
                            <TableCell>{entry.mood}</TableCell>
                            <TableCell>{entry.note || "—"}</TableCell>
                            <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Medication Checks</CardTitle>
                <CardDescription>All medication safety checks</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
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
                            <TableCell>{check.userId}</TableCell>
                            <TableCell>{check.medicationName}</TableCell>
                            <TableCell>
                              {check.isSafe === true && "Safe"}
                              {check.isSafe === false && "Not Safe"}
                              {check.isSafe === null && "Unknown"}
                            </TableCell>
                            <TableCell>{check.notes || "—"}</TableCell>
                            <TableCell>{new Date(check.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Support Messages</CardTitle>
                <CardDescription>Messages from the contact form</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
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
                            <TableCell>{message.isRead ? "Yes" : "No"}</TableCell>
                            <TableCell>{new Date(message.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>Change your admin password</CardDescription>
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