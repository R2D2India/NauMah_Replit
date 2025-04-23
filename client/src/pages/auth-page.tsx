import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Forgot password form schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// Reset password form schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation, forgotPasswordMutation, resetPasswordMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Get token from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");
  
  if (tokenFromUrl && !resetToken) {
    setResetToken(tokenFromUrl);
    setActiveTab("reset-password");
  }

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onRegisterSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  // Forgot password form
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onForgotPasswordSubmit = (values: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate({ email: values.email });
  };

  // Reset password form
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: resetToken || "",
      password: "",
      confirmPassword: "",
    },
  });

  const onResetPasswordSubmit = (values: ResetPasswordFormValues) => {
    resetPasswordMutation.mutate({ 
      token: values.token, 
      password: values.password 
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left column - Auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {activeTab === "login" && "Welcome Back"}
              {activeTab === "register" && "Create Account"}
              {activeTab === "forgot-password" && "Reset Password"}
              {activeTab === "reset-password" && "Set New Password"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" && "Sign in to access your pregnancy journey"}
              {activeTab === "register" && "Join NauMah to start your pregnancy journey"}
              {activeTab === "forgot-password" && "Enter your email to receive a reset link"}
              {activeTab === "reset-password" && "Create a new secure password"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
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
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    
                    <div className="text-center mt-4">
                      <Button 
                        variant="link" 
                        type="button"
                        onClick={() => setActiveTab("forgot-password")}
                      >
                        Forgot Password?
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Your email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Forgot Password Tab */}
              <TabsContent value="forgot-password">
                <Form {...forgotPasswordForm}>
                  <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={forgotPasswordMutation.isPending}
                    >
                      {forgotPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>

                    <div className="text-center mt-4">
                      <Button 
                        variant="link" 
                        type="button"
                        onClick={() => setActiveTab("login")}
                      >
                        Back to Login
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Reset Password Tab */}
              <TabsContent value="reset-password">
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={resetPasswordForm.control}
                      name="token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reset Token</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your reset token" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resetPasswordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
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
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={resetPasswordMutation.isPending}
                    >
                      {resetPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>

                    <div className="text-center mt-4">
                      <Button 
                        variant="link" 
                        type="button"
                        onClick={() => setActiveTab("login")}
                      >
                        Back to Login
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <div>
              {activeTab === "login" ? (
                <>Don't have an account? <Button variant="link" onClick={() => setActiveTab("register")} className="p-0">Sign up</Button></>
              ) : (
                <>Already have an account? <Button variant="link" onClick={() => setActiveTab("login")} className="p-0">Sign in</Button></>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right column - Hero section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/20 to-secondary/20 p-8 flex items-center">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">NauMah: Your Pregnancy Companion</h1>
          <div className="space-y-6">
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-lg">Personalized Journey</h3>
              <p>Track your pregnancy progress with week-by-week insights and personalized content.</p>
            </div>
            
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-lg">Smart Safety Tools</h3>
              <p>Check medications and food safety with our AI-powered safety scanner.</p>
            </div>
            
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-lg">Emotional Support</h3>
              <p>Track your mood and get personalized emotional support throughout your pregnancy.</p>
            </div>

            <div className="bg-card p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-lg">Health Tracking</h3>
              <p>Monitor important health metrics, symptoms, and schedule appointments.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}