import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Trash2, Save, Download, Eye, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  hsn_sac_code: string;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  taxable_amount: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
  gstin?: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  logo?: string;
  gstin?: string;
  state_code?: string;
  place_of_business?: string;
}

interface InvoiceFormProps {
  initialInvoice?: any;
}

const InvoiceForm = ({ initialInvoice }: InvoiceFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    tax_rate: 0,
    discount_amount: 0,
    currency: 'INR',
    place_of_supply: '',
    gst_type: 'igst', // 'igst' for inter-state, 'cgst_sgst' for intra-state
    cgst_rate: 9,
    sgst_rate: 9,
    igst_rate: 18,
    payment_qr: '', // For generated payment QR code
    payment_amount: 0, // Amount for QR code payment
    upi_id: '', // UPI ID for QR generation
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    address: '',
    email: '',
    phone: '',
    logo: '',
    gstin: '',
    state_code: '',
    place_of_business: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { 
      id: uuidv4(), 
      description: '', 
      quantity: 1, 
      unit_price: 0, 
      total: 0,
      hsn_sac_code: '',
      cgst_rate: 9,
      sgst_rate: 9,
      igst_rate: 18,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      taxable_amount: 0
    }
  ]);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];

  const getCurrencySymbol = () => {
    return currencies.find(c => c.code === invoiceData.currency)?.symbol || '$';
  };

  useEffect(() => {
    fetchClients();
    if (isEditing && !initialInvoice) {
      fetchInvoice();
    } else if (!isEditing) {
      generateInvoiceNumber();
      // Initialize with a default client
      setSelectedClientId('1');
    }
  }, [isEditing, initialInvoice]);

  // Effect to populate form with initial invoice data
  useEffect(() => {
    if (initialInvoice) {
      setInvoiceData({
        invoice_number: initialInvoice.invoice_number || '',
        date: initialInvoice.date || new Date().toISOString().split('T')[0],
        due_date: initialInvoice.due_date || '',
        notes: initialInvoice.notes || '',
        tax_rate: initialInvoice.tax_rate || 0,
        discount_amount: initialInvoice.discount_amount || 0,
        currency: initialInvoice.currency || 'INR',
        place_of_supply: initialInvoice.place_of_supply || '',
        gst_type: initialInvoice.gst_type || 'igst',
        cgst_rate: initialInvoice.cgst_rate || 9,
        sgst_rate: initialInvoice.sgst_rate || 9,
        igst_rate: initialInvoice.igst_rate || 18,
        payment_qr: initialInvoice.payment_qr || '',
        payment_amount: initialInvoice.payment_amount || 0,
        upi_id: initialInvoice.upi_id || '',
      });

      // Set company info from client data
      setCompanyInfo(prev => ({
        ...prev,
        name: initialInvoice.client_name || '',
        email: initialInvoice.client_email || '',
        address: initialInvoice.client_address || '',
        phone: initialInvoice.client_phone || '',
      }));

      // Set items if available
      if (initialInvoice.items && initialInvoice.items.length > 0) {
        setItems(initialInvoice.items.map(item => ({
          id: item.id || uuidv4(),
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total: item.total || 0,
          hsn_sac_code: item.hsn_sac_code || '',
          cgst_rate: item.cgst_rate || 9,
          sgst_rate: item.sgst_rate || 9,
          igst_rate: item.igst_rate || 18,
          cgst_amount: item.cgst_amount || 0,
          sgst_amount: item.sgst_amount || 0,
          igst_amount: item.igst_amount || 0,
          taxable_amount: item.taxable_amount || 0
        })));
      }

      // Set client for display
      setSelectedClientId('1');
      setClients(prev => [
        {
          id: '1',
          name: initialInvoice.client_name || '',
          email: initialInvoice.client_email || '',
          address: initialInvoice.client_address || '',
          phone: initialInvoice.client_phone || '',
        },
        ...prev.slice(1)
      ]);
    }
  }, [initialInvoice]);

  const fetchClients = async () => {
    try {
      // Mock clients for now
      const mockClients: Client[] = [
        { id: '1', name: 'Acme Corp', email: 'contact@acme.com', address: '123 Business St, City, State 12345' },
        { id: '2', name: 'Tech Solutions', email: 'hello@techsolutions.com', address: '456 Innovation Ave, Tech City, TC 67890' },
        { id: '3', name: 'Design Studio', email: 'info@designstudio.com', address: '789 Creative Blvd, Art Town, AT 11111' },
      ];
      setClients(mockClients);
    } catch (error: any) {
      toast.error('Failed to fetch clients');
    }
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    setInvoiceData(prev => ({
      ...prev,
      invoice_number: `INV-${timestamp}`
    }));
  };

  const fetchInvoice = async () => {
    try {
      // Mock invoice data for editing
      if (id === '1') {
        setInvoiceData({
          invoice_number: 'INV-001',
          date: '2024-01-15',
          due_date: '2024-02-14',
          notes: 'Thank you for your business!',
          tax_rate: 8.5,
          discount_amount: 100,
          currency: 'INR',
          place_of_supply: 'Delhi',
          gst_type: 'igst',
          cgst_rate: 9,
          sgst_rate: 9,
          igst_rate: 18,
          payment_qr: '',
          payment_amount: 0,
          upi_id: '',
        });

        setSelectedClientId('1');

        setItems([
          { 
            id: '1', 
            description: 'Web Development', 
            quantity: 1, 
            unit_price: 1500, 
            total: 1500,
            hsn_sac_code: '998313',
            cgst_rate: 9,
            sgst_rate: 9,
            igst_rate: 18,
            cgst_amount: 135,
            sgst_amount: 135,
            igst_amount: 0,
            taxable_amount: 1500
          },
          { 
            id: '2', 
            description: 'SEO Optimization', 
            quantity: 1, 
            unit_price: 500, 
            total: 500,
            hsn_sac_code: '998313',
            cgst_rate: 9,
            sgst_rate: 9,
            igst_rate: 18,
            cgst_amount: 45,
            sgst_amount: 45,
            igst_amount: 0,
            taxable_amount: 500
          },
        ]);
      }
    } catch (error: any) {
      toast.error('Failed to fetch invoice');
      navigate('/dashboard');
    }
  };

  // Generate UPI QR Code
  const generateUPIQR = async (upiId: string, amount: number) => {
    if (!upiId || amount <= 0) {
      return '';
    }
    
    try {
      const upiUrl = `upi://pay?pa=${upiId}&am=${amount}&cu=INR`;
      const qrDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
      return '';
    }
  };

  // Handle UPI ID and amount changes
  const handleUPIChange = async (field: 'upi_id' | 'payment_amount', value: string | number) => {
    const updatedData = { ...invoiceData, [field]: value };
    setInvoiceData(updatedData);
    
    if (updatedData.upi_id && updatedData.payment_amount > 0) {
      const qrCode = await generateUPIQR(updatedData.upi_id, updatedData.payment_amount);
      setInvoiceData(prev => ({ ...prev, payment_qr: qrCode }));
    } else {
      setInvoiceData(prev => ({ ...prev, payment_qr: '' }));
    }
  };

  const addItem = () => {
    setItems([...items, { 
      id: uuidv4(), 
      description: '', 
      quantity: 1, 
      unit_price: 0, 
      total: 0,
      hsn_sac_code: '',
      cgst_rate: invoiceData.cgst_rate,
      sgst_rate: invoiceData.sgst_rate,
      igst_rate: invoiceData.igst_rate,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      taxable_amount: 0
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price;
          updated.taxable_amount = updated.total;
          
          // Calculate GST based on invoice GST type
          if (invoiceData.gst_type === 'igst') {
            updated.igst_amount = (updated.taxable_amount * updated.igst_rate) / 100;
            updated.cgst_amount = 0;
            updated.sgst_amount = 0;
          } else {
            updated.cgst_amount = (updated.taxable_amount * updated.cgst_rate) / 100;
            updated.sgst_amount = (updated.taxable_amount * updated.sgst_rate) / 100;
            updated.igst_amount = 0;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalCgst = items.reduce((sum, item) => sum + item.cgst_amount, 0);
    const totalSgst = items.reduce((sum, item) => sum + item.sgst_amount, 0);
    const totalIgst = items.reduce((sum, item) => sum + item.igst_amount, 0);
    const totalGst = totalCgst + totalSgst + totalIgst;
    const total = subtotal + totalGst - invoiceData.discount_amount;
    return { 
      subtotal, 
      taxAmount: totalGst,
      totalCgst,
      totalSgst, 
      totalIgst,
      total 
    };
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyInfo(prev => ({ ...prev, logo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadPDF = async () => {
    try {
      // If preview is not open, we need to render the invoice content for PDF
      if (!showPreview) {
        // Temporarily show preview to capture content
        setShowPreview(true);
        
        // Wait a bit for the dialog to render
        setTimeout(async () => {
          await generatePDF();
          setShowPreview(false);
        }, 100);
      } else {
        await generatePDF();
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error('PDF generation error:', error);
    }
  };

  const generatePDF = async () => {
    if (!invoiceRef.current) {
      toast.error('Unable to generate PDF - content not ready');
      return;
    }
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${invoiceData.invoice_number || 'draft'}.pdf`);
      
      toast.success('Invoice PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error('PDF generation error:', error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please log in to save invoice');
      return;
    }

    setLoading(true);
    try {
      const { subtotal, taxAmount, total } = calculateTotals();

      // Save invoice to database
      const invoicePayload = {
        user_id: user.id,
        client_name: selectedClient?.name || '',
        client_email: selectedClient?.email || '',
        client_phone: selectedClient?.phone || '',
        client_address: selectedClient?.address || '',
        client_gstin: selectedClient?.gstin || '',
        company_gstin: companyInfo.gstin || '',
        place_of_supply: invoiceData.place_of_supply,
        gst_type: invoiceData.gst_type,
        invoice_number: invoiceData.invoice_number,
        date: invoiceData.date,
        due_date: invoiceData.due_date,
        subtotal,
        tax_rate: invoiceData.tax_rate,
        tax_amount: taxAmount,
        cgst_rate: invoiceData.cgst_rate,
        sgst_rate: invoiceData.sgst_rate,
        igst_rate: invoiceData.igst_rate,
        cgst_amount: totalCgst,
        sgst_amount: totalSgst,
        igst_amount: totalIgst,
        discount_amount: invoiceData.discount_amount,
        total,
        status: 'pending',
        notes: invoiceData.notes,
        currency: invoiceData.currency,
        payment_qr: invoiceData.payment_qr,
        payment_amount: invoiceData.payment_amount,
      };

      let savedInvoice;
      if (isEditing && initialInvoice?.id) {
        // Update existing invoice
        const { data, error: invoiceError } = await supabase
          .from('invoices')
          .update(invoicePayload)
          .eq('id', initialInvoice.id)
          .select()
          .single();
        
        if (invoiceError) {
          throw invoiceError;
        }
        savedInvoice = data;
        
        // Delete existing items first
        await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', initialInvoice.id);
      } else {
        // Create new invoice
        const { data, error: invoiceError } = await supabase
          .from('invoices')
          .insert(invoicePayload)
          .select()
          .single();
        
        if (invoiceError) {
          throw invoiceError;
        }
        savedInvoice = data;
      }

      // Save invoice items
      if (items.length > 0) {
        const itemsPayload = items.map(item => ({
          invoice_id: savedInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
          hsn_sac_code: item.hsn_sac_code,
          cgst_rate: item.cgst_rate,
          sgst_rate: item.sgst_rate,
          igst_rate: item.igst_rate,
          cgst_amount: item.cgst_amount,
          sgst_amount: item.sgst_amount,
          igst_amount: item.igst_amount,
          taxable_amount: item.taxable_amount
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsPayload);

        if (itemsError) {
          throw itemsError;
        }
      }

      // Update user profile with company info
      if (companyInfo.name || companyInfo.address) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            company_name: companyInfo.name,
            company_address: companyInfo.address,
            gstin: companyInfo.gstin,
            state_code: companyInfo.state_code,
            place_of_business: companyInfo.place_of_business,
            currency: invoiceData.currency
          })
          .eq('user_id', user.id);

        if (profileError) {
          console.warn('Failed to update profile:', profileError);
        }
      }

      toast.success(isEditing ? 'Invoice updated successfully!' : 'Invoice created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Failed to save invoice: ' + (error.message || 'Unknown error'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, totalCgst, totalSgst, totalIgst, total } = calculateTotals();
  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 lg:mb-8 gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
            </h1>
          </div>
        </div>

        <div className="grid gap-6 lg:gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-6">
            {/* Company/Freelancer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Company/Freelancer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="company_logo">Logo</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="company_logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('company_logo')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </Button>
                    {companyInfo.logo && (
                      <img 
                        src={companyInfo.logo} 
                        alt="Company Logo" 
                        className="h-12 w-12 object-contain rounded border"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="company_name">Company/Name</Label>
                  <Input
                    id="company_name"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <Label htmlFor="company_address">Address</Label>
                  <Textarea
                    id="company_address"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Company Address"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_email">Email</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="company@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_phone">Phone</Label>
                    <Input
                      id="company_phone"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_gstin">GSTIN</Label>
                    <Input
                      id="company_gstin"
                      value={companyInfo.gstin || ''}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, gstin: e.target.value }))}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state_code">State Code</Label>
                    <Input
                      id="state_code"
                      value={companyInfo.state_code || ''}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, state_code: e.target.value }))}
                      placeholder="07 (Delhi)"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="place_of_business">Place of Business</Label>
                  <Input
                    id="place_of_business"
                    value={companyInfo.place_of_business || ''}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, place_of_business: e.target.value }))}
                    placeholder="Delhi, India"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoice_number">Invoice Number</Label>
                    <Input
                      id="invoice_number"
                      value={invoiceData.invoice_number}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={invoiceData.currency}
                      onValueChange={(value) => setInvoiceData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={invoiceData.date}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={invoiceData.due_date}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg font-semibold">Client Details</h3>
                  <div>
                    <Label htmlFor="client_name">Client Name</Label>
                    <Input
                      id="client_name"
                      value={selectedClient?.name || ''}
                      onChange={(e) => {
                        const newClient = { ...selectedClient, name: e.target.value, id: selectedClientId || '1' };
                        setClients(prev => prev.map(c => c.id === selectedClientId ? newClient : c));
                      }}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_email">Email</Label>
                    <Input
                      id="client_email"
                      type="email"
                      value={selectedClient?.email || ''}
                      onChange={(e) => {
                        const newClient = { ...selectedClient, email: e.target.value, id: selectedClientId || '1' };
                        setClients(prev => prev.map(c => c.id === selectedClientId ? newClient : c));
                      }}
                      placeholder="client@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_phone">Contact Number</Label>
                    <Input
                      id="client_phone"
                      value={selectedClient?.phone || ''}
                      onChange={(e) => {
                        const newClient = { ...selectedClient, phone: e.target.value, id: selectedClientId || '1' };
                        setClients(prev => prev.map(c => c.id === selectedClientId ? newClient : c));
                      }}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_address">Address</Label>
                    <Textarea
                      id="client_address"
                      value={selectedClient?.address || ''}
                      onChange={(e) => {
                        const newClient = { ...selectedClient, address: e.target.value, id: selectedClientId || '1' };
                        setClients(prev => prev.map(c => c.id === selectedClientId ? newClient : c));
                      }}
                      placeholder="Client address"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_gstin">Client GSTIN (Optional)</Label>
                    <Input
                      id="client_gstin"
                      value={selectedClient?.gstin || ''}
                      onChange={(e) => {
                        const newClient = { ...selectedClient, gstin: e.target.value, id: selectedClientId || '1' };
                        setClients(prev => prev.map(c => c.id === selectedClientId ? newClient : c));
                      }}
                      placeholder="22BBBBB0000B1Z5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="place_of_supply">Place of Supply</Label>
                    <Input
                      id="place_of_supply"
                      value={invoiceData.place_of_supply}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, place_of_supply: e.target.value }))}
                      placeholder="Delhi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gst_type">GST Type</Label>
                    <Select
                      value={invoiceData.gst_type}
                      onValueChange={(value) => setInvoiceData(prev => ({ ...prev, gst_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select GST type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="igst">IGST (Inter-state)</SelectItem>
                        <SelectItem value="cgst_sgst">CGST + SGST (Intra-state)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={invoiceData.notes}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Payment terms, thank you note, etc."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="upi_id">UPI ID</Label>
                    <Input
                      id="upi_id"
                      type="text"
                      placeholder="Enter UPI ID (e.g. user@paytm)"
                      value={invoiceData.upi_id || ''}
                      onChange={(e) => handleUPIChange('upi_id', e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Your UPI ID for receiving payments
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="payment_amount">Payment Amount (₹)</Label>
                    <Input
                      id="payment_amount"
                      type="number"
                      placeholder="Enter amount"
                      value={invoiceData.payment_amount || ''}
                      onChange={(e) => handleUPIChange('payment_amount', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Amount that will be pre-filled when QR is scanned
                    </p>
                  </div>
                </div>
                
                {invoiceData.payment_qr && (
                  <div className="mt-4">
                    <Label>Generated Payment QR Code</Label>
                    <div className="mt-2 p-4 border rounded-lg bg-gray-50 text-center">
                      <img 
                        src={invoiceData.payment_qr} 
                        alt="Payment QR Code" 
                        className="w-32 h-32 mx-auto object-contain border rounded"
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        UPI: {invoiceData.upi_id} | Amount: ₹{invoiceData.payment_amount}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setInvoiceData(prev => ({ ...prev, payment_qr: '', upi_id: '', payment_amount: 0 }));
                        }}
                        className="mt-2"
                      >
                        Clear Payment Info
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Items</CardTitle>
                  <Button onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Label>Description</Label>
                          <Input
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>HSN/SAC Code</Label>
                          <Input
                            placeholder="998313"
                            value={item.hsn_sac_code}
                            onChange={(e) => updateItem(item.id, 'hsn_sac_code', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Unit Price</Label>
                          <div className="flex items-center">
                            <span className="mr-2 text-sm font-medium">{getCurrencySymbol()}</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="col-span-1">
                          <Label>Total</Label>
                          <Input
                            value={`${getCurrencySymbol()}${item.total.toFixed(2)}`}
                            readOnly
                            className="bg-muted text-xs"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* GST Details */}
                      <div className="grid grid-cols-4 gap-2 text-sm bg-gray-50 p-2 rounded">
                        <div>
                          <span className="text-gray-600">Taxable: </span>
                          <span className="font-medium">{getCurrencySymbol()}{item.taxable_amount.toFixed(2)}</span>
                        </div>
                        {invoiceData.gst_type === 'igst' ? (
                          <div>
                            <span className="text-gray-600">IGST ({item.igst_rate}%): </span>
                            <span className="font-medium">{getCurrencySymbol()}{item.igst_amount.toFixed(2)}</span>
                          </div>
                        ) : (
                          <>
                            <div>
                              <span className="text-gray-600">CGST ({item.cgst_rate}%): </span>
                              <span className="font-medium">{getCurrencySymbol()}{item.cgst_amount.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">SGST ({item.sgst_rate}%): </span>
                              <span className="font-medium">{getCurrencySymbol()}{item.sgst_amount.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{getCurrencySymbol()}{subtotal.toFixed(2)}</span>
                  </div>
                  
                  {/* GST Summary */}
                  {invoiceData.gst_type === 'igst' ? (
                    <div className="flex justify-between">
                      <span>IGST ({invoiceData.igst_rate}%):</span>
                      <span>{getCurrencySymbol()}{totalIgst.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>CGST ({invoiceData.cgst_rate}%):</span>
                        <span>{getCurrencySymbol()}{totalCgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST ({invoiceData.sgst_rate}%):</span>
                        <span>{getCurrencySymbol()}{totalSgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Total GST:</span>
                    <span>{getCurrencySymbol()}{taxAmount.toFixed(2)}</span>
                  </div>
                  
                  <div>
                    <Label htmlFor="discount">Discount Amount</Label>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm font-medium">{getCurrencySymbol()}</span>
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoiceData.discount_amount}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{getCurrencySymbol()}{total.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button onClick={handleSave} className="w-full" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Invoice'}
                  </Button>
                  <Button variant="outline" onClick={downloadPDF} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Invoice Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            <div ref={invoiceRef} className="bg-white p-8 space-y-6 text-black">
              {/* Invoice Header */}
              <div className="flex justify-between items-start">
                <div>
                  {companyInfo.logo && (
                    <img 
                      src={companyInfo.logo} 
                      alt="Company Logo" 
                      className="h-16 w-auto mb-4 object-contain"
                    />
                  )}
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-900">{companyInfo.name || 'Your Company'}</h2>
                    <p className="text-gray-600 whitespace-pre-line">{companyInfo.address}</p>
                    <p className="text-gray-600">{companyInfo.email}</p>
                    <p className="text-gray-600">{companyInfo.phone}</p>
                    {companyInfo.gstin && <p className="text-gray-600">GSTIN: {companyInfo.gstin}</p>}
                    {companyInfo.state_code && <p className="text-gray-600">State Code: {companyInfo.state_code}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">TAX INVOICE</h1>
                  <p className="text-gray-600">#{invoiceData.invoice_number || 'DRAFT'}</p>
                  <p className="text-gray-600">Date: {invoiceData.date}</p>
                  {invoiceData.due_date && (
                    <p className="text-gray-600">Due: {invoiceData.due_date}</p>
                  )}
                  {invoiceData.place_of_supply && (
                    <p className="text-gray-600">Place of Supply: {invoiceData.place_of_supply}</p>
                  )}
                </div>
              </div>

              {/* Client Info */}
              {selectedClient && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
                   <div className="space-y-1">
                     <p className="font-medium">{selectedClient.name}</p>
                     <p className="text-gray-600">{selectedClient.email}</p>
                     {selectedClient.phone && <p className="text-gray-600">{selectedClient.phone}</p>}
                     <p className="text-gray-600 whitespace-pre-line">{selectedClient.address}</p>
                     {selectedClient.gstin && <p className="text-gray-600">GSTIN: {selectedClient.gstin}</p>}
                   </div>
                </div>
              )}

              {/* Items Table */}
              <div className="border-t pt-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Description</th>
                      <th className="text-center py-2 w-24">HSN/SAC</th>
                      <th className="text-center py-2 w-16">Qty</th>
                      <th className="text-right py-2 w-24">Rate</th>
                      <th className="text-right py-2 w-24">Taxable Value</th>
                      {invoiceData.gst_type === 'igst' ? (
                        <th className="text-right py-2 w-24">IGST</th>
                      ) : (
                        <>
                          <th className="text-right py-2 w-20">CGST</th>
                          <th className="text-right py-2 w-20">SGST</th>
                        </>
                      )}
                      <th className="text-right py-2 w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">{item.description}</td>
                        <td className="py-3 text-center text-sm">{item.hsn_sac_code}</td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">{getCurrencySymbol()}{item.unit_price.toFixed(2)}</td>
                        <td className="py-3 text-right">{getCurrencySymbol()}{item.taxable_amount.toFixed(2)}</td>
                        {invoiceData.gst_type === 'igst' ? (
                          <td className="py-3 text-right">{getCurrencySymbol()}{item.igst_amount.toFixed(2)}</td>
                        ) : (
                          <>
                            <td className="py-3 text-right">{getCurrencySymbol()}{item.cgst_amount.toFixed(2)}</td>
                            <td className="py-3 text-right">{getCurrencySymbol()}{item.sgst_amount.toFixed(2)}</td>
                          </>
                        )}
                        <td className="py-3 text-right font-medium">{getCurrencySymbol()}{(item.total + item.cgst_amount + item.sgst_amount + item.igst_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="border-t pt-6">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                     <div className="flex justify-between">
                       <span>Taxable Amount:</span>
                       <span>{getCurrencySymbol()}{subtotal.toFixed(2)}</span>
                     </div>
                     {invoiceData.gst_type === 'igst' ? (
                       <div className="flex justify-between">
                         <span>IGST ({invoiceData.igst_rate}%):</span>
                         <span>{getCurrencySymbol()}{totalIgst.toFixed(2)}</span>
                       </div>
                     ) : (
                       <>
                         <div className="flex justify-between">
                           <span>CGST ({invoiceData.cgst_rate}%):</span>
                           <span>{getCurrencySymbol()}{totalCgst.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between">
                           <span>SGST ({invoiceData.sgst_rate}%):</span>
                           <span>{getCurrencySymbol()}{totalSgst.toFixed(2)}</span>
                         </div>
                       </>
                     )}
                     {invoiceData.discount_amount > 0 && (
                       <div className="flex justify-between">
                         <span>Discount:</span>
                         <span>-{getCurrencySymbol()}{invoiceData.discount_amount.toFixed(2)}</span>
                       </div>
                     )}
                     <div className="flex justify-between text-lg font-bold border-t pt-2">
                       <span>Total Amount:</span>
                       <span>{getCurrencySymbol()}{total.toFixed(2)}</span>
                     </div>
                  </div>
                </div>
              </div>

               {/* Notes */}
               {invoiceData.notes && (
                 <div className="border-t pt-6">
                   <h3 className="text-lg font-semibold mb-2">Notes:</h3>
                   <p className="text-gray-600 whitespace-pre-line">{invoiceData.notes}</p>
                 </div>
               )}

                {/* Payment QR Code */}
                {invoiceData.payment_qr && (
                  <div className="border-t pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Payment Information:</h3>
                        <p className="text-gray-600 mb-2">Scan the QR code below to make payment</p>
                        {invoiceData.payment_amount > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <p className="text-green-800 font-semibold">
                              Payment Amount: {getCurrencySymbol()}{invoiceData.payment_amount.toFixed(2)}
                            </p>
                            <p className="text-green-600 text-sm">
                              This amount will be displayed when the QR is scanned
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <img 
                          src={invoiceData.payment_qr} 
                          alt="Payment QR Code" 
                          className="w-32 h-32 object-contain border rounded"
                        />
                        <p className="text-sm text-gray-500 mt-2">Scan to Pay</p>
                        {invoiceData.payment_amount > 0 && (
                          <p className="text-lg font-bold text-green-700 mt-1">
                            {getCurrencySymbol()}{invoiceData.payment_amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button onClick={downloadPDF} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InvoiceForm;