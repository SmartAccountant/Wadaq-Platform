import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { createPageUrl } from "@/utils";

/** يقيّد الكاشير / نقطة البيع على المسؤول فقط (حتى إشعار آخر). */
export default function AdminCashierGate({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" style={{ background: "#eef1f6" }}>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-[#c9a227]" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return <Navigate to={createPageUrl("Dashboard")} replace />;
  }

  return children;
}
