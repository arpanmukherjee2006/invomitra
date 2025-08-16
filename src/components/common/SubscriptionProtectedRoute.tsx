import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SubscriptionModal from '@/components/Landing/SubscriptionModal';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode;
}

const SubscriptionProtectedRoute = ({ children }: SubscriptionProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading, subscriptionTier } = useSubscription();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!subscribed) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="text-center p-8">
              <div className="flex justify-start mb-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/')}
                  className="flex items-center text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
              
              <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-6">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Subscription Required</h1>
              <p className="text-muted-foreground mb-6">
                You need an active subscription to access the dashboard and create invoices. 
                Choose from our affordable plans to get started.
              </p>
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => setShowModal(true)}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  View Subscription Plans
                </Button>
                <div className="text-sm text-muted-foreground">
                  ✓ Monthly: ₹99/month<br />
                  ✓ Yearly: ₹999/year (Save ₹189)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <SubscriptionModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default SubscriptionProtectedRoute;