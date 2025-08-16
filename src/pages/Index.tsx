import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Landing/Navbar';
import Hero from '@/components/Landing/Hero';
import Features from '@/components/Landing/Features';
import PricingSection from '@/components/Landing/PricingSection';
import FAQ from '@/components/Landing/FAQ';
import Footer from '@/components/Landing/Footer';

const Index = () => {
  const { user, loading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();

  // Only show loading spinner for a brief moment to avoid infinite loading
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if ((loading || subLoading) && !showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only redirect to dashboard if user is authenticated AND subscribed
  if (user && subscribed) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div id="features">
        <Features />
      </div>
      <div id="pricing">
        <PricingSection />
      </div>
      <div id="faq">
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
