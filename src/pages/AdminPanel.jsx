import { Navigate } from "react-router-dom";

/** إعادة توجيه إلى صفحة إعدادات المسؤول الموحّدة */
export default function AdminPanel() {
  return <Navigate to="/admin/settings" replace />;
}
