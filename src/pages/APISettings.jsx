import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Eye, EyeOff, RefreshCw, Key, CheckCircle2, AlertCircle, CreditCard, Loader2, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { Badge } from "@/components/ui/badge";

export default function APISettings() {
  const { language } = useLanguage();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const userData = await Wadaq.auth.me();
      if (userData.role !== 'admin') {
        window.location.href = '/Dashboard';
        throw new Error('Unauthorized');
      }
      return userData;
    },
  });

  useEffect(() => {
    if (user?.api_key) {
      setApiKey(user.api_key);
    }
    if (user?.stripe_enabled !== undefined) {
      setStripeEnabled(user.stripe_enabled);
    }
  }, [user]);

  const generateApiKey = async () => {
    try {
      setGeneratingKey(true);
      const apiKey = 'sk_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      await Wadaq.auth.updateMe({ api_key: apiKey });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    } catch (error) {
      console.error("Error generating API key:", error);
      alert(language === 'ar' ? 'حدث خطأ أثناء إنشاء المفتاح' : 'Error generating API key');
    } finally {
      setGeneratingKey(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(language === 'ar' ? 'تم النسخ!' : 'Copied!');
  };

  const toggleStripeMutation = useMutation({
    mutationFn: async (enabled) => {
      return Wadaq.auth.updateMe({ stripe_enabled: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const hasApiAccess = user?.subscription_status === 'founder' || user?.subscription_status === 'enterprise';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
          {language === 'ar' ? 'إعدادات الربط' : 'Integration Settings'}
        </h1>
        <p className="text-slate-500 mt-1">
          {language === 'ar' 
            ? 'إدارة بوابات الدفع والتكامل مع منصات التجارة الإلكترونية' 
            : 'Manage payment gateways and e-commerce platform integrations'}
        </p>
      </div>

      {/* Stripe Payment Gateway */}
      <Card className="border-t-4 border-t-blue-600">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {language === 'ar' ? 'بوابة الدفع Stripe' : 'Stripe Payment Gateway'}
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  {language === 'ar' ? 'قبول المدفوعات عبر الإنترنت للفواتير' : 'Accept online payments for invoices'}
                </p>
              </div>
            </div>
            <Badge className={stripeEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
              {stripeEnabled 
                ? (language === 'ar' ? 'مفعّل' : 'Enabled') 
                : (language === 'ar' ? 'معطّل' : 'Disabled')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Stripe Status */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-1">
                  {language === 'ar' ? 'وضع الاختبار' : 'Test Mode'}
                </p>
                <p className="text-sm text-blue-700 mb-2">
                  {language === 'ar' 
                    ? 'حالياً تعمل في وضع الاختبار. استخدم البطاقة التجريبية: 4242 4242 4242 4242'
                    : 'Currently in test mode. Use test card: 4242 4242 4242 4242'}
                </p>
                <p className="text-xs text-blue-600">
                  {language === 'ar'
                    ? '💡 للتفعيل الكامل وقبول مدفوعات حقيقية، قم بتكوين مفاتيح Stripe الخاصة بك من لوحة التحكم'
                    : '💡 To go live and accept real payments, configure your own Stripe keys from the dashboard'}
                </p>
              </div>
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-800">
                {language === 'ar' ? 'تفعيل المدفوعات عبر Stripe' : 'Enable Stripe Payments'}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {language === 'ar' 
                  ? 'السماح للعملاء بالدفع عبر الإنترنت باستخدام بطاقات الائتمان'
                  : 'Allow customers to pay online using credit cards'}
              </p>
            </div>
            <Button
              onClick={() => {
                const newState = !stripeEnabled;
                setStripeEnabled(newState);
                toggleStripeMutation.mutate(newState);
              }}
              variant={stripeEnabled ? "default" : "outline"}
              className={stripeEnabled ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              disabled={toggleStripeMutation.isPending}
            >
              {stripeEnabled 
                ? (language === 'ar' ? 'تعطيل' : 'Disable')
                : (language === 'ar' ? 'تفعيل' : 'Enable')}
            </Button>
          </div>

          {/* Features List */}
          {stripeEnabled && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <p className="font-medium text-slate-800 mb-3">
                {language === 'ar' ? 'المزايا المتاحة:' : 'Available Features:'}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'زر "الدفع الآن" في الفواتير' : '"Pay Now" button in invoices'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'تحديث تلقائي لحالة الفاتورة' : 'Automatic invoice status update'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'إشعار بريد إلكتروني للعميل' : 'Email notification to customer'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'دعم العملة السعودية (ر.س)' : 'SAR currency support'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Webhook Info */}
          {stripeEnabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>{language === 'ar' ? 'ملاحظة:' : 'Note:'}</strong>{' '}
                {language === 'ar'
                  ? 'تم تكوين الويب هوك تلقائياً لاستقبال تأكيدات الدفع من Stripe'
                  : 'Webhooks are automatically configured to receive payment confirmations from Stripe'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Access Card */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">
                {language === 'ar' ? 'مفتاح API للتكامل' : 'API Integration Key'}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'ar' 
                  ? 'استخدم هذا المفتاح للربط مع متجرك الإلكتروني' 
                  : 'Use this key to connect with your online store'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!hasApiAccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                {language === 'ar' ? 'ميزة حصرية للباقات المتقدمة' : 'Premium Feature'}
              </h3>
              <p className="text-slate-600 mb-6 max-w-md">
                {language === 'ar' 
                  ? 'API متاح حصرياً للباقات المتقدمة'
                  : 'API available exclusively for premium subscribers'}
              </p>
              <Button 
                onClick={() => window.location.href = '/Subscription'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {language === 'ar' ? 'ترقية الباقة' : 'Upgrade Plan'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {user?.api_key ? (
                <>
                  <div className="space-y-3">
                    <Label className="text-slate-700 font-semibold">
                      {language === 'ar' ? 'مفتاح API' : 'API Key'}
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={user.api_key}
                          readOnly
                          dir="ltr"
                          className="text-left font-mono text-sm pr-10 bg-slate-50"
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(user.api_key)}
                      >
                        <Copy className="w-4 h-4 ml-2" />
                        {language === 'ar' ? 'نسخ' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={generateApiKey}
                    disabled={generatingKey}
                  >
                    {generatingKey ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        {language === 'ar' ? 'جاري التجديد...' : 'Regenerating...'}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 ml-2" />
                        {language === 'ar' ? 'تجديد المفتاح' : 'Regenerate'}
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={generateApiKey} disabled={generatingKey}>
                    {generatingKey ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        {language === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 ml-2" />
                        {language === 'ar' ? 'إنشاء مفتاح' : 'Generate Key'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}