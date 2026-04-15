import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Landing from "@/pages/Landing";

/** الصفحة الرئيسية `/`: هبوط للزوار، لوحة التحكم للمستخدم المسجّل. */
export default function HomeEntry() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f2744" }}>
        <div className="h-10 w-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/Dashboard" replace />;
  return <Landing />;
}
