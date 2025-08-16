import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, CreditCard, Shield, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (priceType: 'monthly' | 'yearly' = 'monthly') => {
    if (!user || !session) {
      console.log('No user or session, redirecting to auth');
      navigate('/auth');
      onClose();
      return;
    }

    setLoading(true);
    try {
      console.log('Starting subscription process...', { 
        hasUser: !!user, 
        hasSession: !!session, 
        userEmail: user.email 
      });
      
      // Refresh session to ensure it's valid
      const { data: { session: refreshedSession } } = await supabase.auth.getSession();
      
      if (!refreshedSession) {
        console.log('No valid session found, redirecting to auth');
        navigate('/auth');
        onClose();
        return;
      }
      
      console.log('Session refreshed, making function call');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceType }
      });

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }

      if (data?.url) {
        // Open Razorpay checkout in a new tab
        window.open(data.url, '_blank');
        onClose();
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Unlimited Invoice Creation',
    'Professional Templates',
    'Advanced Analytics Dashboard',
    'Total Earnings Tracking',
    'Complete Invoice History',
    'Client Management',
    'PDF Export & Email',
    'Multi-Currency Support',
    'Tax Calculations',
    'Payment Tracking',
    'Custom Branding',
    'Automated Reminders',
    'Revenue Reports',
    'Mobile Access',
    'Cloud Backup',
    'Priority Support'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Upgrade to Pro Plan
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Pricing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm font-medium">Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-medium">Yearly</span>
            {isYearly && (
              <Badge variant="secondary" className="ml-2">
                Save ₹189
              </Badge>
            )}
          </div>

          {/* Pricing Card */}
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star className="w-4 h-4 mr-1" />
                  Best Value
                </Badge>
              </div>
              <CardTitle className="text-xl">Pro Plan</CardTitle>
              <div className="mt-2">
                <div className="text-3xl font-bold text-primary">
                  {isYearly ? '₹999/year' : '₹99/month'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isYearly ? '($11.41 USD per year)' : '($1.13 USD per month)'}
                </div>
                {isYearly && (
                  <div className="text-xs text-success mt-2 font-medium">
                    Save ₹189 (get 12 months at the price of 11)
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-success flex-shrink-0" />
                    <span className="text-xs">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-2">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Instant Access</h4>
              <p className="text-xs text-muted-foreground">
                Start using all features immediately
              </p>
            </div>
            <div className="text-center">
              <div className="bg-success/10 p-3 rounded-full w-fit mx-auto mb-2">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Secure & Reliable</h4>
              <p className="text-xs text-muted-foreground">
                Bank-level security for your data
              </p>
            </div>
            <div className="text-center">
              <div className="bg-accent/10 p-3 rounded-full w-fit mx-auto mb-2">
                <CreditCard className="h-6 w-6 text-accent" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Easy Payments</h4>
              <p className="text-xs text-muted-foreground">
                Secure payments via Razorpay
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full" 
              onClick={() => handleSubscribe(isYearly ? 'yearly' : 'monthly')}
              disabled={loading}
            >
              {loading ? 'Processing...' : user ? 
                `Subscribe ${isYearly ? 'Yearly ₹999' : 'Monthly ₹99'}` : 
                `Sign Up & Subscribe ${isYearly ? 'Yearly' : 'Monthly'}`
              }
            </Button>
            
            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                You'll need to sign up first to start your subscription
              </p>
            )}
            
            <div className="text-xs text-center text-muted-foreground">
              Cancel anytime • No setup fees
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;