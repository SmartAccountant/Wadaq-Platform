import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  FileText,
  Package,
  Wallet,
  CreditCard,
  ScrollText,
  Sparkles,
  KeyRound,
  BookOpen,
  Bot,
  ArrowLeft,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { SUPER_ADMIN_EMAIL } from "@/lib/superAdmin";

const linkClass =
  "flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-white p-4 text-right shadow-sm transition hover:border-[#c9a227]/60 hover:shadow-md";

export default function AdminConsole() {
  const { language } = useLanguage();
  const ar = language === "ar";

  // تحسين جلب البيانات لمنع انهيار الصفحة في حال وجود خطأ في الاتصال
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["adminConsoleStats"],
    queryFn: async () => {
      try {
        // نستخدم Promise.allSettled لضمان أنه لو فشل طلب واحد لا يتوقف البقية
        const results = await Promise.allSettled([
          Wadaq.entities.User.list(),
          Wadaq.entities.Invoice.list(),
          Wadaq.entities.Expense.list(),
          Wadaq.entities.Product.list(),
        ]);

        return {
          users: results[0].status === 'fulfilled' ? results[0].value.length : 0,
          invoices: results[1].status === 'fulfilled' ? results[1].value.length : 0,
          expenses: results[2].status === 'fulfilled' ? results[2].value.length : 0,
          products: results[3].status === 'fulfilled' ? results[3].value.length : 0,
        };
      } catch (err) {
        console.error("Admin stats fetch error:", err);
        return { users: 0, invoices: 0, expenses: 0, products: 0 };
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  const sections = [
    {
      title: ar ? "إدارة الحسابات والاشتراكات" : "Accounts & billing",
      items: [
        {
          to: "/admin/settings",
          icon: Shield,
          title: ar ? "إعدادات المسؤول" : "Admin settings",
          desc: ar ? "مستخدمون، أدوار، اشتراكات يدوية" : "Users, roles, manual subscriptions",
        },
        {
          to: "/admin/payment-settings",
          icon: CreditCard,
          title: ar ? "إعدادات الدفع (Moyasar)" : "Payment settings",
          desc: ar ? "مفاتيح بوابة الدفع" : "Gateway keys",
        },
        {
          to: "/admin/payment-logs",
          icon: ScrollText,
          title: ar ? "سجلات الدفع" : "Payment logs",
          desc: ar ? "عمليات الدفع المسجّلة" : "Recorded payment events",
        },
        {
          to: createPageUrl("PaymentAdmin"),
          icon: Wallet,
          title: ar ? "إدارة المدفوعات (واجهة)" : "Payment admin UI",
          desc: ar ? "Moyasar من لوحة التطبيق" : "Moyasar from app panel",
        },
      ],
    },
    {
      title: ar ? "الاستخدام والتقنية" : "Usage & API",
      items: [
        {
          to: createPageUrl("AdminUsage"),
          icon: Sparkles,
          title: ar ? "استخدام الذكاء والاعتمادات" : "AI usage & credits",
          desc: ar ? "متابعة استهلاك المستخدمين" : "Monitor user consumption",
        },
        {
          to: createPageUrl("APISettings"),
          icon: KeyRound,
          title: ar ? "مفاتيح API والربط" : "API keys & Stripe",
          desc: ar ? "مفاتيح التكامل" : "Integration keys",
        },
        {
          to: createPageUrl("APIDocumentation"),
          icon: BookOpen,
          title: ar ? "توثيق واجهة البرمجة" : "API documentation",
          desc: ar ? "Endpoints للمطوّرين" : "Endpoints for developers",
        },
        {
          to: createPageUrl("AdminDashboard"),
          icon: Bot,
          title: ar ? "مساعد الإدارة (تجريبي)" : "Admin AI (experimental)",
          desc: ar ? "أوامر ومساعد" : "Commands & assistant",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 pb-10 min-h-[60vh] animate-in fade-in duration-500" dir={ar ? "rtl" : "ltr"}>
      {/* الترويسة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg"
            style={{ background: "#1a3a5c", color: "#c9a227" }}
          >
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              {ar ? "لوحة تحكم المسؤول الأعلى" : "Super Admin Console"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {ar
                ? "إدارة المنصّة والتحكم في إعدادات السيرفر والبيانات."
                : "Platform management and server settings control."}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500">
              <KeyRound className="h-3 w-3" />
              {SUPER_ADMIN_EMAIL}
            </div>
          </div>
        </div>
        <Button variant="outline" asChild className="shrink-0 border-slate-300 hover:bg-slate-50">
          <Link to={createPageUrl("Dashboard")} className="gap-2">
            <ArrowLeft className={`h-4 w-4 ${ar ? "" : "rotate-180"}`} />
            {ar ? "لوحة التحكم" : "Dashboard"}
          </Link>
        </Button>
      </div>

      {/* تحذير في حال فشل الاتصال بقاعدة البيانات */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4 text-red-900">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              {ar 
                ? "تعذر جلب الإحصائيات المباشرة. تأكد من اتصال قاعدة البيانات (Supabase/STC)." 
                : "Could not fetch live stats. Check database connection."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: ar ? "مستخدمون" : "Users", value: stats?.users, icon: Users },
          { label: ar ? "فواتير" : "Invoices", value: stats?.invoices, icon: FileText },
          { label: ar ? "مصروفات" : "Expenses", value: stats?.expenses, icon: Wallet },
          { label: ar ? "منتجات" : "Products", value: stats?.products, icon: Package },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-slate-50 p-2">
                <Icon className="h-6 w-6 shrink-0 text-[#1a3a5c]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="text-xl font-black text-slate-900">
                  {isLoading ? "..." : value ?? "0"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* روابط الإدارة */}
      {sections.map((sec) => (
        <div key={sec.title} className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <div className="h-1.5 w-1.5 rounded-full bg-[#c9a227]" />
            {sec.title}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {sec.items.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass}>
                <span className="flex w-full items-center gap-2 font-bold text-[#1a3a5c]">
                  <item.icon className="h-5 w-5 shrink-0 text-[#c9a227]" />
                  {item.title}
                </span>
                <span className="text-xs leading-relaxed text-slate-500">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* تذييل أمني */}
      <Card className="border-slate-200 bg-slate-50/50">
        <CardHeader className="py-4">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
            <Lock className="h-4 w-4" />
            {ar ? "نظام حماية المسؤول" : "Admin Protection System"}
          </CardTitle>
          <CardDescription className="text-xs">
            {ar
              ? "هذه الصفحة محمية برمجياً. يتم التحقق من البريد الإلكتروني المصرّح به قبل عرض أي بيانات حساسة."
              : "This page is protected. Authorized email is verified before displaying sensitive data."}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}