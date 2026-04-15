import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { 
        LayoutDashboard, 
        FileText, 
        Users, 
        Package, 
        Wallet,
        BarChart3,
        Menu,
        X,
        ChevronDown,
        ChevronUp,
        LogOut,
        Settings,
        Crown,
        TrendingUp,
        CreditCard,
        HeartHandshake,
        ShoppingCart,
        Truck,
        UserCheck,
        Receipt,
        Calculator,
        BookOpen,
        FileSignature,
        Tags,
        Shield,
        Plus,
      } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Wadaq } from "@/api/WadaqCore";
import { useAuth } from "@/context/AuthContext";
// تم إزالة TrialCheck و AIChatbot لأنهما يسببان تعليق النظام
import { useLanguage } from "@/components/LanguageContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import KeyboardShortcuts, { KeyboardShortcutsHelp } from "@/components/KeyboardShortcuts";

function LayoutContent({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = React.useState({});
  const { t, toggleLanguage, language, isRTL } = useLanguage();

  const ar = language === 'ar';

  const navSections = React.useMemo(() => {
  const core = [
    {
      key: 'main',
      label: ar ? 'الرئيسية' : 'Main',
      icon: LayoutDashboard,
      items: [
        { name: t('dashboard'), page: "Dashboard", icon: LayoutDashboard },
        { name: ar ? 'الأسعار' : 'Pricing', page: "Pricing", icon: Tags },
        { name: ar ? '💳 الكاشير' : '💳 Cashier', page: "CashierSelection", icon: CreditCard },
      ]
    },
    {
      key: 'sales',
      label: ar ? 'المبيعات' : 'Sales',
      icon: FileText,
      items: [
        { name: t('invoices'), page: "Invoices", icon: FileText },
        { name: ar ? 'عروض الأسعار' : 'Quotations', page: "Quotations", icon: Receipt },
        { name: ar ? 'إشعارات دائنة' : 'Credit Notes', page: "CreditNotes", icon: FileText },
      ]
    },
    {
      key: 'purchasing',
      label: ar ? 'المشتريات' : 'Purchasing',
      icon: ShoppingCart,
      items: [
        { name: ar ? 'الموردون' : 'Suppliers', page: "Suppliers", icon: Truck },
        { name: ar ? 'أوامر الشراء' : 'Purchase Orders', page: "PurchaseOrders", icon: ShoppingCart },
      ]
    },
    {
      key: 'inventory',
      label: ar ? 'العملاء والمخزون' : 'Clients & Inventory',
      icon: Package,
      items: [
        { name: t('customers'), page: "Customers", icon: Users },
        { name: t('products'), page: "Products", icon: Package },
        { name: ar ? 'المخزون' : 'Inventory', page: "Inventory", icon: Package },
      ]
    },
    {
      key: 'accounting',
      label: ar ? 'المحاسبة' : 'Accounting',
      icon: Wallet,
      items: [
        { name: t('expenses'), page: "Expenses", icon: Wallet },
        { name: ar ? 'سندات القبض والصرف' : 'Vouchers', page: "Vouchers", icon: Wallet },
        { name: ar ? 'الذمم المالية' : 'Receivables', page: "Receivables", icon: TrendingUp },
        { name: ar ? 'الأصول الثابتة' : 'Fixed Assets', page: "FixedAssets", icon: Calculator },
        { name: ar ? 'دفتر الأستاذ العام' : 'General Ledger', page: "GeneralLedger", icon: BarChart3 },
        { name: ar ? 'إدارة العقود' : 'Contracts', page: "Contracts", icon: FileSignature },
      ]
    },
    {
      key: 'hr',
      label: ar ? 'الموارد البشرية' : 'HR',
      icon: UserCheck,
      items: [
        { name: ar ? 'الموظفون والرواتب' : 'Employees & Payroll', page: "HR", icon: UserCheck },
      ]
    },
    {
      key: 'reports',
      label: ar ? 'التقارير والضرائب' : 'Reports & Tax',
      icon: BarChart3,
      items: [
        { name: t('reports'), page: "Reports", icon: BarChart3 },
        { name: ar ? 'الأرباح والخسائر' : 'Profit & Loss', page: "ProfitLoss", icon: TrendingUp },
        { name: ar ? 'الإقرار الضريبي' : 'VAT Return', page: "VATReturn", icon: Calculator },
      ]
    },
    {
      key: 'other',
      label: ar ? 'أخرى' : 'Other',
      icon: HeartHandshake,
      items: [
        { name: ar ? 'من نحن' : 'About Us', page: "About", icon: HeartHandshake },
      ]
    },
  ];
  if (user?.role === "admin") {
    const insertAt = Math.max(0, core.length - 1);
    core.splice(insertAt, 0, {
      key: "adminZone",
      label: ar ? "الإدارة" : "Administration",
      icon: Shield,
      items: [
        {
          name: ar ? "إعدادات المسؤول" : "Admin settings",
          page: "admin-settings",
          to: "/admin/settings",
        },
        {
          name: ar ? "إعدادات الدفع" : "Payment settings",
          page: "admin-payment-settings",
          to: "/admin/payment-settings",
        },
        {
          name: ar ? "سجلات الدفع" : "Payment logs",
          page: "admin-payment-logs",
          to: "/admin/payment-logs",
        },
      ],
    });
  }
  return core;
  }, [ar, t, user?.role]);

  React.useEffect(() => {
    document.title = 'Wadq - برنامج ودق المحاسبي';
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPageName]);

  React.useEffect(() => {
    navSections.forEach((sec) => {
      if (sec.items.some((item) => item.page === currentPageName)) {
        setOpenSections((prev) => ({ ...prev, [sec.key]: true }));
      }
    });
  }, [currentPageName, navSections]);

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    Wadaq.auth.logout();
    refresh();
    navigate("/login");
  };

  const quickAddInvoices = `${createPageUrl("Invoices")}?new=1`;

  const QuickAddMenu = ({ className }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 font-bold border-amber-200/50 bg-white/95 text-[#1a3a5c] hover:bg-amber-50 shadow-sm",
            className
          )}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {ar ? "إضافة سريعة +" : "Quick add +"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]" dir={isRTL ? "rtl" : "ltr"}>
        <DropdownMenuItem asChild>
          <Link to={quickAddInvoices} className="cursor-pointer">
            <FileText className="h-4 w-4 ml-2 opacity-70" />
            {ar ? "فاتورة جديدة" : "New invoice"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={createPageUrl("Customers")} className="cursor-pointer">
            <Users className="h-4 w-4 ml-2 opacity-70" />
            {ar ? "عميل" : "Customer"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={createPageUrl("Products")} className="cursor-pointer">
            <Package className="h-4 w-4 ml-2 opacity-70" />
            {ar ? "منتج" : "Product"}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;600;700&family=Cairo:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Tajawal', 'Cairo', sans-serif; background: #eef1f6; }
        .page-transition { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Mobile Header */}
      <div className={cn("lg:hidden fixed top-0 z-50 px-4 py-3", isRTL ? "right-0 left-0" : "left-0 right-0")}
      style={{ background: '#1a3a5c', borderBottom: '2px solid #c9a227' }}>
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-11 w-11">
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1 flex justify-center items-center gap-2">
            <span className="font-black text-lg" style={{ color: '#fff' }}>ودق</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <QuickAddMenu className="h-9 px-2 text-xs border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" />
            <NotificationBell />
          </div>
        </div>
      </div>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 z-50 h-full w-72 transform transition-all duration-300 ease-in-out lg:translate-x-0 shadow-2xl",
        isRTL ? "right-0" : "left-0",
        sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
      style={{ background: '#1a3a5c', borderRight: isRTL ? '3px solid #c9a227' : 'none', borderLeft: isRTL ? 'none' : '3px solid #c9a227' }}>
        <div className="flex flex-col h-full overflow-y-auto">
          <div
            className="px-4 py-4 flex items-start gap-3 justify-between border-b"
            style={{ borderColor: "rgba(201,162,39,0.3)" }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-white font-black text-xl leading-tight">برنامج ودق</p>
              <p style={{ color: "#c9a227" }} className="text-[11px] tracking-wide mt-0.5">
                WADAQ SYSTEM
              </p>
            </div>
            {user ? (
              <div
                className="shrink-0 max-w-[55%] rounded-lg px-2 py-1.5 border text-left"
                style={{
                  borderColor: "rgba(201,162,39,0.22)",
                  background: "rgba(0,0,0,0.15)",
                }}
                dir="ltr"
                title={[user?.name, user?.email].filter(Boolean).join(" · ") || String(user?.id ?? "")}
              >
                <p className="text-[10px] font-medium text-slate-200 leading-snug truncate">
                  {user?.name || user?.email || (ar ? "حساب مسجّل" : "Signed in")}
                </p>
                {user?.name && user?.email ? (
                  <p className="text-[9px] text-slate-500 leading-snug truncate mt-0.5">
                    {user.email}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <nav className="flex-1 p-3 space-y-1 min-h-0">
            {navSections.map((section) => (
                <div key={section.key}>
                    <button onClick={() => toggleSection(section.key)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5">
                        <section.icon className="w-5 h-5" />
                        <span className="font-bold flex-1 text-right">{section.label}</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    {openSections[section.key] && (
                        <div className="pr-4 space-y-1">
                            {section.items.map(item => (
                                <Link key={item.page + (item.to || "")} to={item.to || createPageUrl(item.page)} className="block px-4 py-2 text-sm text-slate-400 hover:text-white">
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ))}
          </nav>

          <div className="p-4 border-t mt-auto space-y-1" style={{ borderColor: "rgba(201,162,39,0.25)" }}>
            <Link
              to={createPageUrl("Settings")}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                currentPageName === "Settings"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Settings className="w-4 h-4 shrink-0 opacity-80" />
              <span className="font-medium">{ar ? "الإعدادات" : "Settings"}</span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start gap-2 text-amber-100/90 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              {ar ? "تسجيل الخروج" : "Logout"}
            </Button>
          </div>
        </div>
      </aside>

      <main className={cn("min-h-screen pt-16 lg:pt-0", isRTL ? "lg:mr-72" : "lg:ml-72")}>
        <div
          className="hidden lg:flex items-center justify-between gap-4 px-8 py-3 border-b bg-white/90 backdrop-blur-sm sticky top-0 z-30 shadow-sm"
          style={{ borderColor: "rgba(26,58,92,0.12)" }}
        >
          <span className="text-sm font-semibold text-slate-600">
            {ar ? "لوحة التحكم" : "Dashboard"}
          </span>
          <QuickAddMenu />
        </div>
        <div className="p-6 lg:p-8 page-transition">
          {children}
        </div>
      </main>
      
      <PWAInstallPrompt />
      <KeyboardShortcuts />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return <LayoutContent children={children} currentPageName={currentPageName} />;
}