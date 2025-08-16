import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calculator, 
  Download, 
  Users, 
  BarChart3, 
  Shield, 
  Smartphone 
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Calculator,
      title: 'Unlimited Invoice Creation',
      description: 'Create unlimited professional invoices with automatic calculations for taxes, discounts, and totals.',
    },
    {
      icon: Download,
      title: 'Professional PDF Export',
      description: 'Download beautiful, branded PDFs instantly. Share via email or print for your records.',
    },
    {
      icon: Users,
      title: 'Complete Client Management',
      description: 'Store unlimited client information, contact details, and access complete invoice history.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics Dashboard',
      description: 'Track total earnings, revenue trends, payment status, and detailed business insights.',
    },
    {
      icon: Shield,
      title: 'Secure Cloud Storage',
      description: 'Bank-level security with encrypted data storage, automatic backups, and GDPR compliance.',
    },
    {
      icon: Smartphone,
      title: 'Mobile & Multi-Device',
      description: 'Access your invoices anywhere, anytime. Fully responsive design works on all devices.',
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="text-primary">Manage Invoices</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to streamline your invoicing process and help you get paid faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 p-2 rounded-lg w-fit mb-2">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;