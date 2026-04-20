import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { createPageUrl } from "@/utils";
import { canAccessPage, getEffectivePlanId } from "@/lib/subscriptionAccess";
import { isSuperAdminUser } from "@/lib/superAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

/** مسارات الإدارة — يُسمح بالمرور للواجهة؛ `SuperAdminGate` يفرض البريد/الصلاحية */
const ADMIN_APP_PATHS = new Set([
  "admin",
  "admin-settings",
  "admin-payment-settings",
  "admin-payment-logs",
]);

/**
 * يمنع عرض صفحات خارج باقة المستخدم (بعد الدفع). التجربة ترى كل القوائم.
 */
export default function SubscriptionAccessGuard({ pageName, children }) {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();

  if (pageName && ADMIN_APP_PATHS.has(pageName)) {
    return children;
  }

  if (!user || isSuperAdminUser(user) || user.role === "admin") return children;

  if (canAccessPage(user, pageName)) return children;

  const plan = getEffectivePlanId(user);
  const planSuffix = plan && plan !== "trial" ? ` (${plan})` : "";
  const body = t("subscription_upgrade_body").replace("{plan}", planSuffix);

  return (
    <div className="mx-auto max-w-lg py-10 px-4" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="border-amber-200/80 bg-amber-50/90 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-[#1a3a5c]">
            <ShieldAlert className="h-6 w-6 shrink-0 text-amber-600" />
            {t("subscription_upgrade_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-700 leading-relaxed">
          <p>{body}</p>
          <Button asChild className="w-full font-bold bg-[#1a3a5c] hover:bg-[#152a45]">
            <Link to={createPageUrl("Pricing")}>{t("subscription_upgrade_cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
