import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Terms and Conditions</h1>
          <p className="text-muted-foreground">
            Last updated: August 16, 2025
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                {/* Introduction */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Welcome to InvoMitra ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your use of our invoice management platform and services. By accessing or using InvoMitra, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
                  </p>
                </section>

                {/* Service Description */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    InvoMitra provides an online invoice management platform that allows users to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Create and manage professional invoices</li>
                    <li>Export invoices to PDF format</li>
                    <li>Manage client information and contact details</li>
                    <li>Access analytics and business insights</li>
                    <li>Store data securely in the cloud</li>
                    <li>Access services across multiple devices</li>
                  </ul>
                </section>

                {/* Account Registration */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    To use our services, you must create an account by providing accurate and complete information. You are responsible for:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized use</li>
                    <li>Ensuring your account information remains current and accurate</li>
                  </ul>
                </section>

                {/* Payment Terms */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">4. Payment Terms and Non-Refund Policy</h2>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-destructive mb-2">IMPORTANT: NO REFUNDS</h3>
                    <p className="text-destructive text-sm">
                      All payments made for InvoMitra services are final and non-refundable under any circumstances.
                    </p>
                  </div>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong>Payment Processing:</strong> Payments are processed through Razorpay, a secure third-party payment processor. By making a payment, you authorize us to charge your selected payment method.</p>
                    <p><strong>Subscription Fees:</strong> Subscription fees are billed in advance and are non-refundable. Your subscription will automatically renew unless cancelled before the renewal date.</p>
                    <p><strong>Price Changes:</strong> We reserve the right to modify our pricing at any time. Price changes will not affect your current billing cycle.</p>
                    <p><strong>Failed Payments:</strong> If payment fails, your access to premium features may be suspended until payment is resolved.</p>
                    <p><strong>Cancellation:</strong> You may cancel your subscription at any time, but no refunds will be provided for unused portions of your subscription period.</p>
                  </div>
                </section>

                {/* User Responsibilities */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">5. User Responsibilities</h2>
                  <p className="text-muted-foreground leading-relaxed mb-3">You agree to:</p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Use the service only for lawful purposes</li>
                    <li>Not violate any applicable laws or regulations</li>
                    <li>Not upload malicious content or viruses</li>
                    <li>Not attempt to gain unauthorized access to our systems</li>
                    <li>Not interfere with the proper functioning of the service</li>
                    <li>Respect the intellectual property rights of others</li>
                  </ul>
                </section>

                {/* Data Privacy and Security */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">6. Data Privacy and Security</h2>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    We take data security seriously and implement industry-standard measures to protect your information:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Bank-level encryption for data transmission and storage</li>
                    <li>Regular security audits and updates</li>
                    <li>GDPR compliance for European users</li>
                    <li>Automatic data backups</li>
                    <li>Limited access to personal data by authorized personnel only</li>
                  </ul>
                </section>

                {/* Intellectual Property */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    InvoMitra and all related trademarks, logos, and content are owned by us or our licensors. You retain ownership of the content you create using our platform, but grant us a license to host, store, and process your data to provide our services.
                  </p>
                </section>

                {/* Service Availability */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">8. Service Availability</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    While we strive for 99.9% uptime, we do not guarantee uninterrupted service. We may temporarily suspend service for maintenance, updates, or due to circumstances beyond our control. We are not liable for any losses resulting from service interruptions.
                  </p>
                </section>

                {/* Limitation of Liability */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To the maximum extent permitted by law, InvoMitra shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising from your use of our services.
                  </p>
                </section>

                {/* Termination */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may terminate or suspend your account at any time for violation of these Terms. Upon termination, your right to use the service ceases immediately. You may terminate your account at any time, but no refunds will be provided.
                  </p>
                </section>

                {/* Governing Law */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    These Terms are governed by and construed in accordance with the laws of [Your Jurisdiction]. Any disputes arising from these Terms shall be resolved in the courts of [Your Jurisdiction].
                  </p>
                </section>

                {/* Changes to Terms */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through our platform. Continued use of our services after changes constitutes acceptance of the new Terms.
                  </p>
                </section>

                {/* Contact Information */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions about these Terms and Conditions, please contact us at:
                  </p>
                  <div className="mt-3 text-muted-foreground">
                    <p>Email: invomitra@gmail.com</p>
                  </div>
                </section>

                {/* Acceptance */}
                <section className="border-t pt-6">
                  <p className="text-sm text-muted-foreground">
                    By using InvoMitra, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions;
