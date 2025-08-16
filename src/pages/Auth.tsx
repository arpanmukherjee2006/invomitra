import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (password: string, isSignUp = false): string | null => {
    if (!password) return 'Password is required';
    if (isSignUp && password.length < 8) return 'Password must be at least 8 characters long';
    return null;
  };

  const validateFullName = (fullName: string): string | null => {
    if (!fullName?.trim()) return 'Full name is required';
    if (fullName.trim().length < 2) return 'Full name must be at least 2 characters long';
    return null;
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;

    // Validate inputs
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError) {
      toast.error(emailError);
      setLoading(false);
      return;
    }

    if (passwordError) {
      toast.error(passwordError);
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        // Handle specific error types
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email address before signing in.');
        } else {
          toast.error(error.message || 'An error occurred during sign in');
        }
      } else {
        toast.success('Welcome back!');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;
    const fullName = (formData.get('fullName') as string)?.trim();

    // Validate inputs
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, true);
    const fullNameError = validateFullName(fullName);

    if (emailError) {
      toast.error(emailError);
      setLoading(false);
      return;
    }

    if (passwordError) {
      toast.error(passwordError);
      setLoading(false);
      return;
    }

    if (fullNameError) {
      toast.error(fullNameError);
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        // Handle specific error types
        if (error.message.includes('User already registered')) {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          toast.error('Password must be at least 8 characters long.');
        } else {
          toast.error(error.message || 'An error occurred during registration');
        }
      } else {
        toast.success('Account created successfully! Please check your email to verify your account.');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">InvoMitra</CardTitle>
          <CardDescription>Create and manage professional invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    autoComplete="name"
                    minLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Create a password (min. 8 characters)"
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;