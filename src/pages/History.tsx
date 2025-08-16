import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';
import DashboardHeader from '@/components/Dashboard/DashboardHeader';

interface MonthlyData {
  month: string;
  year: number;
  totalEarnings: number;
  paidEarnings: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  averageInvoiceValue: number;
  growth: number;
}

const History = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [userCurrency, setUserCurrency] = useState('USD');

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    
    fetchHistoryData();
  }, [user, loading, selectedYear]);

  const fetchHistoryData = async () => {
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', `${selectedYear}-01-01`)
        .lt('created_at', `${selectedYear + 1}-01-01`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history data:', error);
        toast.error('Failed to fetch history data');
        return;
      }

      // Determine most used currency
      const currencyCount = new Map<string, number>();
      (data || []).forEach(invoice => {
        const currency = invoice.currency || 'USD';
        currencyCount.set(currency, (currencyCount.get(currency) || 0) + 1);
      });
      
      let mostUsedCurrency = 'USD';
      let maxCount = 0;
      currencyCount.forEach((count, currency) => {
        if (count > maxCount) {
          maxCount = count;
          mostUsedCurrency = currency;
        }
      });
      setUserCurrency(mostUsedCurrency);

      // Group data by month
      const monthlyMap = new Map<string, any>();
      
      // Initialize all months for the selected year
      for (let month = 0; month < 12; month++) {
        const date = new Date(selectedYear, month, 1);
        const monthKey = date.toLocaleString('default', { month: 'long' });
        monthlyMap.set(monthKey, {
          month: monthKey,
          year: selectedYear,
          totalEarnings: 0,
          paidEarnings: 0,
          totalInvoices: 0,
          paidInvoices: 0,
          pendingInvoices: 0,
          overdueInvoices: 0,
          invoices: []
        });
      }

      // Process invoices
      (data || []).forEach(invoice => {
        const invoiceDate = new Date(invoice.created_at);
        const monthKey = invoiceDate.toLocaleString('default', { month: 'long' });
        const monthData = monthlyMap.get(monthKey);
        
        if (monthData) {
          const invoiceTotal = parseFloat(String(invoice.total || '0'));
          
          monthData.totalEarnings += invoiceTotal;
          monthData.totalInvoices += 1;
          monthData.invoices.push(invoice);
          
          if (invoice.status === 'paid') {
            monthData.paidEarnings += invoiceTotal;
            monthData.paidInvoices += 1;
          } else if (invoice.status === 'pending') {
            monthData.pendingInvoices += 1;
          } else if (invoice.status === 'overdue') {
            monthData.overdueInvoices += 1;
          }
        }
      });

      // Calculate averages and growth
      const processedData: MonthlyData[] = [];
      let previousPaidEarnings = 0;

      Array.from(monthlyMap.values()).forEach(monthData => {
        const averageInvoiceValue = monthData.totalInvoices > 0 
          ? monthData.totalEarnings / monthData.totalInvoices 
          : 0;
        
        const growth = previousPaidEarnings > 0 
          ? ((monthData.paidEarnings - previousPaidEarnings) / previousPaidEarnings) * 100 
          : 0;

        processedData.push({
          ...monthData,
          averageInvoiceValue,
          growth: Math.round(growth * 10) / 10
        });

        if (monthData.paidEarnings > 0) {
          previousPaidEarnings = monthData.paidEarnings;
        }
      });

      setMonthlyData(processedData);
    } catch (error) {
      console.error('Error fetching history data:', error);
      toast.error('Failed to fetch history data');
    } finally {
      setDataLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push(year);
    }
    return years;
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Earnings History</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Monthly breakdown of your invoices and earnings
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-md bg-background w-full sm:w-auto"
            >
              {getAvailableYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {monthlyData.map((month, index) => (
              <Card key={month.month} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{month.month} {month.year}</span>
                    {month.growth !== 0 && (
                      <Badge variant={month.growth > 0 ? "default" : "secondary"} className="flex items-center gap-1">
                        {month.growth > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(month.growth)}%
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Paid Earnings</span>
                      </div>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(month.paidEarnings)}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Total Invoices</span>
                      </div>
                      <p className="text-xl font-bold">
                        {month.totalInvoices}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Earnings:</span>
                      <span className="font-medium">{formatCurrency(month.totalEarnings)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Average Invoice:</span>
                      <span className="font-medium">{formatCurrency(month.averageInvoiceValue)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {month.paidInvoices} Paid
                    </Badge>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                      {month.pendingInvoices} Pending
                    </Badge>
                    {month.overdueInvoices > 0 && (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        {month.overdueInvoices} Overdue
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!dataLoading && monthlyData.every(m => m.totalInvoices === 0) && (
          <div className="text-center py-16">
            <div className="mx-auto max-w-md">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No data for {selectedYear}</h3>
              <p className="text-muted-foreground">
                No invoices found for this year. Try selecting a different year or create your first invoice.
              </p>
              <Button 
                onClick={() => navigate('/invoice/new')} 
                className="mt-4"
              >
                Create Your First Invoice
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default History;