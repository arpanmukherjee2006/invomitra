import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  total: number;
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  discount_amount: number;
  date: string;
  due_date?: string;
  status: 'paid' | 'pending' | 'overdue';
  currency?: string;
  notes?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchInvoice();
    }
  }, [id, user]);

  const fetchInvoice = async () => {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (invoiceError) {
        console.error('Error fetching invoice:', invoiceError);
        toast.error('Invoice not found');
        navigate('/dashboard');
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);

      if (itemsError) {
        console.error('Error fetching invoice items:', itemsError);
        toast.error('Failed to load invoice items');
      }

      setInvoice({
        ...invoiceData,
        status: invoiceData.status as 'paid' | 'pending' | 'overdue'
      });
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invoice not found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 gap-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => navigate(`/invoice/${id}/edit`)} className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button onClick={() => toast.info('PDF download coming soon!')} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <CardTitle className="text-2xl sm:text-3xl">Invoice {invoice.invoice_number}</CardTitle>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">Date: {formatDate(invoice.date)}</p>
                {invoice.due_date && (
                  <p className="text-muted-foreground text-sm sm:text-base">Due: {formatDate(invoice.due_date)}</p>
                )}
              </div>
              <Badge variant={getStatusVariant(invoice.status)} className="text-sm sm:text-lg px-3 py-1 sm:px-4 sm:py-2 w-fit">
                {invoice.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Bill To:</h3>
                <div className="space-y-1">
                  <p className="font-medium">{invoice.client_name || 'Unknown Client'}</p>
                  {invoice.client_email && <p>{invoice.client_email}</p>}
                  {invoice.client_phone && <p>{invoice.client_phone}</p>}
                  {invoice.client_address && <p className="whitespace-pre-line">{invoice.client_address}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Items:</h3>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 sm:p-4 min-w-[200px]">Description</th>
                      <th className="text-right p-2 sm:p-4 min-w-[60px]">Qty</th>
                      <th className="text-right p-2 sm:p-4 min-w-[100px]">Price</th>
                      <th className="text-right p-2 sm:p-4 min-w-[100px]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="p-2 sm:p-4 text-sm sm:text-base">{item.description}</td>
                        <td className="text-right p-2 sm:p-4 text-sm sm:text-base">{item.quantity}</td>
                        <td className="text-right p-2 sm:p-4 text-sm sm:text-base">{formatCurrency(item.unit_price, invoice.currency)}</td>
                        <td className="text-right p-2 sm:p-4 text-sm sm:text-base">{formatCurrency(item.total, invoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-2 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                  </div>
                )}
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({invoice.tax_rate}%):</span>
                    <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Notes:</h3>
                <p className="text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceView;