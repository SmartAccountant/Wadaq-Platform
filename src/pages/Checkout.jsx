import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Wadaq,
  paymentKeysAreLive,
  getMoyasarPublishableKey,
  moyasarPaymentModeFromKey,
} from "@/api/WadaqCore";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, TestTube2, Settings } from "lucide-react";
import { computeVat15Inclusive } from "@/lib/paymentTax";

const PS_ID = "ps-global";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();

  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState(null);
  const moyasarHostRef = useRef(null);
  const [moyasarError, setMoyasarError] = useState(null);

  const sessionId = searchParams.get("session_id");
  const canceled = searchParams.get("canceled");
  const plan = searchParams.get("plan") || "golden";
  const amount = Number(searchParams.get("amount")) || 750;
  const cycle = searchParams.get("cycle") || "yearly";
  const label = searchParams.get("label")
    ? decodeURIComponent(searchParams.get("label"))
    : "اشتراك ودق";

  const publishableKey = getMoyasarPublishableKey(settings);
  const paymentMode = moyasarPaymentModeFromKey(publishableKey);
  const hasMoyasarKey = Boolean(publishableKey);
  const isConfiguredLive = paymentKeysAreLive(settings);

  const lines = computeVat15Inclusive(amount);

  const loadSettings = useCallback(async () => {
    await Wadaq.auth.me().catch(() => null);
    const row = await Wadaq.entities.PaymentSettings.get(PS_ID);
    setSettings(row || { moyasar_live_secret_key: "", moyasar_live_publishable_key: "" });
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /** معالجة عودة Stripe/جلسات قديمة */
  useEffect(() => {
    if (canceled) {
      setStatus("canceled");
      setMessage("تم إلغاء عملية الدفع");
      return;
    }
    if (!sessionId) return;

    (async () => {
      try {
        const user = await Wadaq.auth.me();
        if (!user) throw new Error("غير مسجّل");
        const ext = `stripe-session-${sessionId}`;
        const res = await Wadaq.functions.invoke("completeSubscriptionPayment", {
          amount_sar: amount,
          plan_label: label,
          plan_id: plan,
          mode: "live",
          provider: "stripe_session",
          external_id: ext,
          metadata: { session_id: sessionId },
        });
        if (res.data?.error) throw new Error(res.data.error);
        await refresh();
        navigate("/PaymentInvoice", {
          replace: true,
          state: {
            amountSar: amount,
            planLabel: label,
            planId: plan,
            mode: "live",
            paymentRef: ext,
          },
        });
      } catch (e) {
        console.error(e);
        setStatus("error");
        setMessage(e?.message || "حدث خطأ أثناء تفعيل الاشتراك");
      }
    })();
  }, [sessionId, canceled, amount, label, plan, navigate, refresh]);

  /** Moyasar — نموذج الدفع الرسمي (إنتاج أو اختبار حسب بادئة المفتاح) */
  useEffect(() => {
    if (!hasMoyasarKey || sessionId || canceled) return;
    const el = moyasarHostRef.current;
    if (!el) return;

    setMoyasarError(null);
    const publishable = publishableKey;
    const amountHalalas = Math.max(100, Math.round(amount * 100));

    const callbackUrl = new URL(`${window.location.origin}/PaymentInvoice`);
    callbackUrl.searchParams.set("gateway", "moyasar");
    callbackUrl.searchParams.set("amount", String(amount));
    callbackUrl.searchParams.set("label", encodeURIComponent(label));
    callbackUrl.searchParams.set("plan", plan);
    callbackUrl.searchParams.set("mode", paymentMode);

    const existing = document.querySelector('script[data-moyasar-mpf="1"]');
    if (existing) existing.remove();
    el.innerHTML = '<div class="mysr-checkout-mpf wadaq-moyasar"></div>';

    const script = document.createElement("script");
    script.src = "https://cdn.moyasar.com/mpf/v1/moyasar.js";
    script.async = true;
    script.dataset.moyasarMpf = "1";
    script.onload = () => {
      try {
        const M = window.Moyasar;
        if (!M || typeof M.init !== "function") {
          setMoyasarError("تعذّر تهيئة Moyasar");
          return;
        }
        M.init({
          element: ".mysr-checkout-mpf.wadaq-moyasar",
          amount: amountHalalas,
          currency: "SAR",
          description: label.slice(0, 255),
          publishable_api_key: publishable,
          callback_url: callbackUrl.toString(),
          methods: ["creditcard", "applepay", "stcpay"],
        });
      } catch (e) {
        console.error(e);
        setMoyasarError(e?.message || "خطأ في نموذج الدفع");
      }
    };
    script.onerror = () => setMoyasarError("فشل تحميل سكربت Moyasar");
    document.body.appendChild(script);

    return () => {
      script.remove();
      if (el) el.innerHTML = "";
    };
  }, [hasMoyasarKey, publishableKey, paymentMode, amount, label, plan, sessionId, canceled]);

  if (sessionId) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#1a3a5c]" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-100 to-white py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900">إتمام الدفع</h1>
          <p className="text-slate-500 text-sm mt-1">{label}</p>
        </div>

        <Card className="border-amber-200/60 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span>ملخص المبلغ</span>
              {hasMoyasarKey ? (
                paymentMode === "live" && isConfiguredLive ? (
                  <span className="text-xs font-normal flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Zap className="w-3.5 h-3.5" />
                    إنتاج — Moyasar
                  </span>
                ) : (
                  <span className="text-xs font-normal flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                    <TestTube2 className="w-3.5 h-3.5" />
                    Moyasar — اختبار
                  </span>
                )
              ) : (
                <span className="text-xs font-normal text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                  لا يوجد مفتاح
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>الدورة</span>
              <span>{cycle === "yearly" ? "سنوي" : cycle === "monthly" ? "شهري" : cycle}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>قبل الضريبة</span>
              <span className="font-mono tabular-nums">{lines.net.toFixed(2)} ر.س</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ضريبة القيمة المضافة (15%)</span>
              <span className="font-mono tabular-nums">{lines.vat.toFixed(2)} ر.س</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-base border-t pt-3">
              <span>الإجمالي</span>
              <span className="font-mono tabular-nums">{lines.total.toFixed(2)} ر.س</span>
            </div>
          </CardContent>
        </Card>

        {status === "canceled" && (
          <Card className="border-red-200">
            <CardContent className="pt-6 text-center text-red-700">{message}</CardContent>
          </Card>
        )}

        {status === "error" && (
          <Card className="border-red-200">
            <CardContent className="pt-6 text-center text-red-700">{message}</CardContent>
          </Card>
        )}

        {!hasMoyasarKey && status === "ready" && (
          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-amber-950">
                <Settings className="w-5 h-5" />
                تفعيل بوابة Moyasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>
                لإظهار نموذج الدفع الحقيقي (مدى، فيزا، Apple Pay، STC Pay عبر Moyasar)، أضف المفتاح
                الظاهر من لوحة التحكم أو عيّن المتغيّر{" "}
                <code className="text-xs bg-white px-1 rounded border" dir="ltr">
                  VITE_MOYASAR_PUBLISHABLE_KEY
                </code>{" "}
                في ملف البيئة للتجربة بمفتاح{" "}
                <span dir="ltr" className="font-mono text-xs">
                  pk_test_…
                </span>{" "}
                من لوحة Moyasar.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/payment-settings">فتح إعدادات الدفع</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {hasMoyasarKey && status === "ready" && !sessionId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">الدفع عبر Moyasar (السعودية)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {moyasarError ? (
                <p className="text-sm text-red-600">{moyasarError}</p>
              ) : (
                <>
                  <p className="text-xs text-slate-500">
                    بعد اكتمال الدفع ستُفعَّل صلاحيتك لمدة سنة من تاريخ الدفع، ويُسجَّل السجل في «سجلات
                    الدفع».
                  </p>
                  <div
                    ref={moyasarHostRef}
                    className="min-h-[120px] rounded-lg border border-slate-200 p-2 bg-slate-50/80"
                  />
                </>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
