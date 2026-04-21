import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { createPageUrl } from "@/utils";
import { getPrimarySuperAdminEmail, isSuperAdminUser } from "@/lib/superAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

/**
 * يقيّد المحتوى على حساب المسؤول الأعلى فقط (البريد في `superAdmin.js`).
 */
export default function SuperAdminGate({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" style={{ background: "#eef1f6" }}>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-[#c9a227]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isSuperAdminUser(user)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16" dir="rtl">
        <Card className="border-rose-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-800">
              <ShieldOff className="h-6 w-6" />
              غير مصرّح
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700">
            <p>هذه المنطقة مخصّصة لمسؤول المنصّة فقط (البريد المصرّح به لا يطابق حسابك الحالي).</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              يمكن ربط بريدك بإضافة{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">
                VITE_SUPER_ADMIN_EMAIL
              </code>{" "}
              في ملف <code className="font-mono text-[10px]">.env</code> ثم إعادة بناء التطبيق. المرجع الحالي:{" "}
              <span className="font-mono text-[10px]">{getPrimarySuperAdminEmail()}</span>
            </p>
            <p className="text-sm text-slate-500">
              Unauthorized — super admin access only.
            </p>
            <Button asChild className="w-full font-bold bg-[#1a3a5c] hover:bg-[#152a45]">
              <Link to={createPageUrl("Dashboard")}>العودة للوحة التحكم</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}
