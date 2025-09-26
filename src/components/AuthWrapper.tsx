import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import floatingIslandBg from '@/assets/new-floating-island-bg.png';
import edgeExplorerLogo from '@/assets/edge-explorer-logo.png';

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode;
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const [guestUser, setGuestUser] = useState<any>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Welcome back!" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        if (error) throw error;
        toast({ 
          title: "Account created!", 
          description: "Please check your email to verify your account." 
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: `url(${floatingIslandBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white drop-shadow-lg" />
        </div>
      </div>
    );
  }

  if (!user && !guestUser) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: `url(${floatingIslandBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-blue-800/20" />
        
        {/* Glassmorphic card */}
        <Card className="w-full max-w-md relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="mb-6 flex justify-center">
                <img 
                  src={edgeExplorerLogo} 
                  alt="Edge Explorer Characters" 
                  className="w-32 h-32 object-contain drop-shadow-2xl rounded-3xl bg-white/10 backdrop-blur-sm p-3 border border-white/20 hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg font-outfit">
                Edge Explorer
              </h1>
              <p className="text-white/80 text-lg drop-shadow-sm">
                {authMode === 'signin' ? 'Welcome back to the adventure' : 'Begin your journey'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-2xl h-12 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-2xl h-12 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                  placeholder="Enter your password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-2xl font-semibold text-lg backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl" 
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                {authMode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Button>
            </div>

            <div className="mt-8 text-center">
              <Button
                variant="ghost"
                onClick={() => setGuestUser({ id: 'guest', email: 'guest@example.com', isGuest: true })}
                className="text-white/90 hover:text-white bg-white/5 hover:bg-white/15 border border-white/20 rounded-2xl px-6 py-3 font-medium transition-all duration-300 backdrop-blur-sm"
              >
                Continue as Eddie (Guest)
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      {children((user || guestUser) as any)}
    </div>
  );
};