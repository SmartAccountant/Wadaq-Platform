import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Receipt, Users, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import ExportButtons from "@/components/reports/ExportButtons";
import { useLanguage } from "@/components/LanguageContext";
import PlanGuard from "@/components/auth/PlanGuard";
import InvoiceStatusReport from "@/components/reports/InvoiceStatusReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function ReportsContent() {
  const { language, t } = useLanguage();
  const [period, setPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [compareMode, setCompareMode] = useState(false);
  const [compareStartDate, setCompareStartDate] = useState("");
  const [compareEndDate, setCompareEndDate] = useState("");

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Invoice.filter({ created_by: currentUser.email });
    },
  });

  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Expense.filter({ created_by: currentUser.email });
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Customer.filter({ created_by: currentUser.email });
    },
  });

  // Build a unified customer list: registered customers + unregistered customers from invoices
  const allCustomerOptions = React.useMemo(() => {
    const registeredIds = new Set(customers.map(c => c.id));
    const unregisteredNames = new Set();
    invoices.forEach(inv => {
      if (!inv.customer_id && inv.customer_name) {
        unregisteredNames.add(inv.customer_name);
      }
    });
    const registered = customers.map(c => ({ id: c.id, name: language === 'ar' ? c.name : (c.name_en || c.name), isRegistered: true }));
    const unregistered = [...unregisteredNames].map(name => ({ id: name, name, isRegistered: false }));
    return [...registered, ...unregistered];
  }, [customers, invoices, language]);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Product.filter({ created_by: currentUser.email });
    },
  });

  const isLoading = loadingInvoices || loadingExpenses;

  // Filter by period
  const getDateRange = () => {
    const now = new Date();
    
    // Custom date range
    if (period === "custom" && customStartDate && customEndDate) {
      return { 
        start: parseISO(customStartDate), 
        end: parseISO(customEndDate) 
      };
    }
    
    // Week
    if (period === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { start: weekAgo, end: now };
    }
    
    // Day
    if (period === "day") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      return { start: today, end: endOfDay };
    }
    
    switch (period) {
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "quarter":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "year":
        return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const dateRange = getDateRange();

  const filteredInvoices = invoices.filter(inv => {
    if (!inv.date) return false;
    const invDate = parseISO(inv.date);
    
    // Date filter
    if (!isWithinInterval(invDate, dateRange)) return false;
    
    // Customer filter - match by id if registered, or by name if unregistered
    if (selectedCustomer !== "all") {
      const matchById = inv.customer_id && inv.customer_id === selectedCustomer;
      const matchByName = !inv.customer_id && inv.customer_name === selectedCustomer;
      if (!matchById && !matchByName) return false;
    }
    
    // Status filter
    if (selectedStatus !== "all" && inv.status !== selectedStatus) return false;
    
    return true;
  });
  
  // Filter invoice items by product category
  const getFilteredInvoicesByProduct = () => {
    if (selectedProduct === "all") return filteredInvoices;
    
    return filteredInvoices.filter(inv => 
      inv.items?.some(item => item.product_id === selectedProduct)
    );
  };
  
  const productFilteredInvoices = getFilteredInvoicesByProduct();

  // Comparison period data
  const getComparisonDateRange = () => {
    if (!compareMode || !compareStartDate || !compareEndDate) return null;
    return {
      start: parseISO(compareStartDate),
      end: parseISO(compareEndDate)
    };
  };

  const comparisonDateRange = getComparisonDateRange();

  const comparisonInvoices = comparisonDateRange ? invoices.filter(inv => {
    if (!inv.date) return false;
    const invDate = parseISO(inv.date);
    
    if (!isWithinInterval(invDate, comparisonDateRange)) return false;
    if (selectedCustomer !== "all" && inv.customer_id !== selectedCustomer) return false;
    if (selectedStatus !== "all" && inv.status !== selectedStatus) return false;
    
    return true;
  }) : [];

  const comparisonExpenses = comparisonDateRange ? expenses.filter(exp => {
    if (!exp.date) return false;
    const expDate = parseISO(exp.date);
    
    if (!isWithinInterval(expDate, comparisonDateRange)) return false;
    if (selectedCategory !== "all" && exp.category !== selectedCategory) return false;
    
    return true;
  }) : [];

  const filteredExpenses = expenses.filter(exp => {
    if (!exp.date) return false;
    const expDate = parseISO(exp.date);
    
    // Date filter
    if (!isWithinInterval(expDate, dateRange)) return false;
    
    // Category filter
    if (selectedCategory !== "all" && exp.category !== selectedCategory) return false;
    
    return true;
  });

  // Calculate stats (use product-filtered invoices for sales calculations)
  const totalSales = productFilteredInvoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  const totalExpensesAmount = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  
  const netProfit = totalSales - totalExpensesAmount;

  const pendingAmount = productFilteredInvoices
    .filter(inv => inv.status === "sent" || inv.status === "draft")
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Comparison stats
  const comparisonTotalSales = comparisonInvoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  const comparisonTotalExpenses = comparisonExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const comparisonNetProfit = comparisonTotalSales - comparisonTotalExpenses;

  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Calculate product sales breakdown
  const productSalesData = React.useMemo(() => {
    const productSales = {};
    
    productFilteredInvoices
      .filter(inv => inv.status === "paid")
      .forEach(inv => {
        inv.items?.forEach(item => {
          const productName = item.product_name || "غير محدد";
          if (!productSales[productName]) {
            productSales[productName] = { quantity: 0, revenue: 0 };
          }
          productSales[productName].quantity += item.quantity || 0;
          productSales[productName].revenue += item.total || 0;
        });
      });
    
    return Object.entries(productSales)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([name, data]) => ({ 
        name: name.length > 20 ? name.substring(0, 20) + '...' : name, 
        revenue: data.revenue,
        quantity: data.quantity
      }));
  }, [productFilteredInvoices]);

  // Expenses by category
  const expensesByCategory = filteredExpenses.reduce((acc, exp) => {
    const cat = exp.category || "other";
    acc[cat] = (acc[cat] || 0) + (exp.amount || 0);
    return acc;
  }, {});

  const categoryLabels = {
    rent: "إيجار",
    utilities: "خدمات عامة",
    salaries: "رواتب",
    supplies: "مستلزمات",
    marketing: "تسويق",
    maintenance: "صيانة",
    transportation: "نقل ومواصلات",
    other: "أخرى",
  };

  const expensesPieData = Object.entries(expensesByCategory).map(([key, value]) => ({
    name: categoryLabels[key] || key,
    value,
  }));

  // Invoice status distribution
  const statusCounts = productFilteredInvoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});

  const statusLabels = {
    draft: "مسودة",
    sent: "مرسلة",
    paid: "مدفوعة",
    overdue: "متأخرة",
    cancelled: "ملغية",
  };

  const statusPieData = Object.entries(statusCounts).map(([key, value]) => ({
    name: statusLabels[key] || key,
    value,
  }));

  // Monthly trend
  const monthlyData = React.useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthSales = invoices
        .filter(inv => {
          if (!inv.date || inv.status !== "paid") return false;
          const invDate = parseISO(inv.date);
          return isWithinInterval(invDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      const monthExpenses = expenses
        .filter(exp => {
          if (!exp.date) return false;
          const expDate = parseISO(exp.date);
          return isWithinInterval(expDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

      months.push({
        month: format(month, "MMM", { locale: language === 'ar' ? ar : undefined }),
        sales: monthSales,
        expenses: monthExpenses,
        profit: monthSales - monthExpenses,
      });
    }
    return months;
  }, [invoices, expenses]);

  // Top customers
  const topCustomers = React.useMemo(() => {
    const customerSales = {};
    productFilteredInvoices
      .filter(inv => inv.status === "paid")
      .forEach(inv => {
        const name = inv.customer_name || "غير محدد";
        customerSales[name] = (customerSales[name] || 0) + (inv.total || 0);
      });
    
    return Object.entries(customerSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ 
        name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
        value 
      }));
  }, [productFilteredInvoices]);
  
  // Daily sales trend (for day/week view)
  const dailySalesData = React.useMemo(() => {
    if (period !== "day" && period !== "week") return [];
    
    const days = [];
    const daysCount = period === "day" ? 1 : 7;
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      const daySales = invoices
        .filter(inv => {
          if (!inv.date || inv.status !== "paid") return false;
          const invDate = parseISO(inv.date);
          return isWithinInterval(invDate, { start: day, end: dayEnd });
        })
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      days.push({
        day: format(day, "EEE", { locale: language === 'ar' ? ar : undefined }),
        sales: daySales,
      });
    }
    return days;
  }, [invoices, period, language]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight">{language === 'ar' ? 'التقارير المتقدمة' : 'Advanced Reports'}</h1>
          <p className="text-gray-500 mt-2 text-sm font-light tracking-wide">{language === 'ar' ? 'تحليل مفصل لأداء الأعمال مع فلاتر متقدمة' : 'Detailed business performance analysis with advanced filters'}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="overview">
              {language === 'ar' ? 'نظرة عامة' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="invoices">
              {language === 'ar' ? 'تقرير الفواتير' : 'Invoice Report'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <InvoiceStatusReport invoices={filteredInvoices} />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
        
        {/* Advanced Filters */}
        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{language === 'ar' ? 'فلاتر مخصصة' : 'Custom Filters'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Period Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{language === 'ar' ? 'الفترة الزمنية' : 'Time Period'}</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">{language === 'ar' ? 'اليوم' : 'Today'}</SelectItem>
                    <SelectItem value="week">{language === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days'}</SelectItem>
                    <SelectItem value="month">{language === 'ar' ? 'هذا الشهر' : 'This Month'}</SelectItem>
                    <SelectItem value="quarter">{language === 'ar' ? 'آخر 3 أشهر' : 'Last Quarter'}</SelectItem>
                    <SelectItem value="year">{language === 'ar' ? 'هذه السنة' : 'This Year'}</SelectItem>
                    <SelectItem value="custom">{language === 'ar' ? 'نطاق مخصص' : 'Custom Range'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Customer Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{language === 'ar' ? 'العميل' : 'Customer'}</label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع العملاء' : 'All Customers'}</SelectItem>
                    {allCustomerOptions.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{!c.isRegistered ? (language === 'ar' ? ' (غير مسجل)' : ' (unregistered)') : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Product Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{language === 'ar' ? 'المنتج' : 'Product'}</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع المنتجات' : 'All Products'}</SelectItem>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {language === 'ar' ? product.name : (product.name_en || product.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Expense Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{language === 'ar' ? 'تصنيف المصروفات' : 'Expense Category'}</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع التصنيفات' : 'All Categories'}</SelectItem>
                    <SelectItem value="rent">{language === 'ar' ? 'إيجار' : 'Rent'}</SelectItem>
                    <SelectItem value="utilities">{language === 'ar' ? 'خدمات عامة' : 'Utilities'}</SelectItem>
                    <SelectItem value="salaries">{language === 'ar' ? 'رواتب' : 'Salaries'}</SelectItem>
                    <SelectItem value="supplies">{language === 'ar' ? 'مستلزمات' : 'Supplies'}</SelectItem>
                    <SelectItem value="marketing">{language === 'ar' ? 'تسويق' : 'Marketing'}</SelectItem>
                    <SelectItem value="maintenance">{language === 'ar' ? 'صيانة' : 'Maintenance'}</SelectItem>
                    <SelectItem value="transportation">{language === 'ar' ? 'نقل' : 'Transportation'}</SelectItem>
                    <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{language === 'ar' ? 'حالة الفاتورة' : 'Invoice Status'}</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</SelectItem>
                    <SelectItem value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
                    <SelectItem value="sent">{language === 'ar' ? 'مرسلة' : 'Sent'}</SelectItem>
                    <SelectItem value="paid">{language === 'ar' ? 'مدفوعة' : 'Paid'}</SelectItem>
                    <SelectItem value="overdue">{language === 'ar' ? 'متأخرة' : 'Overdue'}</SelectItem>
                    <SelectItem value="cancelled">{language === 'ar' ? 'ملغية' : 'Cancelled'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Date Range Comparison */}
            <div className="border-t border-blue-200 pt-4 mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Switch
                  checked={compareMode}
                  onCheckedChange={setCompareMode}
                />
                <label className="text-sm font-medium text-slate-700">
                  {language === 'ar' ? 'مقارنة مع فترة أخرى' : 'Compare with Another Period'}
                </label>
              </div>
              
              {compareMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">{language === 'ar' ? 'من تاريخ (للمقارنة)' : 'Compare Start Date'}</label>
                    <Input
                      type="date"
                      value={compareStartDate}
                      onChange={(e) => setCompareStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">{language === 'ar' ? 'إلى تاريخ (للمقارنة)' : 'Compare End Date'}</label>
                    <Input
                      type="date"
                      value={compareEndDate}
                      onChange={(e) => setCompareEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Custom Date Range */}
            {period === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{language === 'ar' ? 'من تاريخ' : 'Start Date'}</label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{language === 'ar' ? 'إلى تاريخ' : 'End Date'}</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Export Buttons */}
        <Card className="border-t-4 border-t-blue-600">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-gray-900">{language === 'ar' ? 'تصدير التقارير' : 'Export Reports'}</h3>
                <p className="text-sm text-gray-600 font-light">{language === 'ar' ? 'قم بتحميل التقارير بصيغة Excel' : 'Download reports in Excel format'}</p>
              </div>
              <ExportButtons 
                invoices={filteredInvoices} 
                expenses={filteredExpenses}
                period={period}
              />
            </div>
          </CardContent>
        </Card>

      {/* Summary Cards with Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-emerald-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-light uppercase tracking-widest">{language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}</p>
                <p className="text-2xl font-medium text-gray-900 number-luxury mt-2">{totalSales.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</p>
                {compareMode && comparisonDateRange && (
                  <div className="flex items-center gap-2 mt-2">
                    {calculateChange(totalSales, comparisonTotalSales) >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                    )}
                    <span className={`text-xs font-medium ${calculateChange(totalSales, comparisonTotalSales) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {calculateChange(totalSales, comparisonTotalSales).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">
                      {language === 'ar' ? 'مقارنة' : 'vs previous'}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <TrendingUp className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-rose-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-light uppercase tracking-widest">{language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
                <p className="text-2xl font-medium text-gray-900 number-luxury mt-2">{totalExpensesAmount.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</p>
                {compareMode && comparisonDateRange && (
                  <div className="flex items-center gap-2 mt-2">
                    {calculateChange(totalExpensesAmount, comparisonTotalExpenses) >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-rose-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                    )}
                    <span className={`text-xs font-medium ${calculateChange(totalExpensesAmount, comparisonTotalExpenses) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {Math.abs(calculateChange(totalExpensesAmount, comparisonTotalExpenses)).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">
                      {language === 'ar' ? 'مقارنة' : 'vs previous'}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <TrendingDown className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-light uppercase tracking-widest">{language === 'ar' ? 'صافي الربح' : 'Net Profit'}</p>
                <p className={`text-2xl font-medium number-luxury mt-2 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {netProfit.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                </p>
                {compareMode && comparisonDateRange && (
                  <div className="flex items-center gap-2 mt-2">
                    {calculateChange(netProfit, comparisonNetProfit) >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                    )}
                    <span className={`text-xs font-medium ${calculateChange(netProfit, comparisonNetProfit) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {calculateChange(netProfit, comparisonNetProfit).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">
                      {language === 'ar' ? 'مقارنة' : 'vs previous'}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <DollarSign className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-light uppercase tracking-widest">{language === 'ar' ? 'المستحقات' : 'Pending'}</p>
                <p className="text-2xl font-medium text-gray-900 number-luxury mt-2">{pendingAmount.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Receipt className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend - Dynamic based on period */}
        <Card className="shadow-xl">
          <CardHeader className="border-b border-gray-100 px-7 py-5">
            <CardTitle className="text-xl font-medium text-gray-900">
              {period === "day" || period === "week" 
                ? (language === 'ar' ? 'المبيعات اليومية' : 'Daily Sales')
                : (language === 'ar' ? 'الأداء الشهري' : 'Monthly Performance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                {period === "day" || period === "week" ? (
                  <BarChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ background: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [`${value.toLocaleString()} ${language === 'ar' ? 'ر.س' : 'SAR'}`]}
                    />
                    <Bar dataKey="sales" name={language === 'ar' ? 'المبيعات' : 'Sales'} fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ background: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [`${value.toLocaleString()} ${language === 'ar' ? 'ر.س' : 'SAR'}`]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sales" name={language === 'ar' ? 'المبيعات' : 'Sales'} stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="expenses" name={language === 'ar' ? 'المصروفات' : 'Expenses'} stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card className="shadow-xl">
          <CardHeader className="border-b border-gray-100 px-7 py-5">
            <CardTitle className="text-xl font-medium text-gray-900">{language === 'ar' ? 'المصروفات حسب التصنيف' : 'Expenses by Category'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {expensesPieData.length > 0 ? (
              <div className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {expensesPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} ر.س`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-500">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status */}
        <Card className="shadow-xl">
          <CardHeader className="border-b border-gray-100 px-7 py-5">
            <CardTitle className="text-xl font-medium text-gray-900">{language === 'ar' ? 'حالة الفواتير' : 'Invoice Status'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {statusPieData.length > 0 ? (
              <div className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-500">
                لا توجد فواتير
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-xl">
          <CardHeader className="border-b border-gray-100 px-7 py-5">
            <CardTitle className="text-xl font-medium text-gray-900">{language === 'ar' ? 'أفضل المنتجات' : 'Top Products'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {productSalesData.length > 0 ? (
              <div className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productSalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ background: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value, name) => {
                        if (name === 'revenue') return [`${value.toLocaleString()} ${language === 'ar' ? 'ر.س' : 'SAR'}`, language === 'ar' ? 'الإيرادات' : 'Revenue'];
                        return [`${value.toLocaleString()}`, language === 'ar' ? 'الكمية' : 'Quantity'];
                      }}
                    />
                    <Bar dataKey="revenue" name={language === 'ar' ? 'الإيرادات' : 'Revenue'} fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-500">
                {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 - Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xl">
          <CardHeader className="border-b border-gray-100 px-7 py-5">
            <CardTitle className="text-xl font-medium text-gray-900">{language === 'ar' ? 'أفضل العملاء' : 'Top Customers'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {topCustomers.length > 0 ? (
              <div className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
                    <Tooltip 
                      contentStyle={{ background: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [`${value.toLocaleString()} ${language === 'ar' ? 'ر.س' : 'SAR'}`, language === 'ar' ? 'المبيعات' : 'Sales']} 
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-500">
                {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Profit Margin Analysis */}
        <Card className="shadow-xl">
          <CardHeader className="border-b border-gray-100 px-7 py-5">
            <CardTitle className="text-xl font-medium text-gray-900">{language === 'ar' ? 'تحليل هامش الربح' : 'Profit Margin Analysis'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ background: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value.toLocaleString()} ${language === 'ar' ? 'ر.س' : 'SAR'}`]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="profit" name={language === 'ar' ? 'صافي الربح' : 'Net Profit'} stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-emerald-600">
          <CardContent className="p-5 text-center">
            <p className="text-gray-500 text-xs font-light">{language === 'ar' ? 'عدد الفواتير' : 'Invoices'}</p>
            <p className="text-3xl font-medium text-gray-900 mt-2">{productFilteredInvoices.length}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-600">
          <CardContent className="p-5 text-center">
            <p className="text-gray-500 text-xs font-light">{language === 'ar' ? 'عدد العملاء' : 'Customers'}</p>
            <p className="text-3xl font-medium text-gray-900 mt-2">{allCustomerOptions.length}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-violet-600">
          <CardContent className="p-5 text-center">
            <p className="text-gray-500 text-xs font-light">{language === 'ar' ? 'عدد المنتجات' : 'Products'}</p>
            <p className="text-3xl font-medium text-gray-900 mt-2">{products.length}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-amber-600">
          <CardContent className="p-5 text-center">
            <p className="text-gray-500 text-xs font-light">{language === 'ar' ? 'عدد المصروفات' : 'Expenses'}</p>
            <p className="text-3xl font-medium text-gray-900 mt-2">{filteredExpenses.length}</p>
          </CardContent>
        </Card>
      </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Reports() {
  const { language } = useLanguage();
  
  return (
    <PlanGuard 
      requiredPlans={['advanced', 'smart', 'golden']} 
      featureName={language === 'ar' ? 'التقارير المتقدمة' : 'Advanced Reports'}
    >
      <ReportsContent />
    </PlanGuard>
  );
}