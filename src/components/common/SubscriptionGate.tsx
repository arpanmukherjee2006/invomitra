import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import SubscriptionModal from '@/components/Landing/SubscriptionModal';

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature?: string;
}

const SubscriptionGate = ({ children, feature = "this feature" }: SubscriptionGateProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFeatureAccess = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Temporarily bypass subscription check - redirect directly to dashboard
    navigate('/dashboard');
  };

  // Temporarily bypass subscription loading and checks
  if (!user) {
    return (
      <div onClick={handleFeatureAccess} className="cursor-pointer inline-block">
        {children}
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;