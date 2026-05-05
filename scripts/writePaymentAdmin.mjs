import { writeFileSync } from 'fs';

const line1 = `import React, { useState, useEffect } from "react";`;
const line2 = `import { Wadaq } from "@/api/WadaqCore";`;
const line3 = `import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";`;
const line4 = `import { Button } from "@/components/ui/button";`;
const line5 = `import { Input } from "@/components/ui/input";`;
const line6 = `import { Label } from "@/components/ui/label";`;
const line7 = `import { Shield, Key, CreditCard, Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";`;
const line8 = `import { useLanguage } from "@/components/LanguageContext";`;
const line9 = `import { isSuperAdminUser } from "@/lib/superAdmin";`;

const part1 = `
const PS_ID = "ps-global";

export default function PaymentAdmin() {
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResourceKey, setShowResourceKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tranportalId, setTranportalId] = useState("");
  const [tranportalPassword, setTranportalPassword] = useState("");
  const [resourceKey, setResourceKey] = useState("");
  const [neoleapMode, setNeoleapMode] = useState("test");

  useEffect(() => {
    Wadaq.auth.me()
      .then(async (userData) => {
        if (!isSuperAdminUser(userData)) { window.location.href = "/Dashboard"; return; }
        setUser(userData);
        const row = await Wadaq.entities.PaymentSettings.get(PS_ID).catch(() => null);
        if (row) {
          setTranportalId(row.neoleap_tranportal_id || "");
          setTranportalPassword(row.neoleap_tranportal_password || "");
          setResourceKey(row.neoleap_resource_key || "");
          setNeoleapMode(row.neoleap_mode || "test");
        }
      })
      .catch(() => { window.location.href = "/Dashboard"; })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await fetch("/api/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          neoleap_tranportal_id: tranportalId,
          neoleap_tranportal_password: tranportalPassword,
          neoleap_resource_key: resourceKey,
          neoleap_mode: neoleapMode,
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert(language === "ar" ? "حدث خطا اثناء الحفظ" : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-blue-500" /></div>;
  if (!user || !isSuperAdminUser(user)) return null;
`;

const part2 = `
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{language === "ar" ? "ادارة المدفوعات" : "Payment Administration"}</h1>
          <p className="text-slate-400">{language === "ar" ? "اعدادات بوابة Neoleap" : "Neoleap Payment Gateway Settings"}</p>
        </div>
      </div>
      <Card className="border-2 border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-amber-400" />
          <p className="text-amber-300 font-semibold text-sm">⚠️ {language === "ar" ? "صفحة مقيدة للمسؤولين فقط" : "Admin Only Page"}</p>
        </CardContent>
      </Card>
`;

const part3 = `
      <Card className="bg-gradient-to-br from-slate-900/90 to-blue-900/30 border-2 border-blue-500/30">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-400" />
            <div>
              <CardTitle className="text-2xl text-white">{language === "ar" ? "ربط بوابة Neoleap" : "Neoleap Gateway Integration"}</CardTitle>
              <CardDescription className="text-slate-400 mt-1">{language === "ar" ? "ادخل بيانات Neoleap لتفعيل المدفوعات" : "Enter Neoleap credentials to activate payments"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-white">{language === "ar" ? "وضع التشغيل" : "Mode"}</Label>
            <div className="flex gap-3">
              <button onClick={() => setNeoleapMode("test")} className={"flex-1 py-2 rounded-lg border text-sm font-medium transition-all " + (neoleapMode === "test" ? "bg-amber-500/20 border-amber-500 text-amber-300" : "border-slate-600 text-slate-400")}>
                {language === "ar" ? "اختبار (Test)" : "Test Mode"}
              </button>
              <button onClick={() => setNeoleapMode("live")} className={"flex-1 py-2 rounded-lg border text-sm font-medium transition-all " + (neoleapMode === "live" ? "bg-emerald-500/20 border-emerald-500 text-emerald-300" : "border-slate-600 text-slate-400")}>
                {language === "ar" ? "انتاج (Live)" : "Live Mode"}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2"><Key className="w-4 h-4" /> Tranportal ID</Label>
            <Input type="text" value={tranportalId} onChange={(e) => setTranportalId(e.target.value)} placeholder="9A1mW7Wp96JivIo" className="font-mono text-sm" dir="ltr" />
            <p className="text-xs text-slate-400">{language === "ar" ? "موجود في بريد Neoleap" : "Found in Neoleap email"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2"><Key className="w-4 h-4" /> Tranportal Password</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} value={tranportalPassword} onChange={(e) => setTranportalPassword(e.target.value)} placeholder="كلمة مرور Tranportal" className="pr-10 font-mono text-sm" dir="ltr" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2"><Key className="w-4 h-4" /> Terminal Resource Key</Label>
            <div className="relative">
              <Input type={showResourceKey ? "text" : "password"} value={resourceKey} onChange={(e) => setResourceKey(e.target.value)} placeholder="مفتاح التشفير" className="pr-10 font-mono text-sm" dir="ltr" />
              <button type="button" onClick={() => setShowResourceKey(!showResourceKey)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showResourceKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-3">
            <h4 className="font-semibold text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-400" />{language === "ar" ? "طرق الدفع المدعومة" : "Supported Payment Methods"}</h4>
            <div className="grid grid-cols-2 gap-3">
              {["Mada", "Visa / Mastercard", "Apple Pay", "STC Pay"].map((m) => (
                <div key={m} className="flex items-center gap-2 text-slate-300"><CheckCircle className="w-4 h-4 text-green-400" /><span className="text-sm">{m}</span></div>
              ))}
            </div>
          </div>
`;

const neoleapUrl = "https://securepayments.neoleap.com.sa/mrchptl/merchant.htm";

const part4 = `
          <div className="p-4 bg-slate-800/50 border border-slate-600/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-slate-300 space-y-1">
                <p className="font-semibold text-white">{language === "ar" ? "معلومات التاجر" : "Merchant Info"}</p>
                <p>Terminal ID: <span className="font-mono text-blue-300">PG336600</span></p>
                <p>Merchant ID: <span className="font-mono text-blue-300">600003130</span></p>
                <p>{language === "ar" ? "لوحة التاجر: " : "Merchant Panel: "}<a href="${neoleapUrl}" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">securepayments.neoleap.com.sa</a></p>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-white/10">
            <Button onClick={handleSave} disabled={saving || !tranportalId || !tranportalPassword || !resourceKey} className="bg-gradient-to-r from-blue-600 to-blue-900">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{language === "ar" ? "جاري الحفظ..." : "Saving..."}</> : <><Shield className="w-4 h-4 mr-2" />{language === "ar" ? "حفظ الاعدادات" : "Save Settings"}</>}
            </Button>
          </div>
          {saveSuccess && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-300">{language === "ar" ? "تم حفظ الاعدادات بنجاح" : "Settings saved successfully"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}`;

const imports = [line1,line2,line3,line4,line5,line6,line7,line8,line9].join('\n');
const content = imports + part1 + part2 + part3 + part4;

writeFileSync('src/pages/PaymentAdmin.jsx', content, 'utf8');
console.log('done - ' + content.split('\n').length + ' lines');