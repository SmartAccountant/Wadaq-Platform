import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/** يمنع دخول صفحات الضيف عند وجود جلسة (توجيه للوحة أو الصفحة السابقة). */
export default function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f2744" }}>
        <div className="h-10 w-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (user) {
    const ret =
      typeof sessionStorage !== "undefined" ? sessionStorage.getItem("wadaq_return_url") : null;
    if (ret) {
      try {
        sessionStorage.removeItem("wadaq_return_url");
      } catch {
        /* ignore */
      }
      return <Navigate to={ret} replace />;
    }
    const st = location.state?.from?.pathname;
    return <Navigate to={st && st !== "/login" ? st : "/Dashboard"} replace />;
  }
  return children;
}
