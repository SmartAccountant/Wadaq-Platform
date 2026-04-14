import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Printer, FileText } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import PlanGuard from "@/components/auth/PlanGuard";
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isWithinInterval, parseISO } from "date-fns";

const categoryLabels = { rent: "إيجار", utilities: "خدمات عامة", salaries: "رواتب", supplies: "مستلزمات", marketing: "تسويق ودعاية", maintenance: "صيانة", transportation: "نقل ومواصلات", other: "مصروفات أخرى" };

function ProfitLossContent() {
  const { language } = useLanguage();
  const [period, setPeriod] = useState("month");

  const { data: invoices = [] } = useQuery({ queryKey: ["invoices_pl"], queryFn: async () => { const user = await Wadaq.auth.me(); return Wadaq.entities.Invoice.filter({ created_by: user.email }); } });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses_pl"], queryFn: async () => { const user = await Wadaq.auth.me(); return Wadaq.entities.Expense.filter({ created_by: user.email }); } });
  const { data: products = [] } = useQuery({ queryKey: ["products_pl"], queryFn: async () => { const user = await Wadaq.auth.me(); return Wadaq.entities.Product.filter({ created_by: user.email }); } });

  const getRange = () => {
    const now = new Date();
    switch (period) {
      case "month": return { start: startOfMonth(now), end: endOfMonth(now), label: `${now.toLocaleString("ar-SA", { month: "long" })} ${now.getFullYear()}` };
      case "quarter": return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now), label: "آخر 3 أشهر" };
      case "year": return { start: startOfYear(now), end: endOfYear(now), label: `سنة ${now.getFullYear()}` };
      default: return { start: startOfMonth(now), end: endOfMonth(now), label: "" };
    }
  };
  const { start, end, label } = getRange();

  const paidInvoices = invoices.filter(inv => inv.status === "paid" && inv.date && isWithinInterval(parseISO(inv.date), { start, end }));
  const periodExpenses = expenses.filter(exp => exp.date && isWithinInterval(parseISO(exp.date), { start, end }));

  // Revenue breakdown
  const totalRevenue = paidInvoices.reduce((s, inv) => s + (inv.subtotal || inv.total || 0), 0);
  const totalVAT = paidInvoices.reduce((s, inv) => s + (inv.tax_amount || 0), 0);
  const totalGross = paidInvoices.reduce((s, inv) => s + (inv.total || 0), 0);

  // COGS
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  let totalCOGS = 0;
  paidInvoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const product = productMap[item.product_id];
      if (product?.cost_price) totalCOGS += (product.cost_price * (item.quantity || 1));
    });
  });

  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Expenses by category
  const expByCategory = periodExpenses.reduce((acc, exp) => { acc[exp.category || "other"] = (acc[exp.category || "other"] || 0) + (exp.amount || 0); return acc; }, {});
  const totalOpex = periodExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  const netProfit = grossProfit - totalOpex;
  const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-white">قائمة الأرباح والخسائر</h1>
          <p className="text-slate-400 mt-1 text-sm">تقرير رسمي للأداء المالي</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 bg-slate-800/50 border-white/10 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
              <SelectItem value="year">هذا العام</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handlePrint} variant="outline" className="border-white/10 text-white hover:bg-white/10"><Printer className="w-4 h-4 ml-2" />طباعة</Button>
        </div>
      </div>

      {/* P&L Report Card */}
      <Card className="border-white/10 max-w-2xl mx-auto" style={{ background: "rgba(15,15,30,0.9)" }}>
        <CardHeader className="border-b border-white/10 text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-2"><FileText className="w-6 h-6 text-purple-400" /></div>
          <CardTitle className="text-white text-xl">قائمة الأرباح والخسائر</CardTitle>
          <p className="text-slate-400 text-sm mt-1">{label}</p>
        </CardHeader>
        <CardContent className="p-6 space-y-1">

          {/* Revenue Section */}
          <div className="py-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">الإيرادات</p>
            <Row label="إجمالي المبيعات (قبل الضريبة)" value={totalRevenue} color="text-white" />
            <Row label="ضريبة القيمة المضافة (15%)" value={totalVAT} color="text-amber-300" />
            <TotalRow label="إجمالي الإيرادات شامل الضريبة" value={totalGross} color="text-emerald-400" />
          </div>

          <Divider />

          {/* COGS */}
          <div className="py-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">تكلفة البضاعة المباعة</p>
            <Row label="تكلفة المنتجات المباعة (COGS)" value={totalCOGS} color="text-rose-400" isExpense />
            <TotalRow label="إجمالي الربح" value={grossProfit} color={grossProfit >= 0 ? "text-emerald-400" : "text-rose-400"} sub={`هامش ${grossMargin}%`} />
          </div>

          <Divider />

          {/* Operating Expenses */}
          <div className="py-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">المصروفات التشغيلية</p>
            {Object.entries(expByCategory).map(([cat, amount]) => (
              <Row key={cat} label={categoryLabels[cat] || cat} value={amount} color="text-rose-300" isExpense />
            ))}
            {Object.keys(expByCategory).length === 0 && <p className="text-slate-500 text-sm py-1 px-4">لا توجد مصروفات في هذه الفترة</p>}
            <TotalRow label="إجمالي المصروفات التشغيلية" value={totalOpex} color="text-rose-400" isExpense />
          </div>

          <Divider thick />

          {/* Net Profit */}
          <div className="py-3 px-4 rounded-xl mt-2" style={{ background: netProfit >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {netProfit >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-rose-400" />}
                <span className="font-bold text-white text-lg">صافي الربح</span>
                <span className="text-xs text-slate-400">هامش {netMargin}%</span>
              </div>
              <span className={`text-2xl font-black ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {netProfit >= 0 ? "" : "-"}{Math.abs(netProfit).toLocaleString()} ر.س
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
        {[
          { label: "الإيرادات", value: totalRevenue, icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
          { label: "تكلفة البضاعة", value: totalCOGS, icon: TrendingDown, color: "from-orange-500 to-red-500" },
          { label: "المصروفات", value: totalOpex, icon: TrendingDown, color: "from-rose-500 to-pink-500" },
          { label: "صافي الربح", value: netProfit, icon: DollarSign, color: netProfit >= 0 ? "from-purple-500 to-pink-500" : "from-red-600 to-red-800" },
        ].map((s, i) => (
          <Card key={i} className="border-white/10" style={{ background: "rgba(20,20,40,0.7)" }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-slate-400 text-xs">{s.label}</p><p className={`text-lg font-bold mt-1 ${i === 3 && netProfit < 0 ? "text-rose-400" : "text-white"}`}>{s.value.toLocaleString()} ر.س</p></div>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}><s.icon className="w-4 h-4 text-white" /></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, color, isExpense }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-4 hover:bg-white/5 rounded-lg">
      <span className="text-slate-300 text-sm">{label}</span>
      <span className={`font-medium text-sm ${color}`}>{isExpense && value > 0 ? "(" : ""}{value.toLocaleString()} ر.س{isExpense && value > 0 ? ")" : ""}</span>
    </div>
  );
}

function TotalRow({ label, value, color, sub, isExpense }) {
  return (
    <div className="flex items-center justify-between py-2 px-4 mt-1 border-t border-white/10">
      <div><span className="text-white font-semibold text-sm">{label}</span>{sub && <span className="text-xs text-slate-500 mr-2">{sub}</span>}</div>
      <span className={`font-bold text-sm ${color}`}>{isExpense && value > 0 ? "(" : ""}{Math.abs(value).toLocaleString()} ر.س{isExpense && value > 0 ? ")" : ""}</span>
    </div>
  );
}

function Divider({ thick }) {
  return <div className={`my-1 ${thick ? "border-t-2 border-white/20" : "border-t border-white/10"}`} />;
}

export default function ProfitLoss() {
  const { language } = useLanguage();
  return (
    <PlanGuard requiredPlans={["advanced", "smart", "golden"]} featureName={language === "ar" ? "قائمة الأرباح والخسائر" : "Profit & Loss"}>
      <ProfitLossContent />
    </PlanGuard>
  );
}