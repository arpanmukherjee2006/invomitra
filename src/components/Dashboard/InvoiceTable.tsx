import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, Search, Eye, Download, Edit, Trash2, CheckCircle } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name?: string;
  total: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  currency?: string;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  onViewInvoice: (id: string) => void;
  onEditInvoice: (id: string) => void;
  onDownloadInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onStatusChange: (id: string, newStatus: 'paid' | 'pending' | 'overdue') => void;
  defaultCurrency?: string;
}

const InvoiceTable = ({ 
  invoices, 
  onViewInvoice, 
  onEditInvoice, 
  onDownloadInvoice,
  onDeleteInvoice,
  onStatusChange,
  defaultCurrency = 'USD'
}: InvoiceTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || defaultCurrency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No invoices found
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div 
              key={invoice.id} 
              className="bg-card border rounded-lg p-4 space-y-3 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm text-foreground">
                    {invoice.invoice_number}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {invoice.client_name || 'N/A'}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onViewInvoice(invoice.id)}>
                      <Eye className="mr-2 h-4 w-4 text-blue-500" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditInvoice(invoice.id)}>
                      <Edit className="mr-2 h-4 w-4 text-amber-500" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownloadInvoice(invoice.id)}>
                      <Download className="mr-2 h-4 w-4 text-green-500" />
                      Download
                    </DropdownMenuItem>
                    {invoice.status !== 'paid' && (
                      <DropdownMenuItem onClick={() => onStatusChange(invoice.id, 'paid')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                        Mark as Paid
                      </DropdownMenuItem>
                    )}
                    <div className="my-1 border-t" />
                    <DropdownMenuItem 
                      onClick={() => onDeleteInvoice(invoice.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">
                  {formatCurrency(invoice.total, invoice.currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(invoice.date)}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <Badge variant={getStatusVariant(invoice.status)} className="text-xs">
                  {invoice.status}
                </Badge>
                {invoice.status !== 'paid' && (
                  <Select
                    value={invoice.status}
                    onValueChange={(value) => onStatusChange(invoice.id, value as 'paid' | 'pending' | 'overdue')}
                  >
                    <SelectTrigger className="w-24 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px] text-xs sm:text-sm">Invoice #</TableHead>
              <TableHead className="min-w-[80px] text-xs sm:text-sm">Client</TableHead>
              <TableHead className="min-w-[80px] text-xs sm:text-sm">Amount</TableHead>
              <TableHead className="min-w-[70px] text-xs sm:text-sm">Date</TableHead>
              <TableHead className="min-w-[90px] text-xs sm:text-sm">Status</TableHead>
              <TableHead className="w-[50px] sm:w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm px-2 sm:px-4 truncate max-w-[80px]">
                    {invoice.client_name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm px-2 sm:px-4">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm px-2 sm:px-4">
                    {formatDate(invoice.date)}
                  </TableCell>
                  <TableCell className="px-2 sm:px-4">
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <Badge variant={getStatusVariant(invoice.status)} className="w-fit text-xs">
                        {invoice.status}
                      </Badge>
                      {invoice.status !== 'paid' && (
                        <Select
                          value={invoice.status}
                          onValueChange={(value) => onStatusChange(invoice.id, value as 'paid' | 'pending' | 'overdue')}
                        >
                          <SelectTrigger className="w-full h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-2 sm:px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-full">
                          <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onViewInvoice(invoice.id)}>
                          <Eye className="mr-2 h-4 w-4 text-blue-500" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditInvoice(invoice.id)}>
                          <Edit className="mr-2 h-4 w-4 text-amber-500" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownloadInvoice(invoice.id)}>
                          <Download className="mr-2 h-4 w-4 text-green-500" />
                          Download
                        </DropdownMenuItem>
                        {invoice.status !== 'paid' && (
                          <DropdownMenuItem onClick={() => onStatusChange(invoice.id, 'paid')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                        <div className="my-1 border-t" />
                        <DropdownMenuItem 
                          onClick={() => onDeleteInvoice(invoice.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InvoiceTable;