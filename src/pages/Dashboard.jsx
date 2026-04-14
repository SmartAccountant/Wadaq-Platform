import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqClient";
import {
  ShoppingCart,
  FileText,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart2,
  PieChart,
  TrendingDown,
  Plus,
  Package,
  Users,
  Receipt,
} from "lucide-react";
import ExpiringSoonQuotes from "@/components/dashboard/ExpiringSoonQuotes";
import TopSellingProducts from "@/components/dashboard/TopSellingProducts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay,
  subDays,
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  subYears,
  differenceInCalendarDays,
} from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useLanguage } from "@/components/LanguageContext";
import { cn } from "@/lib/utils";

const NAVY = "#1a3a5c";
const GOLD = "#c9a227";
const GOLD_LIGHT = "#f5d97e";

function safeParseDate(d) {
  try {
    const x = typeof d === "string" ? parseISO(d) : new Date(d);
    return Number.isNaN(x.getTime()) ? null : x;
  } catch {
    return null;
  }
}

function inRange(dateStr, start, end) {
  const d = safeParseDate(dateStr);
  if (!d) return false;
  return isWithinInterval(d, { start, end });
}

function growthPercent(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0 && c === 0) return null;
  if (p === 0) return c > 0 ? 100 : null;
  return ((c - p) / Math.abs(p)) * 100;
}

function sumPaidSalesInRange(invoices, start, end) {
  return invoices
    .filter((i) => i.status === "paid" && inRange(i.date, start, end))
    .reduce((s, i) => s + (i.total || 0), 0);
}

function sumTaxPaidInRange(invoices, start, end) {
  return invoices
    .filter((i) => i.status === "paid" && inRange(i.date, start, end))
    .reduce((s, i) => s + (i.tax_amount || 0), 0);
}

function sumExpensesInRange(expenses, start, end) {
  return expenses
    .filter((e) => e.date && inRange(e.date, start, end))
    .reduce((s, e) => s + (e.amount || 0), 0);
}

function productCostForPaidInvoicesInRange(invoices, products, start, end) {
  return invoices
    .filter((i) => i.status === "paid" && i.items && inRange(i.date, start, end))
    .reduce((s, inv) => {
      return (
        s +
        inv.items.reduce((itemS, item) => {
          const p = products.find((x) => x.id === item.product_id || x.name === item.product_name);
          return itemS + ((p?.cost_price || 0) * (item.quantity || 0));
        }, 0)
      );
    }, 0);
}

function unpaidInRange(invoices, start, end) {
  return invoices.filter(
    (i) => ["sent", "draft", "overdue"].includes(i.status) && inRange(i.date, start, end)
  );
}

