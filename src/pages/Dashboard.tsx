import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import StatsCards from '@/components/Dashboard/StatsCards';
import InvoiceTable from '@/components/Dashboard/InvoiceTable';
import EarningsChart from '@/components/Dashboard/EarningsChart';
import SubscriptionProtectedRoute from '@/components/common/SubscriptionProtectedRoute';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name?: string;
  total: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  currency?: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  company_name?: string;
  company_address?: string;
  currency?: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    monthlyGrowth: 0,
  });
  const [chartData, setChartData] = useState<Array<{ month: string; earnings: number }>>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    
    loadDashboardData();
  }, [user, loading]);

  const loadDashboardData = async () => {
    setDataLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchInvoices(),
        fetchStats(),
        fetchChartData()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      // If no profile exists, create one
      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user?.id,
            full_name: user?.user_metadata?.full_name || '',
            email: user?.email || '',
            currency: 'USD'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return;
        }
        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching invoices:', error);
        return;
      }

      const formattedInvoices: Invoice[] = (data || []).map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name || 'Unknown Client',
        total: parseFloat(String(invoice.total || '0')),
        date: invoice.date,
        status: invoice.status as 'paid' | 'pending' | 'overdue',
        currency: invoice.currency || 'USD'
      }));

      setInvoices(formattedInvoices);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    }
  };

  const fetchStats = async () => {
    try {
      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select('total, status, created_at')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const invoices = invoicesData || [];
      
      // Calculate total earnings from paid invoices only
      const totalEarnings = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(String(inv.total || '0')), 0);

      // Count total invoices
      const totalInvoices = invoices.length;

      // Count pending invoices
      const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;

      // Calculate monthly growth (comparing this month to last month)
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const currentMonthEarnings = invoices
        .filter(inv => 
          new Date(inv.created_at) >= currentMonth && inv.status === 'paid'
        )
         .reduce((sum, inv) => sum + parseFloat(String(inv.total || '0')), 0);

      const lastMonthEarnings = invoices
        .filter(inv => 
          new Date(inv.created_at) >= lastMonth && 
          new Date(inv.created_at) < currentMonth &&
          inv.status === 'paid'
        )
        .reduce((sum, inv) => sum + parseFloat(String(inv.total || '0')), 0);

      const monthlyGrowth = lastMonthEarnings > 0 
        ? ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
        : 0;

      setStats({
        totalEarnings,
        totalInvoices,
        pendingInvoices,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('total, created_at, status')
        .eq('user_id', user?.id)
        .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());

      if (error) {
        console.error('Error fetching chart data:', error);
        return;
      }

      // Group by month (only paid invoices for earnings)
      const monthlyEarnings = (data || []).reduce((acc, invoice) => {
        if (invoice.status === 'paid') {
          const month = new Date(invoice.created_at).toLocaleString('default', { month: 'short' });
          const earnings = parseFloat(String(invoice.total || '0'));
          
          if (!acc[month]) {
            acc[month] = 0;
          }
          acc[month] += earnings;
        }
        
        return acc;
      }, {} as Record<string, number>);

      // Convert to chart format
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartData = months.map(month => ({
        month,
        earnings: monthlyEarnings[month] || 0
      }));

      setChartData(chartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const handleViewInvoice = (id: string) => {
    navigate(`/invoice/${id}`);
  };

  const handleEditInvoice = (id: string) => {
    navigate(`/invoice/${id}/edit`);
  };

  const handleDownloadInvoice = async (id: string) => {
    try {
      // Get invoice data
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (invoiceError) {
        toast.error('Failed to fetch invoice');
        return;
      }

      // Get invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);

      if (itemsError) {
        toast.error('Failed to fetch invoice items');
        return;
      }

      // Create a temporary div for PDF generation
      const invoiceElement = document.createElement('div');
      invoiceElement.style.width = '210mm';
      invoiceElement.style.padding = '20mm';
      invoiceElement.style.backgroundColor = 'white';
      invoiceElement.style.fontFamily = 'Arial, sans-serif';
      
      // Format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: invoiceData.currency || 'USD',
        }).format(amount);
      };

      // Create invoice HTML
      invoiceElement.innerHTML = `
        <div style="margin-bottom: 40px;">
          <h1 style="font-size: 32px; margin-bottom: 10px;">Invoice ${invoiceData.invoice_number}</h1>
          <p style="color: #666;">Date: ${new Date(invoiceData.date).toLocaleDateString()}</p>
          ${invoiceData.due_date ? `<p style="color: #666;">Due: ${new Date(invoiceData.due_date).toLocaleDateString()}</p>` : ''}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="margin-bottom: 10px;">Bill To:</h3>
          <p style="margin: 5px 0;"><strong>${invoiceData.client_name || 'Unknown Client'}</strong></p>
          ${invoiceData.client_email ? `<p style="margin: 5px 0;">${invoiceData.client_email}</p>` : ''}
          ${invoiceData.client_phone ? `<p style="margin: 5px 0;">${invoiceData.client_phone}</p>` : ''}
          ${invoiceData.client_address ? `<p style="margin: 5px 0; white-space: pre-line;">${invoiceData.client_address}</p>` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Description</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Price</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsData?.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">${item.description}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(item.unit_price)}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(item.total)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div style="text-align: right; margin-bottom: 30px;">
          <div style="display: inline-block; text-align: left;">
            <div style="margin: 5px 0; display: flex; justify-content: space-between; min-width: 200px;">
              <span>Subtotal:</span>
              <span style="margin-left: 20px;">${formatCurrency(invoiceData.subtotal)}</span>
            </div>
            ${invoiceData.discount_amount > 0 ? `
              <div style="margin: 5px 0; display: flex; justify-content: space-between;">
                <span>Discount:</span>
                <span style="margin-left: 20px;">-${formatCurrency(invoiceData.discount_amount)}</span>
              </div>
            ` : ''}
            ${invoiceData.tax_amount > 0 ? `
              <div style="margin: 5px 0; display: flex; justify-content: space-between;">
                <span>Tax (${invoiceData.tax_rate}%):</span>
                <span style="margin-left: 20px;">${formatCurrency(invoiceData.tax_amount)}</span>
              </div>
            ` : ''}
            <div style="margin: 10px 0; padding-top: 10px; border-top: 2px solid #333; display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
              <span>Total:</span>
              <span style="margin-left: 20px;">${formatCurrency(invoiceData.total)}</span>
            </div>
          </div>
        </div>

        ${invoiceData.notes ? `
          <div style="margin-top: 30px;">
            <h3 style="margin-bottom: 10px;">Notes:</h3>
            <p style="white-space: pre-line; color: #666;">${invoiceData.notes}</p>
          </div>
        ` : ''}
      `;

      // Temporarily add to body for rendering
      document.body.appendChild(invoiceElement);

      // Generate PDF using html2canvas and jsPDF
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(invoiceElement, {
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
      pdf.save(`invoice-${invoiceData.invoice_number}.pdf`);

      // Clean up
      document.body.removeChild(invoiceElement);
      
      toast.success('Invoice PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice');
        return;
      }

      toast.success('Invoice deleted successfully');
      await loadDashboardData(); // Refresh the data
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error updating invoice status:', error);
        toast.error('Failed to update invoice status');
        return;
      }

      toast.success(`Invoice status updated to ${newStatus}`);
      await loadDashboardData(); // Refresh the data
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const handleCreateInvoice = () => {
    navigate('/invoice/new');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SubscriptionProtectedRoute>
      <div className="min-h-screen bg-background w-full">
        <DashboardHeader />
        
        <main className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Welcome back! Here's an overview of your invoices.
              </p>
            </div>
            <Button onClick={handleCreateInvoice} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </div>

          <StatsCards
            totalEarnings={stats.totalEarnings}
            totalInvoices={stats.totalInvoices}
            pendingInvoices={stats.pendingInvoices}
            monthlyGrowth={stats.monthlyGrowth}
            currency={profile?.currency || 'USD'}
          />

          <div className="space-y-6 lg:space-y-8">
            <div className="w-full">
              <EarningsChart data={chartData} currency={profile?.currency || 'USD'} />
            </div>
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Recent Invoices</h3>
              <InvoiceTable
                invoices={invoices.slice(0, 5)}
                onViewInvoice={handleViewInvoice}
                onEditInvoice={handleEditInvoice}
                onDownloadInvoice={handleDownloadInvoice}
                onDeleteInvoice={handleDeleteInvoice}
                onStatusChange={handleStatusChange}
                defaultCurrency={profile?.currency || 'USD'}
              />
            </div>
          </div>
        </main>
      </div>
    </SubscriptionProtectedRoute>
  );
};

export default Dashboard;