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

  // Check if Razorpay is properly configured
  const checkRazorpayConfig = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('test-razorpay');
      
      if (error) {
        console.error('Failed to check Razorpay configuration:', error);
        return false;
      }
      
      if (!data?.config?.hasKeyId || !data?.config?.hasKeySecret) {
        console.error('Razorpay configuration incomplete:', data);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking Razorpay configuration:', error);
      return false;
    }
  };
  
  // Check if browser environment supports Razorpay
  const checkBrowserSupport = (): boolean => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.error('Not in browser environment');
      return false;
    }
    
    // Check if the browser supports required features
    const hasRequiredFeatures = (
      typeof window.fetch === 'function' && // Modern fetch API
      typeof window.Promise === 'function' && // Promises
      typeof window.localStorage !== 'undefined' // LocalStorage
    );
    
    if (!hasRequiredFeatures) {
      console.error('Browser missing required features for Razorpay');
      return false;
    }
    
    return true;
  };

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
      
      // Check if Razorpay is properly configured
      const isRazorpayConfigured = await checkRazorpayConfig();
      if (!isRazorpayConfigured) {
        console.error('Razorpay is not properly configured');
        toast({
          title: "Payment System Not Available",
          description: "The payment system is not properly configured. Please contact support with error code: RZP-CONFIG-CHECK.",
          variant: "destructive"
        });
        setLoading(false);
        setLoadingState('idle');
        return;
      }
      
      // Validate session token
      if (!session.access_token) {
        console.error('Missing access token');
        toast({
          title: "Session error",
          description: "Your session appears to be invalid. Please log out and log in again.",
          variant: "destructive"
        });
        setLoading(false);
        setLoadingState('idle');
        return;
      }
      
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
        let errorTitle = 'Payment Setup Failed';
        let errorMessage = 'Please try again later.';
        
        if (error.message?.includes('Authentication failed')) {
          errorTitle = 'Session Expired';
          errorMessage = 'Your session has expired. Please log in again and try subscribing.';
          
          toast.error(errorTitle, {
            description: errorMessage
          });
          setLoading(false);
          return;
        }
        
        toast.error(errorTitle, {
          description: errorMessage
        });
        setLoading(false);
        return;
      }

      if (data?.orderId && data?.keyId) {
        // Load Razorpay script if not already loaded
        if (!window.Razorpay) {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => initializeRazorpay(data);
          script.onerror = () => {
            toast.error('Failed to load payment gateway', {
              description: 'Please try again.'
            });
            setLoading(false);
          };
          document.body.appendChild(script);
        } else {
          initializeRazorpay(data);
        }
      } else {
        toast.error('Payment Setup Failed', {
          description: 'Failed to create payment order. Please try again.'
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      let errorTitle = 'An unexpected error occurred';
      let errorMessage = 'Please try again.';
      
      if (error.message?.includes('Authentication failed')) {
        errorTitle = 'Session Expired';
        errorMessage = 'Your session has expired. Please log in again and try subscribing.';
        
        toast.error(errorTitle, {
          description: errorMessage
        });
        
        // Redirect to auth page after a short delay
        setTimeout(() => {
          navigate('/auth');
          onClose();
        }, 2000);
      } else if (error.message?.includes('Razorpay credentials not configured')) {
        errorTitle = 'Payment System Not Configured';
        errorMessage = 'The payment system is not properly configured. Please contact support with error code: RZP-ENV-MISSING.';
        console.error('Razorpay credentials missing in environment variables');
        toast.error(errorTitle, {
          description: errorMessage
        });
      } else if (error.message?.includes('Razorpay API error')) {
        errorTitle = 'Payment Gateway Error';
        errorMessage = 'The payment gateway returned an error. Please try again later or contact support with error code: RZP-API-ERROR.';
        console.error('Razorpay API error:', error.message);
      } else if (error.message?.includes('Invalid or missing priceType')) {
        errorTitle = 'Invalid Plan';
        errorMessage = 'Invalid subscription plan selected. Please try again.';
      } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        errorTitle = 'Network Error';
        errorMessage = 'Please check your internet connection and try again.';
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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
      
      // Validate order data
      if (data.amount <= 0) {
        console.error('Invalid order amount:', data.amount);
        toast({
          title: "Invalid Amount",
          description: "Invalid payment amount. Please contact support.",
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
        
        // Set a timeout to handle cases where the script takes too long to load
        const scriptTimeout = setTimeout(() => {
          console.error('Razorpay script load timeout');
          toast({
            title: "Payment Gateway Timeout",
            description: "The payment system is taking too long to load. Please try again later.",
            variant: "destructive"
          });
          setLoading(false);
          setLoadingState('idle');
        }, 10000); // 10 second timeout
        
        script.onload = () => {
          clearTimeout(scriptTimeout);
          console.log('Razorpay script loaded, initializing...');
          toast({
            title: "Payment Gateway Ready",
            description: "Initializing checkout..."
          });
          // Add a small delay to ensure Razorpay is fully initialized
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
          clearTimeout(scriptTimeout);
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
      alert(`Subscription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
>>>>>>> Stashed changes
      setLoading(false);
    }
  };

<<<<<<< Updated upstream
  const initializeRazorpay = (orderData: any) => {
    console.log('Initializing Razorpay with order data:', orderData);
=======
  const initializeRazorpay = async (orderData: {
    keyId: string;
    amount: number;
    currency: string;
    orderId: string;
    planType: string;
    userEmail: string;
  }) => {
    console.log('Initializing Razorpay with:', orderData);
    
    // Ensure Razorpay is available
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
>>>>>>> Stashed changes
    
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'InvoMitra',
      description: `Pro Plan - ${orderData.planType === 'yearly' ? 'Yearly' : 'Monthly'}`,
      order_id: orderData.orderId,
      prefill: {
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
        email: orderData.userEmail,
<<<<<<< Updated upstream
        name: user?.user_metadata?.full_name || '',
=======
        contact: ""
>>>>>>> Stashed changes
      },
      theme: {
        color: '#3B82F6'
      },
      // Handle payment failures
      "handler": function(response: any) {
        // This is handled in the handler function below
      },
      "modal": {
        "ondismiss": function(){
          // This is handled in the modal.ondismiss function below
        }
      },
      // Listen for payment failures
      "callbacks": {
        "on_payment_failed": function(response: any) {
          console.log("Payment failed:", response);
          const errorCode = response.error?.code;
          const errorDescription = response.error?.description;
          const errorSource = response.error?.source;
          const errorStep = response.error?.step;
          const errorReason = response.error?.reason;
          
          // Check for PhonePe specific errors
          if (
            (errorDescription && errorDescription.toLowerCase().includes('phonepe')) ||
            (errorSource && errorSource.toLowerCase().includes('phonepe')) ||
            (errorReason && errorReason.toLowerCase().includes('phonepe'))
          ) {
            console.log("PhonePe payment failed");
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
              title: "Payment Failed",
              description: errorDescription || "Your payment could not be processed. Please try again.",
              variant: "destructive"
            });
          }
          
          setLoading(false);
          setLoadingState('idle');
        }
      },
      handler: async function(response: RazorpayResponse) {
        console.log('Payment successful:', response);
<<<<<<< Updated upstream
        toast.success('Payment successful! Welcome to InvoMitra Pro!');
        // Refresh subscription status
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
        onClose();
        setLoading(false);
=======
        
        // Validate response contains all required fields
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
          
          // Verify payment with backend
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
            
            // Check for PhonePe specific errors in the verification response
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
            title: "Payment Successful!",
            description: `Your ${orderData.planType} subscription is now active.`,
            variant: "default"
          });
          // Redirect with success message and payment ID for reference
          navigate(`/dashboard?success=true&payment_id=${response.razorpay_payment_id}`);
          onClose();
        } catch (error) {
          console.error('Payment verification error:', error);
          toast({
            title: "Verification Error",
            description: `Payment verification failed. Please contact support with this reference: ${response.razorpay_payment_id}`,
            variant: "destructive"
          });
          setLoading(false);
          setLoadingState('idle');
        }
>>>>>>> Stashed changes
      },
      modal: {
        ondismiss: function() {
          console.log('Payment dismissed');
<<<<<<< Updated upstream
          toast.info('Payment cancelled');
=======
          toast({
            title: "Payment Cancelled",
            description: "You cancelled the payment process",
            variant: "default"
          });
>>>>>>> Stashed changes
          setLoading(false);
          setLoadingState('idle');
        },
        escape: false,  // Prevent closing on ESC key
        backdropclose: false,  // Prevent closing on backdrop click
        handlePaymentError: function(error: any) {
          // Custom error handler for payment method failures
          console.error('Payment method error:', error);
          let errorMessage = "Payment could not be completed. Please try again with different payment details.";
          
          // Check for PhonePe specific errors
          if (error?.error?.description?.toLowerCase().includes('phonepe') || 
              error?.error?.reason?.toLowerCase().includes('phonepe')) {
            errorMessage = "PhonePe is facing issues. Try other payment apps.";
          }
          
          toast({
            title: "Payment Failed",
            description: errorMessage,
            variant: "destructive"
          });
        }
      },
      notes: {
        user_id: user?.id,
        plan_type: orderData.planType
      }
    };

<<<<<<< Updated upstream
    try {
    const razorpay = new window.Razorpay(options);
    razorpay.open();
    } catch (error) {
      console.error('Error opening Razorpay:', error);
      toast.error('Failed to open payment gateway. Please try again.');
      setLoading(false);
=======
    console.log('Razorpay options:', options);
    
    try {
      if (!window.Razorpay) {
        throw new Error('Razorpay not loaded');
      }
      
      // Add retry mechanism for failed payments
      const retryPayment = (retryCount = 0) => {
        try {
          const razorpay = new window.Razorpay(options);
          console.log('Razorpay instance created, opening modal...');
          
          // Add event listeners for payment failures
          document.addEventListener('razorpay.payment.failed', function(event) {
            const response = event.detail.response;
            console.error('Payment failed event:', response);
            
            let errorMessage = "Payment could not be completed. Payment was unsuccessful as the details are invalid.";
            let shouldRetry = false;
            
            // Check for specific payment method errors
            if (response?.error?.description?.toLowerCase().includes('phonepe')) {
              errorMessage = "PhonePe is facing issues. Try other apps.";
              shouldRetry = true;
            }
            
            toast({
              title: "Payment Failed",
              description: errorMessage,
              variant: "destructive"
            });
            
            // Auto-retry with different payment method suggestion
            if (shouldRetry && retryCount < 1) {
              setTimeout(() => {
                toast({
                  title: "Retrying Payment",
                  description: "Please try with a different payment method",
                });
                retryPayment(retryCount + 1);
              }, 1500);
            }
          }, { once: true });
          
          razorpay.open();
        } catch (err) {
          console.error('Error in retry payment:', err);
          toast({
            title: "Payment Initialization Failed",
            description: `Failed to initialize payment: ${err instanceof Error ? err.message : 'Unknown error'}`,
            variant: "destructive"
          });
          setLoading(false);
          setLoadingState('idle');
        }
      };
      
      retryPayment();
    } catch (error) {
      console.error('Error creating Razorpay instance:', error);
      toast({
        title: "Payment Initialization Failed",
        description: `Failed to initialize payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      setLoading(false);
      setLoadingState('idle');
>>>>>>> Stashed changes
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

  // Handle retry payment
  const handleRetryPayment = () => {
    setPaymentError({
      isVisible: false,
      type: null
    });
    // Slight delay before retrying
    setTimeout(() => {
      handleSubscribe(isYearly ? 'yearly' : 'monthly');
    }, 500);
  };

  // Handle dismiss error
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
        
        {/* Payment Error Handler */}
        <PaymentErrorHandler 
          errorType={paymentError.type}
          isVisible={paymentError.isVisible}
          onRetry={handleRetryPayment}
          onDismiss={handleDismissError}
        />
        
        <div className="space-y-6">
          {/* Pricing Toggle */}
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

          {/* Loading State Indicator */}
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
              disabled={loadingState !== 'idle'}
            >
<<<<<<< Updated upstream
              {loading ? 'Loading Payment...' : user ? 
                `Pay ${isYearly ? '₹999/year' : '₹99/month'}` : 
                `Sign Up & Pay ${isYearly ? '₹999/year' : '₹99/month'}`
=======
              {loadingState !== 'idle' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingState === 'creating-order' ? 'Creating order...' : 
                   loadingState === 'loading-script' ? 'Loading payment...' : 
                   'Processing payment...'}
                </>
              ) : user ? 
                `Subscribe ${isYearly ? 'Yearly ₹999' : 'Monthly ₹99'}` : 
                `Sign Up & Subscribe ${isYearly ? 'Yearly' : 'Monthly'}`
>>>>>>> Stashed changes
              }
            </Button>
            
            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                You'll need to sign up first to start your subscription
              </p>
            )}
            
            <div className="text-xs text-center text-muted-foreground">
              Secure payment via Razorpay • Cancel anytime • No setup fees
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;