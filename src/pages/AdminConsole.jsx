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
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { SUPER_ADMIN_EMAIL } from "@/lib/superAdmin";

const linkClass =
  "flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-white p-4 text-right shadow-sm transition hover:border-[#c9a227]/60 hover:shadow-md";

export default function AdminConsole() {
  const { language } = useLanguage();
  const ar = language === "ar";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["adminConsoleStats"],
    queryFn: async () => {
      const [users, invoices, expenses, products] = await Promise.all([
        Wadaq.entities.User.list(),
        Wadaq.entities.Invoice.list(),
        Wadaq.entities.Expense.list(),
        Wadaq.entities.Product.list(),
      ]);
      return {
        users: users.length,
        invoices: invoices.length,
        expenses: expenses.length,
        products: products.length,
      };
    },
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
    <div className="space-y-8 pb-10" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
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
                ? "إدارة المنصّة من المتصفّح — روابط موحّدة لكل أدوات الإدارة."
                : "Platform management in the browser — unified links to all admin tools."}
            </p>
            <p className="mt-2 font-mono text-xs text-slate-500 break-all">
              {ar ? "الحساب المصرّح:" : "Authorized account:"} {SUPER_ADMIN_EMAIL}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild className="shrink-0 border-slate-300">
          <Link to={createPageUrl("Dashboard")} className="gap-2">
            <ArrowLeft className={`h-4 w-4 ${ar ? "" : "rotate-180"}`} />
            {ar ? "لوحة التحكم" : "Dashboard"}
          </Link>
        </Button>
      </div>

      <Card className="border-amber-200/80 bg-amber-50/90">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-amber-900">
            <Lock className="h-5 w-5" />
            {ar ? "ملاحظة أمنية" : "Security note"}
          </CardTitle>
          <CardDescription className="text-amber-950/80">
            {ar
              ? "التحقق من الهوية يتم في الواجهة لإخفاء القوائم عن غير المسؤول، لكن أي مستخدم يمكنه تعديل الشيفرة محلياً. للإنتاج استخدم خادم API يتحقق من البريد/الدور على كل طلب حساس."
              : "The UI hides these pages from others, but client checks can be bypassed. For production, enforce email/role on the server for every sensitive action."}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: ar ? "مستخدمون" : "Users", value: stats?.users, icon: Users },
          { label: ar ? "فواتير" : "Invoices", value: stats?.invoices, icon: FileText },
          { label: ar ? "مصروفات" : "Expenses", value: stats?.expenses, icon: Wallet },
          { label: ar ? "منتجات" : "Products", value: stats?.products, icon: Package },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-slate-200">
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="h-8 w-8 shrink-0 text-[#1a3a5c]" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {isLoading ? "…" : value ?? "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sections.map((sec) => (
        <div key={sec.title} className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">{sec.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {sec.items.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass}>
                <span className="flex w-full items-center gap-2 font-bold text-[#1a3a5c]">
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.title}
                </span>
                <span className="text-sm text-slate-600">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
