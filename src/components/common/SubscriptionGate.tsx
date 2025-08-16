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
  const { subscribed, loading } = useSubscription();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleFeatureAccess = () => {
    console.log('SubscriptionGate - handleFeatureAccess called', { user: !!user, subscribed, loading });
    
    if (!user) {
      console.log('SubscriptionGate - No user, redirecting to /auth');
      navigate('/auth');
      return;
    }

    if (!subscribed) {
      console.log('SubscriptionGate - User exists but not subscribed, showing modal');
      setShowModal(true);
      return;
    }

    console.log('SubscriptionGate - User subscribed, allowing access');
    // If subscribed, allow access by clicking
    return;
  };

  if (loading) {
    return (
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    );
  }

  if (!user || !subscribed) {
    return (
      <>
        <div onClick={handleFeatureAccess} className="cursor-pointer">
          {children}
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

export default SubscriptionGate;