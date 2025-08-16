import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authRateLimiter, sanitizeTextInput, isValidEmail } from '@/lib/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    // Input validation and sanitization
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFullName = sanitizeTextInput(fullName, 100);
    
    // Validate inputs
    if (!isValidEmail(sanitizedEmail)) {
      return { error: { message: 'Please enter a valid email address' } };
    }
    
    if (!sanitizedFullName || sanitizedFullName.length < 2) {
      return { error: { message: 'Full name must be at least 2 characters long' } };
    }
    
    if (password.length < 8) {
      return { error: { message: 'Password must be at least 8 characters long' } };
    }
    
    // Check rate limiting
    if (!authRateLimiter.canAttempt(`signup_${sanitizedEmail}`, 3, 15 * 60 * 1000)) {
      return { error: { message: 'Too many signup attempts. Please try again in 15 minutes.' } };
    }
    
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: sanitizedFullName,
          }
        }
      });
      
      if (!error) {
        // Reset rate limiter on successful signup
        authRateLimiter.reset(`signup_${sanitizedEmail}`);
      }
      
      return { error };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: { message: 'An unexpected error occurred during signup' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Input validation and sanitization
    const sanitizedEmail = email.trim().toLowerCase();
    
    // Validate inputs
    if (!isValidEmail(sanitizedEmail)) {
      return { error: { message: 'Please enter a valid email address' } };
    }
    
    if (!password) {
      return { error: { message: 'Password is required' } };
    }
    
    // Check rate limiting
    if (!authRateLimiter.canAttempt(`signin_${sanitizedEmail}`, 5, 15 * 60 * 1000)) {
      return { error: { message: 'Too many login attempts. Please try again in 15 minutes.' } };
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });
      
      if (!error) {
        // Reset rate limiter on successful signin
        authRateLimiter.reset(`signin_${sanitizedEmail}`);
      }
      
      return { error };
    } catch (error: any) {
      console.error('Signin error:', error);
      return { error: { message: 'An unexpected error occurred during signin' } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear local state immediately
      setUser(null);
      setSession(null);
      // Force redirect to landing page
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}