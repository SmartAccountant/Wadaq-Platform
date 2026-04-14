import React, { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Wadaq } from "@/api/WadaqClient";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer } from "lucide-react";
import { createPageUrl } from "@/utils";
import { computeVat15Inclusive } from "@/lib/paymentTax";

export default function PaymentInvoice() {
  const location = useLocation();
  const { refresh } = useAuth();

  const state = location.state || {};
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const amountSar = Number(state.amountSar ?? params.get("amount")) || 0;
  const rawLabel = params.get("label");
  const planLabel =
    state.planLabel ||
    (rawLabel ? decodeURIComponent(rawLabel) : null) ||
    "اشتراك ودق";
  const planId = state.planId || params.get("plan") || "";
  const paymentRef = state.paymentRef || params.get("ref") || params.get("id") || "";
  const mode = state.mode || params.get("mode") || "test";

  const lines = useMemo(() => computeVat15Inclusive(amountSar), [amountSar]);
  const moyasarDone = useRef(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const moyasar = params.get("gateway") === "moyasar";
    const pid = params.get("id") || params.get("payment_id");
    if (!moyasar || !pid || !amountSar || moyasarDone.current) return;
    moyasarDone.current = true;

    (async () => {
      try {
        await Wadaq.functions.invoke("completeSubscriptionPayment", {
          amount_sar: amountSar,
          plan_label: planLabel,
          plan_id: planId,
          mode: mode === "live" ? "live" : "test",
          provider: "moyasar",
          external_id: String(pid),
          metadata: { moyasar_redirect: true },
        });
        await refresh();
      } catch (e) {
        console.error(e);
        moyasarDone.current = false;
      }
    })();
  }, [params, amountSar, planLabel, planId, mode, refresh]);

  if (!amountSar && !params.get("id") && !params.get("payment_id")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <p className="text-slate-600">لا تفاصيل فاتورة. عُد إلى صفحة الدفع أو الأسعار.</p>
            <Button asChild>
              <Link to={createPageUrl("Pricing")}>الأسعار</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:bg-white print:py-4" dir="rtl">
      <div className="max-w-lg mx-auto space-y-6 print:max-w-none">
        <Card className="border-2 border-slate-200 shadow-lg print:shadow-none print:border-slate-300">
          <CardHeader className="border-b bg-white rounded-t-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl text-slate-900 flex items-center gap-2">
                  <FileText className="w-7 h-7 text-amber-600" />
                  فاتورة ضريبية مبسّطة
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">نظام ودق — اشتراك برمجي</p>
              </div>
              <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                {mode === "live" ? "إنتاج" : "اختبار"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6 bg-white">
            <div className="text-sm space-y-1">
              <p>
                <span className="text-slate-500">البند:</span>{" "}
                <span className="font-semibold text-slate-900">{planLabel}</span>
              </p>
              {planId ? (
                <p className="font-mono text-xs text-slate-400">معرّف الباقة: {planId}</p>
              ) : null}
              {paymentRef ? (
                <p>
                  <span className="text-slate-500">رقم المرجع:</span>{" "}
                  <span className="font-mono dir-ltr inline-block">{paymentRef}</span>
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-700">
                    <th className="text-right p-3">الوصف</th>
                    <th className="text-left p-3 w-28">المبلغ (ر.س)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">القيمة قبل الضريبة (15%)</td>
                    <td className="p-3 text-left font-mono tabular-nums">
                      {lines.net.toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="border-t bg-amber-50/50">
                    <td className="p-3">ضريبة القيمة المضافة 15%</td>
                    <td className="p-3 text-left font-mono tabular-nums">
                      {lines.vat.toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="border-t font-bold bg-slate-900 text-white">
                    <td className="p-3">الإجمالي شامل الضريبة</td>
                    <td className="p-3 text-left font-mono tabular-nums">
                      {lines.total.toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              تُستخرج هذه الفاتورة تلقائياً عند إتمام الدفع. الأسعار المعروضة على صفحة الأسعار تشمل ضريبة
              القيمة المضافة وفقاً للأنظمة المعمول بها في المملكة العربية السعودية.
            </p>

            <div className="flex flex-wrap gap-3 print:hidden">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
              <Button
                type="button"
                className="text-white"
                style={{ background: "#1a3a5c" }}
                asChild
              >
                <Link to={createPageUrl("Dashboard")}>الانتقال إلى لوحة التحكم</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
