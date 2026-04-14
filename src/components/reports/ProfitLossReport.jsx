import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, DollarSign, Receipt, Wallet, Download } from "lucide-react";
import { Wadaq } from "@/api/WadaqCore";
import { useLanguage } from "@/components/LanguageContext";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function ProfitLossReport() {
  const { language } = useLanguage();
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['profitLoss', startDate, endDate],
    queryFn: async () => {
      const [invoices, expenses] = await Promise.all([
        Wadaq.entities.Invoice.filter({
          status: 'paid',
          date: { $gte: startDate, $lte: endDate }
        }),
        Wadaq.entities.Expense.filter({
          date: { $gte: startDate, $lte: endDate }
        })
      ]);

      // Calculate revenue
      const revenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const taxCollected = invoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
      const netRevenue = revenue - taxCollected;

      // Calculate COGS (Cost of Goods Sold)
      let cogs = 0;
      for (const invoice of invoices) {
        for (const item of invoice.items || []) {
          const product = await Wadaq.entities.Product.get(item.product_id).catch(() => null);
          if (product?.cost_price) {
            cogs += product.cost_price * item.quantity;
          }
        }
      }

      const grossProfit = netRevenue - cogs;
      const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

      // Calculate expenses by category
      const expensesByCategory = {};
      let totalExpenses = 0;
      
      expenses.forEach(expense => {
        const category = expense.category || 'other';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + (expense.amount || 0);
        totalExpenses += expense.amount || 0;
      });

      const operatingExpenses = totalExpenses;
      const netProfit = grossProfit - operatingExpenses;
      const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

      return {
        revenue,
        taxCollected,
        netRevenue,
        cogs,
        grossProfit,
        grossMargin,
        expensesByCategory,
        totalExpenses,
        operatingExpenses,
        netProfit,
        netMargin,
        invoiceCount: invoices.length,
        expenseCount: expenses.length
      };
    }
  });

  const exportReport = () => {
    if (!reportData) return;
    
    const content = `
تقرير الأرباح والخسائر
الفترة: ${startDate} إلى ${endDate}

الإيرادات:
إجمالي الإيرادات: ${reportData.revenue.toLocaleString()} ر.س
الضرائب المحصلة: ${reportData.taxCollected.toLocaleString()} ر.س
صافي الإيرادات: ${reportData.netRevenue.toLocaleString()} ر.س

تكلفة البضاعة المباعة: ${reportData.cogs.toLocaleString()} ر.س

إجمالي الربح: ${reportData.grossProfit.toLocaleString()} ر.س
هامش الربح الإجمالي: ${reportData.grossMargin.toFixed(2)}%

المصروفات التشغيلية: ${reportData.operatingExpenses.toLocaleString()} ر.س

صافي الربح: ${reportData.netProfit.toLocaleString()} ر.س
هامش الربح الصافي: ${reportData.netMargin.toFixed(2)}%
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit_loss_${startDate}_${endDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'تقرير الأرباح والخسائر' : 'Profit & Loss Report'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-t-4 border-t-emerald-600">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {language === 'ar' ? 'تقرير الأرباح والخسائر' : 'Profit & Loss Report'}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'ar' ? 'تحليل مفصل للإيرادات والمصروفات' : 'Detailed revenue and expense analysis'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'تصدير' : 'Export'}
          </Button>
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

        {/* Revenue Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            {language === 'ar' ? 'الإيرادات' : 'Revenue'}
          </h3>
          <div className="grid gap-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">{language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</span>
              <span className="font-semibold text-emerald-600" dir="ltr">
                {reportData?.revenue.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">{language === 'ar' ? 'الضرائب المحصلة' : 'Tax Collected'}</span>
              <span className="font-medium text-slate-700" dir="ltr">
                -{reportData?.taxCollected.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="font-semibold text-slate-800">{language === 'ar' ? 'صافي الإيرادات' : 'Net Revenue'}</span>
              <span className="font-bold text-emerald-700" dir="ltr">
                {reportData?.netRevenue.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
              </span>
            </div>
          </div>
        </div>

        {/* COGS Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            {language === 'ar' ? 'تكلفة البضاعة المباعة' : 'Cost of Goods Sold'}
          </h3>
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-slate-600">{language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'}</span>
            <span className="font-semibold text-blue-700" dir="ltr">
              {reportData?.cogs.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
            </span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-slate-800">{language === 'ar' ? 'إجمالي الربح' : 'Gross Profit'}</span>
            <span className="font-bold text-xl text-emerald-700" dir="ltr">
              {reportData?.grossProfit.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>{language === 'ar' ? 'هامش الربح الإجمالي:' : 'Gross Margin:'}</span>
            <span className="font-semibold text-emerald-600">{reportData?.grossMargin.toFixed(2)}%</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-rose-600" />
            {language === 'ar' ? 'المصروفات التشغيلية' : 'Operating Expenses'}
          </h3>
          <div className="space-y-2">
            {Object.entries(reportData?.expensesByCategory || {}).map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600 capitalize">{category}</span>
                <span className="font-medium text-rose-600" dir="ltr">
                  {amount.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-rose-200">
              <span className="font-semibold text-slate-800">{language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</span>
              <span className="font-bold text-rose-700" dir="ltr">
                {reportData?.operatingExpenses.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
              </span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`p-6 rounded-xl border-2 ${
          (reportData?.netProfit || 0) >= 0 
            ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-300' 
            : 'bg-gradient-to-r from-rose-100 to-red-100 border-rose-300'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {(reportData?.netProfit || 0) >= 0 ? (
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-rose-600" />
              )}
              <span className="font-bold text-xl text-slate-800">
                {language === 'ar' ? 'صافي الربح' : 'Net Profit'}
              </span>
            </div>
            <span className={`font-bold text-3xl ${
              (reportData?.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`} dir="ltr">
              {reportData?.netProfit.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-medium">{language === 'ar' ? 'هامش الربح الصافي:' : 'Net Margin:'}</span>
            <span className={`font-bold text-lg ${
              (reportData?.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {reportData?.netMargin.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">{language === 'ar' ? 'عدد الفواتير' : 'Invoices'}</p>
            <p className="text-2xl font-bold text-blue-600">{reportData?.invoiceCount || 0}</p>
          </div>
          <div className="text-center p-3 bg-rose-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">{language === 'ar' ? 'عدد المصروفات' : 'Expenses'}</p>
            <p className="text-2xl font-bold text-rose-600">{reportData?.expenseCount || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}