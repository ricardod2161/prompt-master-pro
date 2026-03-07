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
  const subscriptionCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkSubscription = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.user) {
      setSubscription(defaultSubscription);
      setIsSubscriptionLoading(false);
      return;
    }

    const currentUser = currentSession.user;
    setIsSubscriptionLoading(true);
    try {
      // Check developer role — always grants enterprise tier
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('role', 'developer')
        .maybeSingle();

      if (roleData) {
        setSubscription({
          subscribed: true,
          tier: 'enterprise' as SubscriptionTier,
          productId: null,
          subscriptionEnd: null,
          status: 'active',
          isTrialing: false,
          trialEnd: null
        });
        setIsSubscriptionLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
        // Keep previous subscription state on error (don't reset to null)
        setIsSubscriptionLoading(false);
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
      // Keep previous subscription state on error
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (!session) {
          setIsSubscriptionLoading(false);
        }
      }
    );

    // Check current session — subscription will be checked by the user-watching useEffect
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        setIsSubscriptionLoading(false);
      }
    });

    return () => authSubscription.unsubscribe();
  }, []);

  // Check subscription exactly once when user becomes available, then poll every 10 min
  useEffect(() => {
    if (user) {
      checkSubscription();

      // Poll every 10 minutes (was 5 min — excessive)
      subscriptionCheckInterval.current = setInterval(checkSubscription, 10 * 60 * 1000);

      return () => {
        if (subscriptionCheckInterval.current) {
          clearInterval(subscriptionCheckInterval.current);
          subscriptionCheckInterval.current = null;
        }
      };
    } else {
      setSubscription(defaultSubscription);
      if (subscriptionCheckInterval.current) {
        clearInterval(subscriptionCheckInterval.current);
        subscriptionCheckInterval.current = null;
      }
    }
  }, [user, checkSubscription]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
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
