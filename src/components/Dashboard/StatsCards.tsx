import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FileText, Clock, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  totalEarnings: number;
  totalInvoices: number;
  pendingInvoices: number;
  monthlyGrowth: number;
  currency?: string;
}

const StatsCards = ({ totalEarnings, totalInvoices, pendingInvoices, monthlyGrowth, currency = 'USD' }: StatsCardsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Earnings</CardTitle>
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(totalEarnings)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            All time revenue
          </p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Invoices</CardTitle>
          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-lg sm:text-2xl font-bold">{totalInvoices}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Invoices created
          </p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Pending</CardTitle>
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-lg sm:text-2xl font-bold">{pendingInvoices}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Awaiting payment
          </p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Growth</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-lg sm:text-2xl font-bold">{monthlyGrowth}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            vs last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;