import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Eye, EyeOff, Loader2, Shield } from "lucide-react";

const PS_ID = "ps-global";

export default function AdminPaymentSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecret, setShowSecret] = useState(false);

  const { data: row, isLoading } = useQuery({
    queryKey: ["paymentSettings"],
    queryFn: async () => {
      const r = await Wadaq.entities.PaymentSettings.get(PS_ID);
      return r || { id: PS_ID, moyasar_live_secret_key: "", moyasar_live_publishable_key: "" };
    },
  });

  const [secret, setSecret] = useState("");
  const [publishable, setPublishable] = useState("");

  useEffect(() => {
    if (row) {
      setSecret(row.moyasar_live_secret_key || "");
      setPublishable(row.moyasar_live_publishable_key || "");
    }
  }, [row]);

  const save = useMutation({
    mutationFn: async () => {
      const existing = await Wadaq.entities.PaymentSettings.get(PS_ID);
      if (existing) {
        return Wadaq.entities.PaymentSettings.update(PS_ID, {
          moyasar_live_secret_key: secret.trim(),
          moyasar_live_publishable_key: publishable.trim(),
        });
      }
      return Wadaq.entities.PaymentSettings.create({
        id: PS_ID,
        moyasar_live_secret_key: secret.trim(),
        moyasar_live_publishable_key: publishable.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentSettings"] });
      toast({ title: "تم الحفظ", description: "تم تخزين مفاتيح Moyasar في قاعدة البيانات." });
    },
    onError: (e) =>
      toast({ variant: "destructive", title: "فشل الحفظ", description: e?.message || "" }),
  });

  if (user?.role !== "admin") {
    return <Navigate to="/Dashboard" replace />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div
          className="p-3 rounded-xl"
          style={{ background: "#1a3a5c", color: "#c9a227" }}
        >
          <CreditCard className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">إعدادات الدفع (Moyasar)</h1>
          <p className="text-sm text-slate-500">المفاتيح تُحفظ في Wadaq.entities.PaymentSettings</p>
        </div>
      </div>

      <Card className="border-amber-200/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-amber-700" />
            مفاتيح الإنتاج (Live)
          </CardTitle>
          <CardDescription>
            اترك الحقلين فارغين لتشغيل بوابة الدفع في وضع الاختبار داخل التطبيق (قبول تجريبي).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="pk">Live Publishable Key</Label>
                <Input
                  id="pk"
                  dir="ltr"
                  className="font-mono text-sm"
                  placeholder="pk_live_..."
                  value={publishable}
                  onChange={(e) => setPublishable(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sk">Live Secret Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="sk"
                    dir="ltr"
                    type={showSecret ? "text" : "password"}
                    className="font-mono text-sm flex-1"
                    placeholder="sk_live_..."
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSecret(!showSecret)}
                    aria-label="إظهار المفتاح"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                className="w-full sm:w-auto font-bold text-white"
                style={{ background: "#1a3a5c", borderBottom: "2px solid #c9a227" }}
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? "جاري الحفظ…" : "حفظ المفاتيح"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
