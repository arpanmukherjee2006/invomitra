import { FileText, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold font-poppins text-primary">InvoMitra</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              The trusted invoicing platform for businesses, small enterprises, 
              freelancers, and professionals. Streamline your billing process 
              with our comprehensive invoice management solution.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold">Product</h4>
            <div className="space-y-2 text-sm">
              <a href="#features" className="block text-muted-foreground hover:text-primary transition-colors">
                Features
              </a>
              <a href="#pricing" className="block text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </a>
              <Link to="/auth" className="block text-muted-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold">Support</h4>
            <div className="space-y-2 text-sm">
             
              <Link to="/terms" className="block text-muted-foreground hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>invomitra@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 InvoMitra. All rights reserved.
          </p>
        </div>
      </div>
    </footer>

  );
}

export default Footer;