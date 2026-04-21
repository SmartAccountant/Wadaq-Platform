import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isSubscriptionEffective } from "@/api/WadaqCore";
import { createPageUrl } from "@/utils";
import { isSuperAdminUser } from "@/lib/superAdmin";
import __Layout from "@/Layout.jsx";

/** مسموح بدون اشتراك فعّال — بما فيها مسارات الإدارة حتى يصل المستخدم لبوابة المسؤول ويرى رسالة واضحة */
const ALLOWED_WHEN_EXPIRED = new Set([
  "Pricing",
  "Subscription",
  "SubscriptionSuccess",
  "Checkout",
  "checkout",
  "PaymentInvoice",
  "admin",
  "admin-settings",
  "admin-payment-settings",
  "admin-payment-logs",
]);

function pathSegment(pathname) {
  if (pathname === "/" || pathname === "") return "Dashboard";
  const parts = pathname.replace(/^\//, "").split("/").filter(Boolean);
  if (parts[0] === "admin" && parts[1]) {
    return `admin-${parts[1]}`;
  }
  return parts[0] || "Dashboard";
}

/**
 * يتطلب تسجيل دخول، ويوجّه إلى الأسعار عند انتهاء التجربة/الاشتراك.
 * يلف المحتوى بـ Layout الرئيسي.
 */
export default function AuthSubscriptionLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const seg = pathSegment(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#eef1f6" }}>
        <div className="h-10 w-10 border-2 border-slate-300 border-t-[#c9a227] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    !isSuperAdminUser(user) &&
    user.role !== "admin" &&
    !isSubscriptionEffective(user) &&
    !ALLOWED_WHEN_EXPIRED.has(seg)
  ) {
    return <Navigate to={createPageUrl("Pricing")} replace />;
  }

  return (
    <__Layout currentPageName={seg}>
      <Outlet />
    </__Layout>
  );
}
