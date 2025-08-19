import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { useState } from 'react';
import SubscriptionModal from './SubscriptionModal';

const PricingSection = () => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isYearly, setIsYearly] = useState(true); // Start with yearly to show ₹999

  const features = [
    'Unlimited Invoice Creation',
    'Professional Invoice Templates',
    'Advanced Analytics Dashboard', 
    'Total Earnings Tracking',
    'Complete Invoice History',
    'Client Management System',
    'PDF Export & Download',
    'Email Invoice Delivery',
    'Multi-Currency Support',
    'Tax Calculation Tools',
    'Custom Branding Options',
    'Payment Status Tracking',
    'Automated Reminders',
    'Detailed Revenue Reports',
    'Mobile Responsive Design',
    'Cloud Data Backup',
    'Priority Customer Support',
    '24/7 Access'
  ];

  return (
    <>
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent{' '}
              <span className="text-primary">Pricing</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get access to all features with our affordable subscription. 
              No hidden fees, no setup costs.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-sm ${!isYearly ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                Monthly
              </span>
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
              <span className={`text-sm ${isYearly ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                Yearly
              </span>
              {isYearly && (
                <Badge variant="secondary" className="ml-2">
                  Save ₹189
                </Badge>
              )}
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="relative border-primary/20 shadow-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </Badge>
              </div>
              
              <CardHeader className="text-center pb-6 pt-8">
                <CardTitle className="text-2xl font-bold">Pro Plan</CardTitle>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-primary">
                    {isYearly ? '₹999' : '₹99'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {isYearly ? '($11.41 USD per year)' : '($1.13 USD per month)'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isYearly ? 'Billed annually' : 'Billed monthly'}
                  </div>
                  {isYearly && (
                    <div className="text-xs text-success mt-2 font-medium">
                      Save ₹189 (get 12 months at the price of 11)
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <Button 
                  size="lg" 
                  className="w-full mb-6"
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  {isYearly ? 'Pay ₹999/year' : 'Pay ₹99/month'}
                </Button>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Everything Included:
                  </h4>
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <div className="text-xs text-muted-foreground text-center">
                    Secure payment via Razorpay • Cancel anytime • No setup fees
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </>
  );
};

export default PricingSection;