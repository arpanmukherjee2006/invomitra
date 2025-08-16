import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import SubscriptionGate from '@/components/common/SubscriptionGate';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Generate Professional{' '}
            <span className="text-primary">Invoices</span>{' '}
            in Seconds
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The ultimate invoicing platform for businesses, small enterprises, freelancers, 
            and professionals. Create unlimited invoices, track earnings, manage clients, 
            and access powerful analytics. Everything you need for just ₹99/month.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <SubscriptionGate feature="access the dashboard">
              <Link to="/dashboard">
                <Button size="lg" className="group">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </SubscriptionGate>
            <SubscriptionGate feature="view the demo">
              <Button variant="outline" size="lg">
                View Demo
              </Button>
            </SubscriptionGate>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Professional Templates</h3>
              <p className="text-muted-foreground">
                Beautiful, customizable invoice templates that look professional
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-accent/10 p-3 rounded-full mb-4">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                Track earnings, monitor payments, and analyze business performance
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-warning/10 p-3 rounded-full mb-4">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-semibold mb-2">Save Time</h3>
              <p className="text-muted-foreground">
                Generate invoices in seconds, not hours. Focus on your business
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;