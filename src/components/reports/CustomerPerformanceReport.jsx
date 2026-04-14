import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, DollarSign, Clock, Award, Download } from "lucide-react";
import { Wadaq } from "@/api/WadaqCore";
import { useLanguage } from "@/components/LanguageContext";

export default function CustomerPerformanceReport() {
  const { language } = useLanguage();
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['customerPerformance', startDate, endDate],
    queryFn: async () => {
      const [invoices, customers] = await Promise.all([
        Wadaq.entities.Invoice.filter({
          date: { $gte: startDate, $lte: endDate }
        }),
        Wadaq.entities.Customer.list()
      ]);

      // Group invoices by customer
      const customerStats = {};
      
      invoices.forEach(invoice => {
        const customerId = invoice.customer_id;
        if (!customerId) return;

        if (!customerStats[customerId]) {
          customerStats[customerId] = {
            customer_id: customerId,
            customer_name: invoice.customer_name,
            total_sales: 0,
            invoice_count: 0,
            paid_count: 0,
            overdue_count: 0,
            total_paid: 0,
            total_pending: 0,
            avg_invoice_value: 0,
            last_purchase_date: null,
            payment_rate: 0
          };
        }

        const stats = customerStats[customerId];
        stats.total_sales += invoice.total || 0;
        stats.invoice_count++;

        if (invoice.status === 'paid') {
          stats.paid_count++;
          stats.total_paid += invoice.total || 0;
        } else if (invoice.status === 'overdue') {
          stats.overdue_count++;
          stats.total_pending += invoice.total || 0;
        } else if (invoice.status === 'sent') {
          stats.total_pending += invoice.total || 0;
        }

        // Track last purchase date
        if (!stats.last_purchase_date || invoice.date > stats.last_purchase_date) {
          stats.last_purchase_date = invoice.date;
        }
      });

      // Calculate averages and rates
      Object.values(customerStats).forEach(stats => {
        stats.avg_invoice_value = stats.invoice_count > 0 ? stats.total_sales / stats.invoice_count : 0;
        stats.payment_rate = stats.invoice_count > 0 ? (stats.paid_count / stats.invoice_count) * 100 : 0;
        
        // Calculate days since last purchase
        if (stats.last_purchase_date) {
          const lastDate = new Date(stats.last_purchase_date);
          const today = new Date();
          stats.days_since_purchase = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        }
      });

      // Sort by total sales
      const sortedCustomers = Object.values(customerStats).sort((a, b) => b.total_sales - a.total_sales);

      // Calculate totals
      const totalSales = sortedCustomers.reduce((sum, c) => sum + c.total_sales, 0);
      const totalInvoices = sortedCustomers.reduce((sum, c) => sum + c.invoice_count, 0);
      const avgPaymentRate = sortedCustomers.length > 0 
        ? sortedCustomers.reduce((sum, c) => sum + c.payment_rate, 0) / sortedCustomers.length 
        : 0;

      // Top customers (top 5)
      const topCustomers = sortedCustomers.slice(0, 5);

      return {
        customers: sortedCustomers,
        topCustomers,
        totalSales,
        totalInvoices,
        avgPaymentRate,
        customerCount: sortedCustomers.length
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'تقرير أداء العملاء' : 'Customer Performance Report'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-t-4 border-t-purple-600">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {language === 'ar' ? 'تقرير أداء العملاء' : 'Customer Performance Report'}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'ar' ? 'تحليل المبيعات وسلوك الدفع' : 'Sales analysis and payment behavior'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'من تاريخ' : 'From Date'}</Label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'إلى تاريخ' : 'To Date'}</Label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-slate-600">{language === 'ar' ? 'العملاء' : 'Customers'}</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{reportData?.customerCount || 0}</p>
          </div>
          
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-slate-600">{language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}</span>
            </div>
            <p className="text-xl font-bold text-emerald-700" dir="ltr">
              {reportData?.totalSales.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-600">{language === 'ar' ? 'الفواتير' : 'Invoices'}</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{reportData?.totalInvoices || 0}</p>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-slate-600">{language === 'ar' ? 'معدل الدفع' : 'Payment Rate'}</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{reportData?.avgPaymentRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Top Customers */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            {language === 'ar' ? 'أفضل 5 عملاء' : 'Top 5 Customers'}
          </h3>
          
          <div className="grid gap-3">
            {reportData?.topCustomers.map((customer, index) => (
              <div key={customer.customer_id} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                      index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                      'bg-gradient-to-br from-blue-400 to-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{customer.customer_name}</p>
                      <p className="text-xs text-slate-500">
                        {customer.invoice_count} {language === 'ar' ? 'فاتورة' : 'invoices'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-emerald-600" dir="ltr">
                      {customer.total_sales.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${
                        customer.payment_rate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        customer.payment_rate >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {customer.payment_rate.toFixed(0)}% {language === 'ar' ? 'دفع' : 'paid'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Customers Table */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-slate-800">
            {language === 'ar' ? 'جميع العملاء' : 'All Customers'}
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-right p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'العميل' : 'Customer'}
                  </th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'المبيعات' : 'Sales'}
                  </th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'الفواتير' : 'Invoices'}
                  </th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'معدل الدفع' : 'Payment Rate'}
                  </th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'متوسط الفاتورة' : 'Avg Invoice'}
                  </th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'آخر شراء' : 'Last Purchase'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.customers.map((customer) => (
                  <tr key={customer.customer_id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-medium text-slate-800">{customer.customer_name}</p>
                    </td>
                    <td className="p-3 text-center font-semibold text-emerald-600" dir="ltr">
                      {customer.total_sales.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">{customer.invoice_count}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={
                        customer.payment_rate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        customer.payment_rate >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }>
                        {customer.payment_rate.toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="p-3 text-center text-slate-600" dir="ltr">
                      {customer.avg_invoice_value.toLocaleString(0)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm text-slate-600">{customer.last_purchase_date}</span>
                        {customer.days_since_purchase !== undefined && (
                          <span className="text-xs text-slate-500">
                            ({customer.days_since_purchase} {language === 'ar' ? 'يوم' : 'days'})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}