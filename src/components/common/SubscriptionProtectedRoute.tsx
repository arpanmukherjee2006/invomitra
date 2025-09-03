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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Temporarily bypass subscription check - allow direct access
  return <>{children}</>;
};

export default SubscriptionProtectedRoute;