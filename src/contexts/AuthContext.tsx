import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier } from "@/lib/subscription-tiers";

export interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier | null;
  productId: string | null;
  subscriptionEnd: string | null;
  status: string | null;
  isTrialing: boolean;
  trialEnd: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionState;
  isSubscriptionLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  checkSubscription: () => Promise<void>;
}

const defaultSubscription: SubscriptionState = {
  subscribed: false,
  tier: null,
  productId: null,
  subscriptionEnd: null,
  status: null,
  isTrialing: false,
  trialEnd: null
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const subscriptionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(defaultSubscription);
      return;
    }

    setIsSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      setSubscription({
        subscribed: data.subscribed || false,
        tier: data.tier as SubscriptionTier | null,
        productId: data.productId || null,
        subscriptionEnd: data.subscriptionEnd || null,
        status: data.status || null,
        isTrialing: data.isTrialing || false,
        trialEnd: data.trialEnd || null
      });
    } catch (error) {
      console.error('Failed to check subscription:', error);
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  // Check subscription when user changes
  useEffect(() => {
    if (user) {
      checkSubscription();
      
      // Auto-refresh subscription every 60 seconds
      subscriptionCheckInterval.current = setInterval(() => {
        checkSubscription();
      }, 60000);
    } else {
      setSubscription(defaultSubscription);
    }

    return () => {
      if (subscriptionCheckInterval.current) {
        clearInterval(subscriptionCheckInterval.current);
      }
    };
  }, [user, checkSubscription]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscription(defaultSubscription);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      subscription,
      isSubscriptionLoading,
      signIn, 
      signUp, 
      signOut, 
      resetPassword,
      checkSubscription
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