export default function Dashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [period, setPeriod] = useState("monthly");

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const u = await Wadaq.auth.me();
      return Wadaq.entities.Invoice.filter({ created_by: u.email }, "-created_date", 500);
    },
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const u = await Wadaq.auth.me();
      return Wadaq.entities.Product.filter({ created_by: u.email });
    },
  });

  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const u = await Wadaq.auth.me();
      return Wadaq.entities.Expense.filter({ created_by: u.email });
    },
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => Wadaq.auth.me(),
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const u = await Wadaq.auth.me();
      return Wadaq.entities.Quotation.filter({ created_by: u.email }, "-created_date");
    },
  });

  const isLoading = loadingInvoices || loadingProducts || loadingExpenses;

  const now = new Date();

  const ranges = useMemo(() => {
    const anchor = new Date();
    let curStart;
    let curEnd;
    let prevStart;
    let prevEnd;
    if (period === "daily") {
      curStart = startOfDay(anchor);
      curEnd = endOfDay(anchor);
      prevStart = startOfDay(subDays(anchor, 1));
      prevEnd = endOfDay(subDays(anchor, 1));
    } else if (period === "monthly") {
      curStart = startOfMonth(anchor);
      curEnd = endOfMonth(anchor);
      prevStart = startOfMonth(subMonths(anchor, 1));
      prevEnd = endOfMonth(subMonths(anchor, 1));
    } else {
      curStart = startOfYear(anchor);
      curEnd = endOfYear(anchor);
      prevStart = startOfYear(subYears(anchor, 1));
      prevEnd = endOfYear(subYears(anchor, 1));
    }
    return { curStart, curEnd, prevStart, prevEnd };
  }, [period]);

  const metrics = useMemo(() => {
    const { curStart, curEnd, prevStart, prevEnd } = ranges;

    const salesCur = sumPaidSalesInRange(invoices, curStart, curEnd);
    const salesPrev = sumPaidSalesInRange(invoices, prevStart, prevEnd);

    const taxCur = sumTaxPaidInRange(invoices, curStart, curEnd);
    const taxPrev = sumTaxPaidInRange(invoices, prevStart, prevEnd);

    const expCur = sumExpensesInRange(expenses, curStart, curEnd);
    const expPrev = sumExpensesInRange(expenses, prevStart, prevEnd);

    const costCur = productCostForPaidInvoicesInRange(invoices, products, curStart, curEnd);
    const costPrev = productCostForPaidInvoicesInRange(invoices, products, prevStart, prevEnd);

    const netCur = salesCur - costCur - expCur - taxCur;
    const netPrev = salesPrev - costPrev - expPrev - taxPrev;

    const unpaidListCur = unpaidInRange(invoices, curStart, curEnd);
    const unpaidAmtCur = unpaidListCur.reduce((s, i) => s + (i.total || 0), 0);
    const unpaidListPrev = unpaidInRange(invoices, prevStart, prevEnd);
    const unpaidAmtPrev = unpaidListPrev.reduce((s, i) => s + (i.total || 0), 0);

    const paidCountCur = invoices.filter((i) => i.status === "paid" && inRange(i.date, curStart, curEnd)).length;
    const paidCountPrev = invoices.filter((i) => i.status === "paid" && inRange(i.date, prevStart, prevEnd)).length;

    const avgCur = paidCountCur > 0 ? salesCur / paidCountCur : 0;
    const avgPrev = paidCountPrev > 0 ? salesPrev / paidCountPrev : 0;

    return {
      salesCur,
      salesPrev,
      taxCur,
      taxPrev,
      expCur,
      expPrev,
      netCur,
      netPrev,
      unpaidAmtCur,
      unpaidAmtPrev,
      unpaidCountCur: unpaidListCur.length,
      paidCountCur,
      paidCountPrev,
      avgCur,
      avgPrev,
      growth: {
        net: growthPercent(netCur, netPrev),
        sales: growthPercent(salesCur, salesPrev),
        tax: growthPercent(taxCur, taxPrev),
        expenses: growthPercent(expCur, expPrev),
        unpaid: growthPercent(unpaidAmtCur, unpaidAmtPrev),
        avgTicket: growthPercent(avgCur, avgPrev),
      },
    };
  }, [ranges, invoices, expenses, products]);

  const expenseByCategory = useMemo(() => {
    const { curStart, curEnd } = ranges;
    const map = {};
    expenses.forEach((e) => {
      if (!e.date || !inRange(e.date, curStart, curEnd)) return;
      const cat = e.category || (isAr ? "أخرى" : "Other");
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [expenses, ranges, isAr]);

  const chartSeries = useMemo(() => {
    const anchor = new Date();
    const salesKey = isAr ? "المبيعات" : "Sales";
    const expKey = isAr ? "المصروفات" : "Expenses";

    if (period === "daily") {
      const days = eachDayOfInterval({ start: subDays(anchor, 6), end: anchor });
      return days.map((d) => {
        const start = startOfDay(d);
        const end = endOfDay(d);
        const sales = sumPaidSalesInRange(invoices, start, end);
        const exp = sumExpensesInRange(expenses, start, end);
        return {
          label: format(d, "d MMM", { locale: ar }),
          [salesKey]: Math.round(sales),
          [expKey]: Math.round(exp),
        };
      });
    }

    if (period === "monthly") {
      return Array.from({ length: 6 }, (_, idx) => {
        const d = subMonths(anchor, 5 - idx);
        const start = startOfMonth(d);
        const end = endOfMonth(d);
        const sales = sumPaidSalesInRange(invoices, start, end);
        const exp = sumExpensesInRange(expenses, start, end);
        return {
          label: format(d, "MMM", { locale: ar }),
          [salesKey]: Math.round(sales),
          [expKey]: Math.round(exp),
        };
      });
    }

    return Array.from({ length: 5 }, (_, idx) => {
      const d = subYears(anchor, 4 - idx);
      const start = startOfYear(d);
      const end = endOfYear(d);
      const sales = sumPaidSalesInRange(invoices, start, end);
      const exp = sumExpensesInRange(expenses, start, end);
      return {
        label: format(d, "yyyy", { locale: ar }),
        [salesKey]: Math.round(sales),
        [expKey]: Math.round(exp),
      };
    });
  }, [period, invoices, expenses, isAr]);

  const invoicesForPeriod = useMemo(() => {
    const { curStart, curEnd } = ranges;
    return invoices.filter((i) => i.date && inRange(i.date, curStart, curEnd));
  }, [invoices, ranges]);

  const recentInvoices = useMemo(() => {
    return [...invoicesForPeriod]
      .sort((a, b) => {
        const da = safeParseDate(a.date)?.getTime() ?? 0;
        const db = safeParseDate(b.date)?.getTime() ?? 0;
        return db - da;
      })
      .slice(0, 5);
  }, [invoicesForPeriod]);

  const PIE_COLORS = [NAVY, GOLD, "#2a5298", "#e8b84b", "#3d6fa8", "#d4941f"];

  const trialEndDate = user?.trial_end_date ? new Date(user.trial_end_date) : null;
  const daysRemaining = trialEndDate ? Math.ceil((trialEndDate - new Date()) / 86400000) : 0;
  const isTrialActive = user?.subscription_status === "trial";
  const zatcaEnabled = user?.settings?.zatca_enabled !== false;

  const periodLabels = {
    daily: { ar: "يومي", en: "Daily" },
    monthly: { ar: "شهري", en: "Monthly" },
    yearly: { ar: "سنوي", en: "Yearly" },
  };

  const compareHint = isAr ? "مقارنة بالفترة السابقة" : "vs previous period";

  const chartTitle =
    period === "daily"
      ? isAr
        ? "المبيعات مقابل المصروفات — آخر 7 أيام"
        : "Sales vs Expenses — Last 7 Days"
      : period === "monthly"
        ? isAr
          ? "المبيعات مقابل المصروفات — آخر 6 أشهر"
          : "Sales vs Expenses — Last 6 Months"
        : isAr
          ? "المبيعات مقابل المصروفات — آخر 5 سنوات"
          : "Sales vs Expenses — Last 5 Years";

  const subscriptionRenewal = useMemo(() => {
    if (!user || user.role === "admin" || user.subscription_status === "unlimited") return null;
    const raw =
      user.subscription_status === "active"
        ? user.subscription_end_date
        : user.trial_ends_at || user.trial_end_date;
    if (!raw) return null;
    const end = safeParseDate(raw);
    if (!end) return null;
    const days = differenceInCalendarDays(end, new Date());
    if (days < 0) return null;
    return {
      days,
      isTrial: user.subscription_status === "trial",
    };
  }, [user]);

  const statTitles = {
    net: isAr ? "صافي الربح" : "Net Profit",
    sales: isAr ? (period === "daily" ? "مبيعات اليوم" : period === "monthly" ? "مبيعات الشهر" : "مبيعات السنة") : period === "daily" ? "Today's Sales" : period === "monthly" ? "Month Sales" : "Year Sales",
    tax: isAr ? (period === "daily" ? "ضريبة اليوم" : period === "monthly" ? "ضريبة الشهر" : "ضريبة السنة") : period === "daily" ? "Today's VAT" : period === "monthly" ? "Month VAT" : "Year VAT",
    avgTicket: isAr ? "متوسط قيمة الفاتورة" : "Avg. invoice value",
    totalExp: isAr ? "المصروفات (الفترة)" : "Period Expenses",
    unpaid: isAr ? "فواتير معلقة (الفترة)" : "Unpaid (period)",
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56 mb-2" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {subscriptionRenewal && (
        <div
          className="rounded-xl border-2 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
          style={{
            borderColor: GOLD,
            background: "linear-gradient(105deg, rgba(26,58,92,0.07), rgba(201,162,39,0.14))",
          }}
        >
          <p className="text-sm font-semibold text-slate-800">
            {isAr ? (
              <>
                متبقي <strong className="text-[#1a3a5c]">{subscriptionRenewal.days}</strong> يوماً على{" "}
                {subscriptionRenewal.isTrial ? "انتهاء التجربة المجانية" : "انتهاء الاشتراك"}.
              </>
            ) : (
              <>
                <strong>{subscriptionRenewal.days}</strong> days left until{" "}
                {subscriptionRenewal.isTrial ? "trial ends" : "subscription ends"}.
              </>
            )}
          </p>
          <Button
            asChild
            size="sm"
            className="font-bold shrink-0 text-white border-0"
            style={{ background: NAVY, borderBottom: `2px solid ${GOLD}` }}
          >
            <Link to={createPageUrl("Pricing")}>{isAr ? "تجديد الآن" : "Renew now"}</Link>
          </Button>
        </div>
      )}

      {/* Header + quick add + period */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-black" style={{ color: NAVY, fontFamily: "Cairo, sans-serif" }}>
            {isAr ? "لوحة التحكم" : "Dashboard"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{isAr ? "نظرة عامة على أعمالك" : "Your business overview"}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{isAr ? "الفترة:" : "Period:"}</span>
            {(["daily", "monthly", "yearly"]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                  period === p
                    ? "text-white shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                )}
                style={
                  period === p
                    ? { background: NAVY, borderColor: NAVY }
                    : {}
                }
              >
                {periodLabels[p][isAr ? "ar" : "en"]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="rounded-xl gap-2 font-bold shadow-md"
                style={{ background: `linear-gradient(135deg, ${NAVY}, #2a5298)` }}
              >
                <Plus className="w-4 h-4" />
                {isAr ? "إضافة سريعة" : "Quick add"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              <DropdownMenuItem asChild>
                <Link to={`${createPageUrl("Invoices")}?action=new`} className="flex items-center gap-2 cursor-pointer">
                  <Receipt className="w-4 h-4" />
                  {isAr ? "فاتورة جديدة" : "New invoice"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Customers")} className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  {isAr ? "عميل جديد" : "New customer"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Products")} className="flex items-center gap-2 cursor-pointer">
                  <Package className="w-4 h-4" />
                  {isAr ? "منتج جديد" : "New product"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Expenses")} className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="w-4 h-4" />
                  {isAr ? "مصروف جديد" : "New expense"}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div
            className="text-sm font-medium px-4 py-2 rounded-xl border"
            style={{ color: NAVY, borderColor: GOLD, background: "rgba(201,162,39,0.08)" }}
          >
            {format(now, "d MMMM yyyy", { locale: ar })}
          </div>
        </div>
      </div>

      {isTrialActive && daysRemaining > 0 && (
        <div
          className="rounded-2xl p-4 flex items-center justify-between gap-4"
          style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2a5298 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,162,39,0.2)" }}>
              <Clock className="w-5 h-5" style={{ color: GOLD_LIGHT }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{isAr ? "الفترة التجريبية" : "Trial Period"}</p>
              <p className="text-white/70 text-xs">
                {isAr ? `متبقي ${daysRemaining} أيام` : `${daysRemaining} days remaining`}
              </p>
            </div>
          </div>
          <Link to={createPageUrl("Subscription")}>
            <Button className="text-sm font-bold rounded-xl px-5" style={{ background: GOLD, color: NAVY }}>
              {isAr ? "اشترك الآن" : "Subscribe Now"}
            </Button>
          </Link>
        </div>
      )}

      <ExpiringSoonQuotes quotations={quotations} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title={statTitles.net}
          value={metrics.netCur.toLocaleString()}
          currency={isAr ? "ر.س" : "SAR"}
          badge={periodLabels[period][isAr ? "ar" : "en"]}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          iconBg={NAVY}
          positive={metrics.netCur >= 0}
          growthPct={metrics.growth.net}
          compareHint={compareHint}
        />
        <StatCard
          title={statTitles.sales}
          value={metrics.salesCur.toLocaleString()}
          currency={isAr ? "ر.س" : "SAR"}
          badge={
            period === "daily"
              ? format(now, "d MMM yyyy", { locale: ar })
              : period === "yearly"
                ? format(now, "yyyy", { locale: ar })
                : format(now, "MMM yyyy", { locale: ar })
          }
          icon={<TrendingDown className="w-5 h-5 text-white" />}
          iconBg="#2a7a4a"
          growthPct={metrics.growth.sales}
          compareHint={compareHint}
        />
        <StatCard
          title={statTitles.tax}
          value={metrics.taxCur.toLocaleString()}
          currency={isAr ? "ر.س" : "SAR"}
          badge="VAT"
          icon={<FileText className="w-5 h-5 text-white" />}
          iconBg={GOLD}
          growthPct={metrics.growth.tax}
          compareHint={compareHint}
        />
        <StatCard
          title={statTitles.avgTicket}
          value={(metrics.avgCur || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          currency={isAr ? "ر.س" : "SAR"}
          badge={`${metrics.paidCountCur} ${isAr ? "فاتورة" : "inv"}`}
          icon={<ShoppingCart className="w-5 h-5 text-white" />}
          iconBg="#1a6fa8"
          growthPct={metrics.growth.avgTicket}
          compareHint={compareHint}
        />
        <StatCard
          title={statTitles.totalExp}
          value={metrics.expCur.toLocaleString()}
          currency={isAr ? "ر.س" : "SAR"}
          badge={expenseByCategory.length ? `${expenseByCategory.length} ${isAr ? "تصنيف" : "cat"}` : "—"}
          icon={<Wallet className="w-5 h-5 text-white" />}
          iconBg="#c0392b"
          growthPct={metrics.growth.expenses}
          compareHint={compareHint}
          invertGrowth
        />
        <StatCard
          title={statTitles.unpaid}
          value={metrics.unpaidAmtCur.toLocaleString()}
          currency={isAr ? "ر.س" : "SAR"}
          badge={`${metrics.unpaidCountCur} ${isAr ? "فاتورة" : "inv"}`}
          icon={<ArrowUpRight className="w-5 h-5 text-white" />}
          iconBg="#7b3fbf"
          growthPct={metrics.growth.unpaid}
          compareHint={compareHint}
          invertGrowth
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: NAVY }}>
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-base" style={{ color: NAVY }}>
              {chartTitle}
            </h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartSeries} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${GOLD}`, fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey={isAr ? "المبيعات" : "Sales"}
                  fill={NAVY}
                  radius={[6, 6, 0, 0]}
                  name={isAr ? "المبيعات" : "Sales"}
                />
                <Bar
                  dataKey={isAr ? "المصروفات" : "Expenses"}
                  fill={GOLD}
                  radius={[6, 6, 0, 0]}
                  name={isAr ? "المصروفات" : "Expenses"}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GOLD }}>
              <PieChart className="w-4 h-4" style={{ color: NAVY }} />
            </div>
            <h3 className="font-bold text-base" style={{ color: NAVY }}>
              {isAr ? `توزيع المصروفات (${periodLabels[period].ar})` : `Expenses (${periodLabels[period].en})`}
            </h3>
          </div>
          <div className="p-4">
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RPieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                </RPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
                <PieChart className="w-10 h-10 mb-2 opacity-30" />
                {isAr ? "لا توجد مصروفات في الفترة" : "No expenses in period"}
              </div>
            )}

            <div
              className="mt-3 rounded-xl p-3 flex items-center gap-3"
              style={{ background: zatcaEnabled ? "rgba(22,163,74,0.08)" : "rgba(239,68,68,0.08)" }}
            >
              {zatcaEnabled ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold" style={{ color: zatcaEnabled ? "#16a34a" : "#ef4444" }}>
                  ZATCA {isAr ? "الامتثال الضريبي" : "Compliance"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {zatcaEnabled ? (isAr ? "مفعّل ومتوافق" : "Active") : (isAr ? "غير مفعّل" : "Not enabled")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: NAVY }}>
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-base" style={{ color: NAVY }}>
              {isAr ? "أكثر المنتجات مبيعاً (الفترة)" : "Top products (period)"}
            </h3>
          </div>
          <div className="p-2">
            <TopSellingProducts compact invoices={invoicesForPeriod.filter((i) => i.status === "paid")} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GOLD }}>
                <FileText className="w-4 h-4" style={{ color: NAVY }} />
              </div>
              <h3 className="font-bold text-base" style={{ color: NAVY }}>
                {isAr ? "آخر الفواتير (الفترة)" : "Recent invoices (period)"}
              </h3>
            </div>
            <Link to={createPageUrl("Invoices")}>
              <span className="text-xs font-semibold hover:underline" style={{ color: GOLD }}>
                {isAr ? "عرض الكل" : "View all"}
              </span>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">{isAr ? "لا توجد فواتير في الفترة" : "No invoices in period"}</div>
            ) : (
              recentInvoices.map((invoice) => {
                const statusStyles = {
                  draft: "bg-slate-100 text-slate-600",
                  sent: "bg-blue-50 text-blue-700",
                  paid: "bg-green-50 text-green-700",
                  overdue: "bg-red-50 text-red-700",
                  cancelled: "bg-slate-100 text-slate-500",
                };
                const statusLabels = {
                  draft: isAr ? "مسودة" : "Draft",
                  sent: isAr ? "مرسلة" : "Sent",
                  paid: isAr ? "مدفوعة" : "Paid",
                  overdue: isAr ? "متأخرة" : "Overdue",
                  cancelled: isAr ? "ملغية" : "Cancelled",
                };
                return (
                  <div key={invoice.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-slate-800">{invoice.customer_name}</p>
                      <p className="text-xs text-slate-400">{invoice.invoice_number}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusStyles[invoice.status] || "bg-slate-100 text-slate-600"}`}
                      >
                        {statusLabels[invoice.status] || invoice.status}
                      </span>
                      <p className="text-sm font-black" style={{ color: NAVY }}>
                        {invoice.total?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, currency, badge, icon, iconBg, positive, growthPct, compareHint, invertGrowth }) {
  const g = growthPct ?? 0;
  const good = invertGrowth ? g <= 0 : g >= 0;
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          {icon}
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(26,58,92,0.07)", color: "#1a3a5c" }}>
          {badge}
        </span>
      </div>
      <p className="text-xs text-slate-500 font-medium mb-1">{title}</p>
      <p className={`text-2xl font-black tracking-tight ${positive === false ? "text-red-600" : ""}`} style={positive !== false ? { color: "#1a3a5c" } : {}}>
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{currency}</p>
      {growthPct != null && Number.isFinite(growthPct) && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
          {good ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
          )}
          <span className={`text-xs font-bold ${good ? "text-emerald-700" : "text-rose-700"}`}>
            {growthPct >= 0 ? "+" : ""}
            {growthPct.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400">{compareHint}</span>
        </div>
      )}
    </div>
  );
}
