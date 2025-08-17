import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-primary mb-2">Contact Us</h1>
          <p className="text-muted-foreground">
            Have questions? We'd love to hear from you. Get in touch with us using the information below.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-lg">Email</p>
                  <a 
                    href="mailto:invomitra@gmail.com" 
                    className="text-primary hover:underline text-lg"
                  >
                    invomitra@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-lg">Phone</p>
                  <a 
                    href="tel:+918102553014" 
                    className="text-primary hover:underline text-lg"
                  >
                    +91 8102553014
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <MapPin className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-lg">Business Hours</p>
                  <p className="text-muted-foreground text-lg">
                  Monday - Friday, 9:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">How do I cancel my subscription?</h4>
                <p className="text-muted-foreground">
                  You can cancel your subscription at any time through your account settings or by contacting our support team.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Do you offer refunds?</h4>
                <p className="text-muted-foreground">
                  We do not provide refunds for subscription payments. Please review our service before subscribing.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">How secure is my data?</h4>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures to protect your data. All information is encrypted and stored securely.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Support Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Support Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link 
                  to="/terms" 
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h4 className="font-medium">Terms & Conditions</h4>
                  <p className="text-sm text-muted-foreground">
                    Read our complete terms of service
                  </p>
                </Link>
                <Link 
                  to="/privacy-policy" 
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h4 className="font-medium">Privacy Policy</h4>
                  <p className="text-sm text-muted-foreground">
                    Learn about our data practices
                  </p>
                </Link>
                <Link 
                  to="/cancellation-refunds" 
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h4 className="font-medium">Cancellation & Refunds</h4>
                  <p className="text-sm text-muted-foreground">
                    Understand our policies
                  </p>
                </Link>
                <a 
                  href="#pricing" 
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h4 className="font-medium">Pricing Information</h4>
                  <p className="text-sm text-muted-foreground">
                    View our subscription plans
                  </p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
