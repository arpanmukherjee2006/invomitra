import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, CreditCard, Shield, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PaymentErrorHandler from './PaymentErrorHandler';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'creating-order' | 'loading-script' | 'processing-payment'>('idle');
  const [isYearly, setIsYearly] = useState(false);
  const [paymentError, setPaymentError] = useState<{
    isVisible: boolean;
    type: 'phonepe' | 'general' | 'invalid_details' | null;
  }>({ isVisible: false, type: null });
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubscribe = async (priceType: 'monthly' | 'yearly' = 'monthly') => {
    if (!user || !session) {
      console.log('No user or session, redirecting to auth');
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe.",
        variant: "destructive"
      });
      navigate('/auth');
      onClose();
      return;
    }

    setLoading(true);
    setLoadingState('creating-order');
    
    try {
      console.log('Starting subscription process...', { 
        hasUser: !!user, 
        hasSession: !!session, 
        userEmail: user.email,
        priceType
      });
      
      toast({
        title: "Preparing your subscription",
        description: "Setting up payment details...",
      });

      // Call Supabase function to create Razorpay order
      console.log('Calling create-checkout function...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceType },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Checkout error:', error);
        toast({
          title: "Payment Setup Failed",
          description: "Please try again later.",
          variant: "destructive"
        });
        setLoading(false);
        setLoadingState('idle');
        return;
      }

      if (!data?.orderId || !data?.keyId) {
        console.error('Invalid order data:', data);
        toast({
          title: "Order Creation Failed",
          description: "Failed to create payment order. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
        setLoadingState('idle');
        return;
      }

      toast({
        title: "Order Created",
        description: "Preparing payment gateway..."
      });

      console.log('Order created successfully:', data);
      
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        console.log('Loading Razorpay script...');
        setLoadingState('loading-script');
        toast({
          title: "Loading Payment Gateway",
          description: "Please wait while we prepare the payment system..."
        });
        
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Razorpay script loaded, initializing...');
          toast({
            title: "Payment Gateway Ready",
            description: "Initializing checkout..."
          });
          setTimeout(() => {
            try {
              initializeRazorpay(data);
            } catch (error) {
              console.error('Failed to initialize Razorpay after script load:', error);
              toast({
                title: "Payment Gateway Error",
                description: "Failed to initialize payment system. Please try again later.",
                variant: "destructive"
              });
              setPaymentError({
                isVisible: true,
                type: 'general'
              });
              setLoading(false);
              setLoadingState('idle');
            }
          }, 500);
        };
        
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          toast({
            title: "Payment Gateway Error",
            description: "Failed to load payment system. Please try again later.",
            variant: "destructive"
          });
          setLoading(false);
          setLoadingState('idle');
        };
        document.body.appendChild(script);
      } else {
        console.log('Razorpay already loaded, initializing...');
        toast({
          title: "Payment Gateway Ready",
          description: "Initializing checkout..."
        });
        initializeRazorpay(data);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "An unexpected error occurred",
        description: "Please try again.",
        variant: "destructive"
      });
      setLoading(false);
      setLoadingState('idle');
    }
  };

  const initializeRazorpay = async (orderData: {
    keyId: string;
    amount: number;
    currency: string;
    orderId: string;
    planType: string;
    userEmail: string;
  }) => {
    console.log('Initializing Razorpay with:', orderData);
    
    if (typeof window.Razorpay !== 'function') {
      console.error('Razorpay is not available as a function');
      toast({
        title: "Payment System Error",
        description: "Payment system is not properly loaded. Please refresh the page and try again.",
        variant: "destructive"
      });
      setLoading(false);
      setLoadingState('idle');
      return;
    }
    
    setLoadingState('processing-payment');
    
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'InvoMitra',
      description: `Pro Plan - ${orderData.planType === 'yearly' ? 'Yearly' : 'Monthly'}`,
      order_id: orderData.orderId,
      prefill: {
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
        email: orderData.userEmail,
        contact: ""
      },
      theme: {
        color: '#3B82F6'
      },
      handler: async function(response: RazorpayResponse) {
        console.log('Payment successful:', response);
        
        if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
          console.error('Invalid payment response:', response);
          toast({
            title: "Payment Failed",
            description: "Payment details are invalid. Please try again with different payment method.",
            variant: "destructive"
          });
          setPaymentError({
            isVisible: true,
            type: 'invalid_details'
          });
          setLoading(false);
          setLoadingState('idle');
          return;
        }
        
        try {
          toast({
            title: "Payment Received",
            description: "Verifying your payment..."
          });
          
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
            body: {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            },
            headers: {
              Authorization: `Bearer ${session?.access_token ?? ''}`,
            },
          });

          if (verifyError) {
            console.error('Payment verification failed:', verifyError);
            
            const errorMessage = verifyError.message || '';
            if (errorMessage.toLowerCase().includes('phonepe')) {
              setPaymentError({
                isVisible: true,
                type: 'phonepe'
              });
              toast({
                title: "PhonePe Payment Failed",
                description: "PhonePe is facing issues. Please try with a different payment method.",
                variant: "destructive"
              });
            } else {
              setPaymentError({
                isVisible: true,
                type: 'general'
              });
              toast({
                title: "Verification Failed",
                description: `Payment verification failed. Please contact support with this reference: ${response.razorpay_payment_id}`,
                variant: "destructive"
              });
            }
            
            setLoading(false);
            setLoadingState('idle');
            return;
          }

          console.log('Payment verified successfully:', verifyData);
          toast({
            title: "Subscription Activated!",
            description: "Welcome to Pro! Your subscription is now active.",
          });
          
          setLoading(false);
          setLoadingState('idle');
          onClose();
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          
        } catch (error) {
          console.error('Payment verification error:', error);
          toast({
            title: "Verification Error",
            description: "Failed to verify payment. Please contact support.",
            variant: "destructive"
          });
          setLoading(false);
          setLoadingState('idle');
        }
      },
      modal: {
        ondismiss: function() {
          console.log('Payment dismissed');
          toast({
            title: "Payment Cancelled",
            description: "You cancelled the payment process",
            variant: "default"
          });
          setLoading(false);
          setLoadingState('idle');
        }
      },
      notes: {
        user_id: user?.id,
        plan_type: orderData.planType
      }
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error opening Razorpay:', error);
      toast({
        title: "Payment Initialization Failed",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
      setLoadingState('idle');
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

  const handleRetryPayment = () => {
    setPaymentError({
      isVisible: false,
      type: null
    });
    setTimeout(() => {
      handleSubscribe(isYearly ? 'yearly' : 'monthly');
    }, 500);
  };

  const handleDismissError = () => {
    setPaymentError({
      isVisible: false,
      type: null
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Upgrade to Pro Plan
          </DialogTitle>
        </DialogHeader>
        
        <PaymentErrorHandler 
          errorType={paymentError.type}
          isVisible={paymentError.isVisible}
          onRetry={handleRetryPayment}
          onDismiss={handleDismissError}
        />
        
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm font-medium">Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? 'bg-primary' : 'bg-muted'
              }`}
              disabled={loadingState !== 'idle'}
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

          {loadingState !== 'idle' && (
            <div className="flex items-center justify-center gap-2 py-2 bg-muted/50 rounded-md p-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">
                {loadingState === 'creating-order' && 'Creating your order...'}
                {loadingState === 'loading-script' && 'Loading payment gateway...'}
                {loadingState === 'processing-payment' && 'Processing payment...'}
              </span>
            </div>
          )}

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

          <div className="space-y-3">
            {/* Payment temporarily disabled for testing */}
            <Button 
              size="lg" 
              className="w-full" 
              disabled={true}
            >
              Payment Gateway Under Maintenance
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Payment gateway is temporarily disabled for testing. All features are currently available for free.
            </p>
            
            <div className="text-xs text-center text-muted-foreground">
              Contact support if you need immediate access
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;