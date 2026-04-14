import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { useLanguage } from "@/components/LanguageContext";
import { format, parseISO, differenceInDays } from "date-fns";
import { FileText, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function InvoiceStatusReport({ invoices }) {
  const { language } = useLanguage();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'sent': return <Clock className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: language === 'ar' ? 'مسودة' : 'Draft',
      sent: language === 'ar' ? 'مُرسلة' : 'Sent',
      paid: language === 'ar' ? 'مدفوعة' : 'Paid',
      overdue: language === 'ar' ? 'متأخرة' : 'Overdue',
      cancelled: language === 'ar' ? 'ملغية' : 'Cancelled'
    };
    return labels[status] || status;
  };

  // Group invoices by status
  const draftInvoices = invoices.filter(inv => inv.status === 'draft');
  const sentInvoices = invoices.filter(inv => inv.status === 'sent');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
  const cancelledInvoices = invoices.filter(inv => inv.status === 'cancelled');

  // Calculate totals
  const draftTotal = draftInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const sentTotal = sentInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const paidTotal = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  const statusGroups = [
    {
      status: 'draft',
      label: language === 'ar' ? 'مسودات' : 'Drafts',
      invoices: draftInvoices,
      total: draftTotal,
      icon: FileText,
      color: 'border-slate-500'
    },
    {
      status: 'sent',
      label: language === 'ar' ? 'مُرسلة' : 'Sent',
      invoices: sentInvoices,
      total: sentTotal,
      icon: Clock,
      color: 'border-blue-500'
    },
    {
      status: 'paid',
      label: language === 'ar' ? 'مدفوعة' : 'Paid',
      invoices: paidInvoices,
      total: paidTotal,
      icon: CheckCircle,
      color: 'border-emerald-500'
    },
    {
      status: 'overdue',
      label: language === 'ar' ? 'متأخرة' : 'Overdue',
      invoices: overdueInvoices,
      total: overdueTotal,
      icon: AlertTriangle,
      color: 'border-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusGroups.map(group => {
          const Icon = group.icon;
          return (
            <Card key={group.status} className={`border-t-4 ${group.color}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-5 h-5 text-slate-600" />
                  <Badge className={getStatusColor(group.status)}>
                    {group.invoices.length}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-1">{group.label}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {group.total.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Lists */}
      {statusGroups.map(group => {
        if (group.invoices.length === 0) return null;
        
        return (
          <Card key={`list-${group.status}`} className="shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <group.icon className="w-5 h-5" />
                {group.label} ({group.invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-right">
                      <th className="p-3 text-sm font-medium text-slate-700">
                        {language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}
                      </th>
                      <th className="p-3 text-sm font-medium text-slate-700">
                        {language === 'ar' ? 'العميل' : 'Customer'}
                      </th>
                      <th className="p-3 text-sm font-medium text-slate-700">
                        {language === 'ar' ? 'التاريخ' : 'Date'}
                      </th>
                      {group.status === 'overdue' && (
                        <th className="p-3 text-sm font-medium text-slate-700">
                          {language === 'ar' ? 'أيام التأخير' : 'Days Overdue'}
                        </th>
                      )}
                      <th className="p-3 text-sm font-medium text-slate-700">
                        {language === 'ar' ? 'المبلغ' : 'Amount'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.invoices.map(invoice => {
                      const daysOverdue = invoice.due_date 
                        ? differenceInDays(new Date(), parseISO(invoice.due_date))
                        : 0;
                      
                      return (
                        <tr key={invoice.id} className="border-b hover:bg-slate-50">
                          <td className="p-3 text-sm font-medium">{invoice.invoice_number}</td>
                          <td className="p-3 text-sm">{invoice.customer_name}</td>
                          <td className="p-3 text-sm">
                            {format(parseISO(invoice.date), 'yyyy-MM-dd')}
                          </td>
                          {group.status === 'overdue' && (
                            <td className="p-3">
                              <Badge variant="destructive">
                                {daysOverdue} {language === 'ar' ? 'يوم' : 'days'}
                              </Badge>
                            </td>
                          )}
                          <td className="p-3 text-sm font-bold">
                            {invoice.total.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}