import React, { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { useAuth } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Receipt, Search } from "lucide-react";
import { isSuperAdminUser } from "@/lib/superAdmin";

export default function AdminPaymentLogs() {
  const { user } = useAuth();
  const [q, setQ] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["paymentLogs"],
    queryFn: () => Wadaq.entities.PaymentLog.list("-created_date", 500),
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return logs;
    return logs.filter(
      (r) =>
        String(r.user_email || "")
          .toLowerCase()
          .includes(s) ||
        String(r.external_id || "")
          .toLowerCase()
          .includes(s) ||
        String(r.plan_label || "")
          .toLowerCase()
          .includes(s)
    );
  }, [logs, q]);

  if (!isSuperAdminUser(user)) {
    return <Navigate to="/Dashboard" replace />;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div
          className="p-3 rounded-xl"
          style={{ background: "#1a3a5c", color: "#c9a227" }}
        >
          <Receipt className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">سجلات الدفع</h1>
          <p className="text-sm text-slate-500">مراقبة عمليات Moyasar والوضع التجريبي</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="بحث بالبريد أو رقم العملية…"
          className="pr-10"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">البريد</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">الوضع</TableHead>
              <TableHead className="text-right">المزوّد</TableHead>
              <TableHead className="text-right">الخطة</TableHead>
              <TableHead className="text-right">رقم العملية</TableHead>
              <TableHead className="text-right">تفعيل الاشتراك</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  جاري التحميل…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  لا سجلات بعد
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {r.created_date ? String(r.created_date).slice(0, 19).replace("T", " ") : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs" dir="ltr">
                    {r.user_email || "—"}
                  </TableCell>
                  <TableCell>
                    {r.amount_sar != null ? `${Number(r.amount_sar).toFixed(2)} ر.س` : "—"}
                  </TableCell>
                  <TableCell>{r.mode === "live" ? "إنتاج" : "اختبار"}</TableCell>
                  <TableCell className="text-xs">{r.provider || "—"}</TableCell>
                  <TableCell className="max-w-[140px] truncate">{r.plan_label || r.plan_id || "—"}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[120px] truncate" dir="ltr" title={r.external_id}>
                    {r.external_id || "—"}
                  </TableCell>
                  <TableCell>{r.subscription_activated ? "نعم" : "لا"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
