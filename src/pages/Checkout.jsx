import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Wadaq } from "@/api/WadaqCore";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, TestTube2, Settings, CreditCard } from "lucide-react";
import { computeVat15Inclusive } from "@/lib/paymentTax";
import { initiateNeoleapPayment } from "@/lib/neoleapService";

const PS_ID = "ps-global";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();
  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  const canceled = searchParams.get("canceled");
  const plan = searchParams.get("plan") || "golden";
  const amount = Number(searchParams.get("amount")) || 750;
  const cycle = searchParams.get("cycle") || "yearly";
  const label = searchParams.get("label")
    ? decodeURIComponent(searchParams.get("label"))
    : "ط§ط´طھط±ط§ظƒ ظˆط¯ظ‚";

  const lines = computeVat15Inclusive(amount);

  const hasNeoleapSettings = Boolean(
    settings?.neoleap_tranportal_id &&
    settings?.neoleap_tranportal_password &&
    settings?.neoleap_resource_key
  );

  const isTestMode = settings?.neoleap_mode !== "live";

  const loadSettings = useCallback(async () => {
    await Wadaq.auth.me().catch(() => null);
    const row = await Wadaq.entities.PaymentSettings.get(PS_ID);
    setSettings(row || {});
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  useEffect(() => {
    if (canceled) {
      setStatus("canceled");
      setMessage("طھظ… ط¥ظ„ط؛ط§ط، ط¹ظ…ظ„ظٹط© ط§ظ„ط¯ظپط¹");
    }
  }, [canceled]);

  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const errorParam = searchParams.get("error");
    const errorText = searchParams.get("errorText");
    if (!paymentId && !errorParam) return;
    if (errorParam) {
      setStatus("error");
      setMessage(errorText || "ظپط´ظ„طھ ط¹ظ…ظ„ظٹط© ط§ظ„ط¯ظپط¹");
      return;
    }
    if (paymentId) {
      (async () => {
        setStatus("processing");
        try {
          const user = await Wadaq.auth.me();
          if (!user) throw new Error("ط؛ظٹط± ظ…ط³ط¬ظ‘ظ„");
          await Wadaq.functions.invoke("completeSubscriptionPayment", {
            amount_sar: amount,
            plan_label: label,
            plan_id: plan,
            mode: isTestMode ? "test" : "live",
            provider: "neoleap",
            external_id: String(paymentId),
            metadata: { neoleap_payment_id: paymentId },
          });
          await refresh();
          navigate("/PaymentInvoice", {
            replace: true,
            state: {
              amountSar: amount,
              planLabel: label,
              planId: plan,
              mode: isTestMode ? "test" : "live",
              paymentRef: paymentId,
            },
          });
        } catch (e) {
          console.error(e);
          setStatus("error");
          setMessage(e?.message || "ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، طھظپط¹ظٹظ„ ط§ظ„ط§ط´طھط±ط§ظƒ");
        }
      })();
    }
  }, [searchParams, amount, label, plan, isTestMode, navigate, refresh]);

  const handlePayWithNeoleap = async () => {
    if (!hasNeoleapSettings) return;
    setLoading(true);
    setMessage("");
    try {
      const trackId = Date.now();
      const base = window.location.origin;
      const responseURL = `${base}/Checkout?paymentId={paymentId}&amount=${amount}&label=${encodeURIComponent(label)}&plan=${plan}`;
      const errorURL = `${base}/Checkout?error=1&errorText=${encodeURIComponent("ظپط´ظ„ ط§ظ„ط¯ظپط¹")}&amount=${amount}&label=${encodeURIComponent(label)}&plan=${plan}`;
      const { paymentUrl } = await initiateNeoleapPayment({
        amountSar: amount,
        trackId,
        tranportalId: settings.neoleap_tranportal_id,
        tranportalPass: settings.neoleap_tranportal_password,
        resourceKey: settings.neoleap_resource_key,
        responseURL,
        errorURL,
        planLabel: label,
        planId: plan,
      });
      window.location.href = paymentUrl;
    } catch (e) {
      console.error(e);
      setMessage(e?.message || "ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، طھط¬ظ‡ظٹط² ط§ظ„ط¯ظپط¹طŒ ط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰");
      setLoading(false);
    }
  };

  if (status === "processing") {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#1a3a5c]" />
        <p className="text-slate-600">ط¬ط§ط±ظٹ طھظپط¹ظٹظ„ ط§ط´طھط±ط§ظƒظƒ...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-100 to-white py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">

        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900">ط¥طھظ…ط§ظ… ط§ظ„ط¯ظپط¹</h1>
          <p className="text-slate-500 text-sm mt-1">{label}</p>
        </div>

        <Card className="border-amber-200/60 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span>ظ…ظ„ط®طµ ط§ظ„ظ…ط¨ظ„ط؛</span>
              {hasNeoleapSettings ? (
                isTestMode ? (
                  <span className="text-xs font-normal flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                    <TestTube2 className="w-3.5 h-3.5" />
                    Neoleap â€” ط§ط®طھط¨ط§ط±
                  </span>
                ) : (
                  <span className="text-xs font-normal flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Zap className="w-3.5 h-3.5" />
                    Neoleap â€” ط¥ظ†طھط§ط¬
                  </span>
                )
              ) : (
                <span className="text-xs font-normal text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                  ظ„ط§ ظٹظˆط¬ط¯ ط¥ط¹ط¯ط§ط¯
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>ط§ظ„ط¯ظˆط±ط©</span>
              <span>{cycle === "yearly" ? "ط³ظ†ظˆظٹ" : cycle === "monthly" ? "ط´ظ‡ط±ظٹ" : cycle}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ظ‚ط¨ظ„ ط§ظ„ط¶ط±ظٹط¨ط©</span>
              <span className="font-mono tabular-nums">{lines.net.toFixed(2)} ط±.ط³</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ط¶ط±ظٹط¨ط© ط§ظ„ظ‚ظٹظ…ط© ط§ظ„ظ…ط¶ط§ظپط© (15%)</span>
              <span className="font-mono tabular-nums">{lines.vat.toFixed(2)} ط±.ط³</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-base border-t pt-3">
              <span>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</span>
              <span className="font-mono tabular-nums">{lines.total.toFixed(2)} ط±.ط³</span>
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

        {!hasNeoleapSettings && status === "ready" && (
          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-amber-950">
                <Settings className="w-5 h-5" />
                طھظپط¹ظٹظ„ ط¨ظˆط§ط¨ط© Neoleap
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط¨ظٹط§ظ†ط§طھ Neoleap ظپظٹ طµظپط­ط© ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¯ظپط¹.</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/payment-settings">ظپطھط­ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¯ظپط¹</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {hasNeoleapSettings && status === "ready" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#1a3a5c]" />
                ط§ظ„ط¯ظپط¹ ط¹ط¨ط± ط¨ظˆط§ط¨ط© ط§ظ„ط±ط§ط¬ط­ظٹ (Neoleap)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && <p className="text-sm text-red-600 text-center">{message}</p>}
              <p className="text-xs text-slate-500">
                ط³طھظ†طھظ‚ظ„ ط¥ظ„ظ‰ طµظپط­ط© ط¯ظپط¹ ط¢ظ…ظ†ط© ط¹ظ„ظ‰ ظ…ظˆظ‚ط¹ ط¨ظ†ظƒ ط§ظ„ط±ط§ط¬ط­ظٹطŒ ظˆط¨ط¹ط¯ ط¥طھظ…ط§ظ… ط§ظ„ط¯ظپط¹ ط³طھط¹ظˆط¯ طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ظ„طھظپط¹ظٹظ„ ط§ط´طھط±ط§ظƒظƒ.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                <span>ًں”’</span>
                <span>ط§ظ„ط¯ظپط¹ ظ…ط¤ظ…ظ‘ظ† ط¨ط§ظ„ظƒط§ظ…ظ„ ط¹ط¨ط± ط¨ظ†ظƒ ط§ظ„ط±ط§ط¬ط­ظٹ</span>
              </div>
              <Button
                onClick={handlePayWithNeoleap}
                disabled={loading}
                className="w-full text-white font-bold py-3 text-base"
                style={{ background: "linear-gradient(135deg, #1a3a5c, #2563eb)" }}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 ml-2 animate-spin" />ط¬ط§ط±ظٹ ط§ظ„طھط¬ظ‡ظٹط²...</>
                ) : (
                  <><CreditCard className="w-5 h-5 ml-2" />ط§ط¯ظپط¹ {lines.total.toFixed(2)} ط±.ط³</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}