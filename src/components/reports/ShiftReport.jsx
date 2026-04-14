import React from 'react';
import { Wadaq } from '@/api/WadaqCore';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageContext';
import { Download, Users, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import ExportData from './ExportData';

export default function ShiftReport() {
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedUser, setSelectedUser] = React.useState('all');

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => Wadaq.entities.Invoice.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => Wadaq.entities.User.list(),
  });

  // Calculate shift data
  const shiftData = React.useMemo(() => {
    const startDate = startOfDay(new Date(selectedDate));
    const endDate = endOfDay(new Date(selectedDate));

    const filteredInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.created_date);
      const dateMatch = invDate >= startDate && invDate <= endDate;
      const userMatch = selectedUser === 'all' || inv.created_by === selectedUser;
      return dateMatch && userMatch;
    });

    const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid');
    
    const totalSales = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalTax = paidInvoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
    const cashSales = paidInvoices.filter(inv => inv.payment_method === 'cash').reduce((sum, inv) => sum + (inv.total || 0), 0);
    const cardSales = paidInvoices.filter(inv => inv.payment_method === 'credit_card').reduce((sum, inv) => sum + (inv.total || 0), 0);
    const transferSales = paidInvoices.filter(inv => inv.payment_method === 'bank_transfer').reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Group by cashier
    const byCashier = {};
    filteredInvoices.forEach(inv => {
      const cashier = inv.created_by || 'Unknown';
      if (!byCashier[cashier]) {
        byCashier[cashier] = {
          count: 0,
          total: 0,
          paid: 0,
        };
      }
      byCashier[cashier].count++;
      byCashier[cashier].total += (inv.total || 0);
      if (inv.status === 'paid') {
        byCashier[cashier].paid += (inv.total || 0);
      }
    });

    return {
      totalInvoices: filteredInvoices.length,
      paidInvoices: paidInvoices.length,
      totalSales,
      totalTax,
      cashSales,
      cardSales,
      transferSales,
      byCashier: Object.entries(byCashier).map(([email, data]) => ({
        email,
        ...data,
      })),
    };
  }, [invoices, selectedDate, selectedUser]);

  const exportData = React.useMemo(() => {
    return [{
      date: selectedDate,
      cashier: selectedUser === 'all' ? 'All' : selectedUser,
      totalInvoices: shiftData.totalInvoices,
      paidInvoices: shiftData.paidInvoices,
      totalSales: shiftData.totalSales,
      totalTax: shiftData.totalTax,
      cashSales: shiftData.cashSales,
      cardSales: shiftData.cardSales,
      transferSales: shiftData.transferSales,
    }];
  }, [shiftData, selectedDate, selectedUser]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">
            {language === 'ar' ? 'تقرير الوردية' : 'Shift Report'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 text-sm mb-2 block">
                {language === 'ar' ? 'التاريخ' : 'Date'}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-2 block">
                {language === 'ar' ? 'الكاشير' : 'Cashier'}
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
              >
                <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
                {users.map(user => (
                  <option key={user.id} value={user.email}>{user.full_name || user.email}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <ExportData
                data={exportData}
                filename={`shift-report-${selectedDate}`}
                title={language === 'ar' ? 'تقرير الوردية' : 'Shift Report'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">{language === 'ar' ? 'عدد الفواتير' : 'Total Invoices'}</p>
                <p className="text-3xl font-bold text-white">{shiftData.totalInvoices}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">{language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}</p>
                <p className="text-3xl font-bold text-white">{shiftData.totalSales.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">{language === 'ar' ? 'الضرائب' : 'Taxes'}</p>
                <p className="text-3xl font-bold text-white">{shiftData.totalTax.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">{language === 'ar' ? 'نقدي' : 'Cash'}</p>
                <p className="text-3xl font-bold text-white">{shiftData.cashSales.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">
            {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-slate-400 text-sm">{language === 'ar' ? 'نقدي' : 'Cash'}</p>
              <p className="text-2xl font-bold text-white">{shiftData.cashSales.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-slate-400 text-sm">{language === 'ar' ? 'بطاقة' : 'Card'}</p>
              <p className="text-2xl font-bold text-white">{shiftData.cardSales.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-slate-400 text-sm">{language === 'ar' ? 'تحويل' : 'Transfer'}</p>
              <p className="text-2xl font-bold text-white">{shiftData.transferSales.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Cashier */}
      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">
            {language === 'ar' ? 'حسب الكاشير' : 'By Cashier'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shiftData.byCashier.map(cashier => (
              <div key={cashier.email} className="p-4 rounded-lg bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-white font-medium">{cashier.email}</p>
                    <p className="text-slate-400 text-sm">
                      {cashier.count} {language === 'ar' ? 'فاتورة' : 'invoices'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">{cashier.paid.toLocaleString()}</p>
                  <p className="text-slate-400 text-sm">{language === 'ar' ? 'مدفوع' : 'Paid'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}