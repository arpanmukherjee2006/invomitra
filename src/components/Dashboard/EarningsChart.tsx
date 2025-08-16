import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface EarningsChartProps {
  data: Array<{
    month: string;
    earnings: number;
  }>;
  currency?: string;
}

const EarningsChart = ({ data, currency = 'USD' }: EarningsChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };
  return (
    <Card className="w-full">
      <CardHeader className="px-3 py-4 sm:px-6 sm:py-6">
        <CardTitle className="text-base sm:text-lg lg:text-xl">Monthly Earnings</CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-2 sm:px-6 sm:py-4">
        <ResponsiveContainer width="100%" height={180} className="sm:h-[220px] lg:h-[280px]">
          <LineChart 
            data={data} 
            margin={{ 
              left: 5, 
              right: 5, 
              top: 10, 
              bottom: window.innerWidth < 640 ? 60 : 40 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              tick={{ 
                fill: 'hsl(var(--muted-foreground))', 
                fontSize: window.innerWidth < 640 ? 8 : 10 
              }}
              tickLine={false}
              axisLine={false}
              interval={window.innerWidth < 640 ? 1 : 0}
              angle={window.innerWidth < 640 ? -90 : -45}
              textAnchor="end"
              height={window.innerWidth < 640 ? 60 : 50}
              className="text-[8px] sm:text-xs"
            />
            <YAxis 
              tick={{ 
                fill: 'hsl(var(--muted-foreground))', 
                fontSize: window.innerWidth < 640 ? 8 : 10 
              }}
              tickFormatter={formatCurrency}
              tickLine={false}
              axisLine={false}
              width={window.innerWidth < 640 ? 45 : 55}
              className="text-[8px] sm:text-xs"
            />
            <Tooltip 
              labelFormatter={(label) => `Month: ${label}`}
              formatter={(value) => [formatCurrency(Number(value)), 'Earnings']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: window.innerWidth < 640 ? '12px' : '14px',
                padding: window.innerWidth < 640 ? '8px' : '12px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="earnings" 
              stroke="hsl(var(--primary))" 
              strokeWidth={window.innerWidth < 640 ? 1.5 : 2}
              dot={{ 
                fill: 'hsl(var(--primary))', 
                strokeWidth: 2, 
                r: window.innerWidth < 640 ? 2 : 3 
              }}
              activeDot={{ 
                r: window.innerWidth < 640 ? 4 : 5, 
                stroke: 'hsl(var(--primary))', 
                strokeWidth: 2 
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EarningsChart;