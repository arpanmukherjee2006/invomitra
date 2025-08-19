import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionContextType {
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user || !session) {
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Checking subscription status...');
      
      // First check local database for subscription status
      const { data: localData, error: localError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (localError) {
        console.error('Local subscription check error:', localError);
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
        setLoading(false);
        return;
      }

      // If we have local data, use it
      if (localData) {
        const isActive = localData.subscribed && 
          (!localData.subscription_end || new Date(localData.subscription_end) > new Date());
        
        console.log('Local subscription status:', { 
          subscribed: localData.subscribed, 
          isActive,
          subscriptionEnd: localData.subscription_end 
        });
        
        setSubscribed(isActive);
        setSubscriptionTier(localData.subscription_tier);
        setSubscriptionEnd(localData.subscription_end);
      } else {
        // No local data, create initial record
        console.log('No local subscription data, creating initial record');
        await supabase
          .from('subscribers')
          .upsert({
            user_id: user.id,
            email: user.email || '',
            subscribed: false,
            subscription_tier: null,
            subscription_end: null,
          }, { onConflict: 'email' });
        
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user || !session) return;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Customer portal error:', error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  useEffect(() => {
    if (user && session) {
      checkSubscription();
      
      // Auto-refresh subscription status every 60 seconds when user is active
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          checkSubscription();
        }
      }, 60000);

      return () => clearInterval(interval);
    } else {
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setLoading(false);
    }
  }, [user, session]);

  return (
    <SubscriptionContext.Provider value={{
      subscribed,
      subscriptionTier,
      subscriptionEnd,
      loading,
      checkSubscription,
      openCustomerPortal
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}