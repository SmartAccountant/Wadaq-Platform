import React, { useState, useEffect } from "react";
import { Wadaq } from "@/api/WadaqClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, CreditCard, Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function PaymentAdmin() {
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [moyasarLiveSecretKey, setMoyasarLiveSecretKey] = useState("");
  const [moyasarLivePublishableKey, setMoyasarLivePublishableKey] = useState("");

  useEffect(() => {
    Wadaq.auth.me()
      .then((userData) => {
        if (userData.role !== 'admin') {
          window.location.href = '/Dashboard';
          return;
        }
        setUser(userData);
        setMoyasarLiveSecretKey(userData.moyasar_live_secret_key || "");
        setMoyasarLivePublishableKey(userData.moyasar_live_publishable_key || "");
      })
      .catch(() => {
        window.location.href = '/Dashboard';
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await Wadaq.auth.updateMe({
        moyasar_live_secret_key: moyasarLiveSecretKey,
        moyasar_live_publishable_key: moyasarLivePublishableKey,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving payment settings:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {language === 'ar' ? 'إدارة المدفوعات' : 'Payment Administration'}
          </h1>
          <p className="text-slate-400">
            {language === 'ar' ? 'إعدادات بوابة الدفع Moyasar' : 'Moyasar Payment Gateway Settings'}
          </p>
        </div>
      </div>

      {/* Admin Only Notice */}
      <Card className="border-2 border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-amber-400" />
          <div className="flex-1">
            <p className="text-amber-300 font-semibold text-sm">
              {language === 'ar' ? '⚠️ صفحة مقيدة للمسؤولين فقط' : '⚠️ Admin Only Page'}
            </p>
            <p className="text-amber-400/70 text-xs mt-1">
              {language === 'ar' 
                ? 'هذه الصفحة مخفية وغير متاحة إلا لحسابات المسؤولين'
                : 'This page is hidden and only accessible to admin accounts'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Moyasar Integration Card */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-purple-900/30 border-2 border-purple-500/30">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-purple-400" />
            <div>
              <CardTitle className="text-2xl text-white">
                {language === 'ar' ? 'ربط بوابة ميسر Moyasar' : 'Moyasar Gateway Integration'}
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                {language === 'ar'
                  ? 'قم بإدخال مفاتيح API من حسابك في ميسر لتفعيل المدفوعات'
                  : 'Enter your Moyasar API keys to activate payments'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Live Secret Key */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <Key className="w-4 h-4" />
              {language === 'ar' ? 'Live Secret Key (مفتاح سري)' : 'Live Secret Key'}
            </Label>
            <div className="relative">
              <Input
                type={showSecretKey ? "text" : "password"}
                value={moyasarLiveSecretKey}
                onChange={(e) => setMoyasarLiveSecretKey(e.target.value)}
                placeholder="sk_live_..."
                className="pr-10 font-mono text-sm"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              {language === 'ar'
                ? 'المفتاح السري لإجراء عمليات الدفع من السيرفر'
                : 'Secret key for server-side payment operations'}
            </p>
          </div>

          {/* Live Publishable Key */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <Key className="w-4 h-4" />
              {language === 'ar' ? 'Live Publishable Key (مفتاح عام)' : 'Live Publishable Key'}
            </Label>
            <Input
              type="text"
              value={moyasarLivePublishableKey}
              onChange={(e) => setMoyasarLivePublishableKey(e.target.value)}
              placeholder="pk_live_..."
              className="font-mono text-sm"
              dir="ltr"
            />
            <p className="text-xs text-slate-400">
              {language === 'ar'
                ? 'المفتاح العام لعرض نموذج الدفع في الموقع'
                : 'Public key for displaying payment form on website'}
            </p>
          </div>

          {/* Payment Methods Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-3">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              {language === 'ar' ? 'طرق الدفع المفعّلة' : 'Enabled Payment Methods'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Mada</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Apple Pay</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Visa/Mastercard</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">STC Pay</span>
              </div>
            </div>
          </div>

          {/* Bank Account Info */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">
                  {language === 'ar' ? 'الحساب البنكي' : 'Bank Account'}
                </h4>
                <p className="text-sm text-slate-300">
                  {language === 'ar'
                    ? 'سيتم تحويل الأموال تلقائياً إلى الحساب البنكي المرتبط بحساب ميسر الخاص بمؤسسة رِكاز'
                    : 'Payments will be automatically transferred to the bank account linked to Rikaz Foundation\'s Moyasar account'}
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              onClick={handleSave}
              disabled={saving || !moyasarLiveSecretKey || !moyasarLivePublishableKey}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                </>
              )}
            </Button>
          </div>

          {/* Success Message */}
          {saveSuccess && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-300">
                {language === 'ar' ? '✓ تم حفظ الإعدادات بنجاح' : '✓ Settings saved successfully'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            {language === 'ar' ? 'كيفية الحصول على المفاتيح' : 'How to Get API Keys'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li>
              {language === 'ar'
                ? 'سجّل دخول إلى حساب ميسر على'
                : 'Login to your Moyasar account at'}{' '}
              <a
                href="https://moyasar.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                moyasar.com
              </a>
            </li>
            <li>
              {language === 'ar'
                ? 'اذهب إلى الإعدادات (Settings) → API Keys'
                : 'Go to Settings → API Keys'}
            </li>
            <li>
              {language === 'ar'
                ? 'انسخ Live Secret Key و Live Publishable Key'
                : 'Copy your Live Secret Key and Live Publishable Key'}
            </li>
            <li>
              {language === 'ar'
                ? 'الصق المفاتيح في الحقول أعلاه واضغط حفظ'
                : 'Paste the keys in the fields above and click Save'}
            </li>
          </ol>
          <p className="text-amber-400 text-xs mt-4">
            {language === 'ar'
              ? '⚠️ لا تشارك المفاتيح مع أي شخص - احتفظ بها آمنة'
              : '⚠️ Never share your API keys - keep them secure'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}