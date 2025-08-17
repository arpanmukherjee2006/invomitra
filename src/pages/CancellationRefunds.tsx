import { ArrowLeft, XCircle, AlertTriangle, Clock, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CancellationRefunds = () => {
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
          <h1 className="text-4xl font-bold text-primary mb-2">Cancellation & Refunds</h1>
          <p className="text-muted-foreground">
            Important information about our cancellation and refund policies
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Important Notice */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700">
                <strong>No refunds are provided for any subscription payments.</strong> Please read this policy carefully before subscribing to our services.
              </p>
            </CardContent>
          </Card>

          {/* Cancellation Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <XCircle className="h-5 w-5 mr-2 text-primary" />
                Cancellation Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">How to Cancel</h3>
                <p className="text-muted-foreground mb-4">
                  You may cancel your subscription at any time through the following methods:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Through your account dashboard settings</li>
                  <li>By contacting our support team via email</li>
                  <li>By calling our support number</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">What Happens When You Cancel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">Service Access</h4>
                      <p className="text-sm text-muted-foreground">
                        Your subscription remains active until the end of your current billing period
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CreditCard className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">Billing</h4>
                      <p className="text-sm text-muted-foreground">
                        No further charges will be made to your account
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Cancellation Timeline</h4>
                <ul className="space-y-2 text-sm">
                  <li><strong>Immediate:</strong> Cancellation request is processed</li>
                  <li><strong>Current Period:</strong> Continue using all features until billing period ends</li>
                  <li><strong>After Period End:</strong> Service access is suspended</li>
                  <li><strong>Data Retention:</strong> Your data is retained according to our data retention policy</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Refund Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
                Refund Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">No Refunds Policy</h3>
                <p className="text-red-700">
                  <strong>We do not provide refunds for any subscription payments.</strong> This policy applies to all subscription types and circumstances.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">What This Means</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Badge variant="destructive" className="mt-1">No Refunds</Badge>
                    <div>
                      <h4 className="font-medium">Monthly Subscriptions</h4>
                      <p className="text-sm text-muted-foreground">
                        No refunds for partial months or early cancellation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="destructive" className="mt-1">No Refunds</Badge>
                    <div>
                      <h4 className="font-medium">Annual Subscriptions</h4>
                      <p className="text-sm text-muted-foreground">
                        No refunds for unused periods or early cancellation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="destructive" className="mt-1">No Refunds</Badge>
                    <div>
                      <h4 className="font-medium">Service Dissatisfaction</h4>
                      <p className="text-sm text-muted-foreground">
                        No refunds due to dissatisfaction with service quality
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="destructive" className="mt-1">No Refunds</Badge>
                    <div>
                      <h4 className="font-medium">Technical Issues</h4>
                      <p className="text-sm text-muted-foreground">
                        No refunds for temporary technical difficulties
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Before You Subscribe</h4>
                <p className="text-blue-700 text-sm">
                  We strongly recommend reviewing our service features, reading our terms of service, 
                  and understanding this no-refund policy before making a subscription commitment. 
                  If you have any questions about our services, please contact our support team.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Exceptions and Special Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Exceptions and Special Cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Legal Requirements</h3>
                <p className="text-muted-foreground">
                  In rare cases where local consumer protection laws require refunds, we will comply 
                  with applicable legal requirements. Such cases are handled on an individual basis 
                  and require proper documentation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Service Discontinuation</h3>
                <p className="text-muted-foreground">
                  If we discontinue a service that you have paid for, we may offer alternative 
                  solutions or credits at our discretion. This does not constitute a refund policy 
                  change for active services.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Questions About Cancellation or Refunds?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have questions about our cancellation or refund policies, please contact our support team:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Email Support</h4>
                  <a 
                    href="mailto:invomitra@gmail.com" 
                    className="text-primary hover:underline"
                  >
                    invomitra@gmail.com
                  </a>
                </div>
                <div>
                  <h4 className="font-medium">Phone Support</h4>
                  <a 
                    href="tel:+918102553014" 
                    className="text-primary hover:underline"
                  >
                    +91 8102553014
                  </a>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM
              </p>
            </CardContent>
          </Card>

          {/* Related Links */}
          <Card>
            <CardHeader>
              <CardTitle>Related Information</CardTitle>
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
                  to="/contact-us" 
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h4 className="font-medium">Contact Us</h4>
                  <p className="text-sm text-muted-foreground">
                    Get in touch with our support team
                  </p>
                </Link>
                <a 
                  href="#pricing" 
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h4 className="font-medium">Pricing</h4>
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

export default CancellationRefunds;
