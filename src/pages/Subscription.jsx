import React, { useState, useEffect } from "react";
import { Wadaq } from "@/api/WadaqCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Shield, Sparkles, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useLanguage } from "@/components/LanguageContext";

export default function Subscription() {
  const { language } = useLanguage();
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [billingCycle, setBillingCycle] = useState("yearly");
  const navigate = useNavigate();

  useEffect(() => {
    Wadaq.auth.me().then(setUser).catch(console.error);
  }, []);

  const handleSubscribe = async (plan) => {
    setLoadingPlanId(plan.id);
    setError('');
    try {
      // Check if running in iframe (preview mode)
      if (window.self !== window.top) {
        setError(language === 'ar' 
          ? 'الدفع متاح فقط من التطبيق المنشور. يرجى نشر التطبيق أولاً.' 
          : 'Payment is only available from the published app. Please publish first.');
        setLoadingPlanId(null);
        return;
      }

      // Get plan details
      let planName = '';
      let planPrice = 0;
      let cycle = '';
      
      if (plan.id === 'golden') {
        planName = language === 'ar' ? 'العرض الذهبي' : 'Golden Offer';
        planPrice = plan.price;
        cycle = 'yearly'; // Use yearly for golden offer subscription
      } else {
        planName = language === 'ar' ? plan.name : plan.nameEn;
        // استخدام السعر حسب اختيار المستخدم (شهري أو سنوي)
        planPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
        cycle = billingCycle; // Use selected billing cycle
      }

      const fn = plan.id === "golden" ? "createMoyasarCheckout" : "createSubscriptionCheckout";
      const payload = {
        planName,
        planPrice,
        billingCycle: cycle,
        userEmail: user?.email,
        planId: plan.id,
      };
      if (plan.id !== "golden") {
        payload.features = plan.features;
      }

      const response = await Wadaq.functions.invoke(fn, payload);

      if (response.data?.redirect_path) {
        navigate(response.data.redirect_path);
        return;
      }

      if (response.data?.url || response.data?.checkout_url) {
        const checkoutUrl = response.data.url || response.data.checkout_url;
        window.location.href = checkoutUrl;
        return;
      }

      throw new Error(response.data?.error || "No checkout path received");
    } catch (error) {
      console.error('Subscription error full details:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.details 
        || error.response?.data?.error 
        || error.message 
        || (language === 'ar' ? 'حدث خطأ أثناء إنشاء جلسة الدفع' : 'Error creating checkout session');
      
      setError(errorMessage);
      
      // Show alert with detailed error
      alert(`${language === 'ar' ? 'خطأ في الاشتراك' : 'Subscription Error'}:\n\n${errorMessage}\n\n${language === 'ar' ? 'تحقق من Console للمزيد من التفاصيل' : 'Check Console for more details'}`);
    } finally {
      setLoadingPlanId(null);
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'الباقة الأساسية',
      nameEn: 'Basic',
      yearlyPrice: 599,
      monthlyPrice: 59,
      features: [
        'إصدار الفواتير الضريبية (A4 + حرارية)',
        'التوافق مع ZATCA (QR Code)',
        'إدارة العملاء والمنتجات',
        'تسجيل المصروفات',
        'إرسال الفاتورة عبر واتساب',
        'الدفع الجزئي للفواتير',
        'تقارير مبيعات أساسية',
        'دعم فني سريع',
      ],
      featuresEn: [
        'Tax Invoicing (A4 + Thermal)',
        'ZATCA Compliant (QR Code)',
        'Customer & Product Management',
        'Expense Tracking',
        'WhatsApp Invoice Sharing',
        'Partial Invoice Payments',
        'Basic Sales Reports',
        'Fast Technical Support',
      ],
      icon: Shield,
      color: 'from-blue-600 to-cyan-500',
      popular: false,
    },
    {
      id: 'advanced',
      name: 'الباقة المتقدمة',
      nameEn: 'Advanced',
      yearlyPrice: 1012,
      monthlyPrice: 99,
      features: [
        'جميع مزايا الأساسية',
        'عروض الأسعار والإشعارات الدائنة',
        'إدارة المخزون المتقدمة (دفعات)',
        'الموردون وأوامر الشراء',
        'سندات القبض والصرف',
        'الإقرار الضريبي VAT',
        'قائمة الأرباح والخسائر الرسمية',
        'إدارة الأصول الثابتة والاستهلاك',
        '50 عملية ذكاء اصطناعي شهرياً',
        'تصدير Excel',
      ],
      featuresEn: [
        'All Basic Features',
        'Quotations & Credit Notes',
        'Advanced Inventory (Batches)',
        'Suppliers & Purchase Orders',
        'Payment & Receipt Vouchers',
        'VAT Return Filing',
        'Official P&L Report',
        'Fixed Assets & Depreciation',
        '50 AI Operations/month',
        'Excel Export',
      ],
      icon: Sparkles,
      color: 'from-purple-600 to-violet-500',
      popular: false,
    },
    {
      id: 'smart',
      name: 'باقة الأعمال',
      nameEn: 'Business',
      yearlyPrice: 2030,
      monthlyPrice: 199,
      features: [
        'جميع مزايا المتقدمة',
        'إدارة الموارد البشرية والرواتب',
        'نقطة البيع (POS / كاشير)',
        'دفتر الأستاذ العام والقيود اليومية',
        'إدارة عقود العملاء والموردين',
        'واجهة برمجية API كاملة',
        'دعم متعدد المستخدمين',
        'ذكاء اصطناعي غير محدود',
        'استشارات محاسبية مجانية',
      ],
      featuresEn: [
        'All Advanced Features',
        'HR Management & Payroll',
        'Point of Sale (POS / Cashier)',
        'General Ledger & Journal Entries',
        'Customer & Supplier Contracts',
        'Full API Access',
        'Multi-User Support',
        'Unlimited AI Operations',
        'Free Accounting Consultations',
      ],
      icon: Rocket,
      color: 'from-emerald-600 to-teal-500',
      popular: false,
    },
  ];

  const goldenOffer = {
    id: 'golden',
    name: 'العرض الذهبي',
    nameEn: 'Golden Offer',
    price: 750,
    duration: '3 سنوات',
    durationEn: '3 Years',
    features: [
      'جميع مزايا الباقة الأساسية',
      'عروض الأسعار والإشعارات الدائنة',
      'إدارة المخزون المتقدمة (دفعات)',
      'الموردون وأوامر الشراء',
      'سندات القبض والصرف',
      'الإقرار الضريبي VAT',
      'قائمة الأرباح والخسائر الرسمية',
      'إدارة الأصول الثابتة والاستهلاك',
      '15 عملية ذكاء اصطناعي شهرياً',
      'تصدير Excel',
      'دعم فني سريع',
      'صالح لمدة 3 سنوات',
    ],
    featuresEn: [
      'All Basic Features',
      'Quotations & Credit Notes',
      'Advanced Inventory (Batches)',
      'Suppliers & Purchase Orders',
      'Payment & Receipt Vouchers',
      'VAT Return Filing',
      'Official P&L Report',
      'Fixed Assets & Depreciation',
      '15 AI Operations/month',
      'Excel Export',
      'Fast Technical Support',
      'Valid for 3 Years',
    ],
    icon: Crown,
    popular: true,
  };

  return (
    <div className="min-h-screen py-10 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
            {language === 'ar' ? 'اختر الباقة المناسبة لك' : 'Choose Your Perfect Plan'}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {language === 'ar' ? 'ابدأ رحلتك نحو إدارة مالية أفضل مع برنامج ودق المحاسبي' : 'Start your journey towards better financial management with Wadq'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Current Plan Status */}
        {user?.subscription_status === 'active' && (
          <Card className="mb-8 border-2 border-emerald-500 bg-emerald-50/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="font-semibold text-white">
                    {language === 'ar' ? 'اشتراكك نشط' : 'Your subscription is active'}
                  </p>
                  <p className="text-sm text-gray-200">
                    {user.subscription_end_date 
                      ? `${language === 'ar' ? 'ينتهي في' : 'Expires on'} ${new Date(user.subscription_end_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}`
                      : language === 'ar' ? 'اشتراك مدى الحياة' : 'Lifetime subscription'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-full p-1 inline-flex gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'شهري' : 'Monthly'}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'سنوي (وفّر 15%)' : 'Yearly (Save 15%)'}
            </button>
          </div>
        </div>

        {/* Golden Offer - Special Card */}
        <div className="relative mb-12">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-3xl blur-2xl opacity-40" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706, #92400e)' }} />
          
          <div className="relative rounded-3xl overflow-hidden border border-amber-400/40"
            style={{ background: 'linear-gradient(135deg, #1c1408 0%, #2d1f08 40%, #1a1206 100%)' }}>
            
            {/* Top shimmer line */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, #fcd34d, #f59e0b, transparent)' }} />

            {/* Stars background decoration */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute w-1 h-1 rounded-full bg-amber-300"
                  style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }} />
              ))}
            </div>

            <div className="relative p-8 md:p-10">
              {/* Badge row */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-amber-900"
                  style={{ background: 'linear-gradient(135deg, #fcd34d, #f59e0b)' }}>
                  <Crown className="w-3.5 h-3.5" />
                  {language === 'ar' ? '🏆 العرض الذهبي الحصري' : '🏆 Exclusive Golden Offer'}
                </span>
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  🔴 {language === 'ar' ? 'عدد محدود' : 'Limited Slots'}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left: info */}
                <div>
                  <h2 className="text-4xl font-black mb-2" style={{ background: 'linear-gradient(135deg, #fcd34d, #f59e0b, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {language === 'ar' ? goldenOffer.name : goldenOffer.nameEn}
                  </h2>
                  <p className="text-amber-300/80 text-sm mb-6">
                    {language === 'ar' ? 'دفعة واحدة — بلا رسوم شهرية — لمدة 3 سنوات كاملة' : 'One-time payment — No monthly fees — For 3 full years'}
                  </p>

                  <div className="flex items-end gap-3 mb-6">
                    <span className="text-7xl font-black leading-none" style={{ background: 'linear-gradient(135deg, #fcd34d, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {goldenOffer.price}
                    </span>
                    <div className="pb-2">
                      <p className="text-amber-200 font-bold text-lg">{language === 'ar' ? 'ريال' : 'SAR'}</p>
                      <p className="text-amber-400/70 text-xs">{language === 'ar' ? '≈ 21 ر.س / شهر فقط' : '≈ 21 SAR/month only'}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {(language === 'ar' ? goldenOffer.features : goldenOffer.featuresEn).map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                          <Check className="w-3 h-3 text-amber-900 font-bold" />
                        </div>
                        <span className="text-amber-100 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: CTA */}
                <div className="flex flex-col items-center gap-5">
                  <div className="text-center p-5 rounded-2xl border border-amber-500/30 w-full"
                    style={{ background: 'rgba(245, 158, 11, 0.08)' }}>
                    <p className="text-amber-300 text-xs mb-1">{language === 'ar' ? 'تجري بـ بدلاً من' : 'Instead of'}</p>
                    <p className="text-slate-400 line-through text-2xl font-bold">2,400 {language === 'ar' ? 'ر.س' : 'SAR'}</p>
                    <p className="text-amber-400 text-xs mt-1">⚡ {language === 'ar' ? 'وفّر أكثر من 68%' : 'Save over 68%'}</p>
                  </div>

                  <Button
                    onClick={() => handleSubscribe(goldenOffer)}
                    disabled={loadingPlanId !== null}
                    className="w-full py-6 text-lg font-bold rounded-2xl border-0 disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)'
                    }}
                  >
                    <Crown className="w-5 h-5 mr-2 inline text-amber-900" />
                    {loadingPlanId === 'golden'
                      ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...')
                      : (language === 'ar' ? 'احجز مقعدك الآن' : 'Claim Your Spot Now')}
                  </Button>

                  <p className="text-xs text-amber-400/60 text-center">
                    🔒 {language === 'ar' ? 'دفع آمن مشفر | Apple Pay & Google Pay' : 'Secure payment | Apple Pay & Google Pay'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom shimmer line */}
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b44, transparent)' }} />
          </div>
        </div>

        {/* Regular Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const currentPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            
            return (
              <Card 
                key={plan.id}
                className="relative overflow-hidden transition-all duration-300 hover:scale-105 border-2 border-white/10"
                style={{
                  background: 'rgba(20, 20, 40, 0.7)',
                }}
              >
                <CardHeader className="pt-8 pb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-2">
                    {language === 'ar' ? plan.name : plan.nameEn}
                  </CardTitle>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {currentPrice}
                    </span>
                    <span className="text-gray-300 text-lg">{language === 'ar' ? 'ريال' : 'SAR'}</span>
                    <span className="text-gray-300">
                      / {billingCycle === 'yearly' ? (language === 'ar' ? 'سنة' : 'year') : (language === 'ar' ? 'شهر' : 'month')}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-emerald-400 mt-2">
                      {language === 'ar' ? 'وفّر 15% مقارنة بالاشتراك الشهري' : 'Save 15% vs monthly'}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="pb-8">
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loadingPlanId !== null}
                    className="w-full mb-6 py-6 text-lg font-bold rounded-xl transition-all duration-300 disabled:opacity-50"
                    style={{
                      background: loadingPlanId === null ? `linear-gradient(to right, var(--tw-gradient-stops))` : undefined,
                      '--tw-gradient-from': plan.color.split(' ')[1],
                      '--tw-gradient-to': plan.color.split(' ')[3],
                    }}
                  >
                    {loadingPlanId === plan.id ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') : 
                     (language === 'ar' ? 'اشترك الآن' : 'Subscribe Now')}
                  </Button>

                  <div className="space-y-3">
                    {(language === 'ar' ? plan.features : plan.featuresEn).map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-gray-200">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card className="text-center p-6 bg-white/5 border-white/10">
            <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="font-bold text-white mb-2">
              {language === 'ar' ? 'آمن ومضمون' : 'Secure & Safe'}
            </h3>
            <p className="text-sm text-gray-200">
              {language === 'ar' ? 'تشفير على أعلى مستوى لحماية بياناتك' : 'Top-level encryption to protect your data'}
            </p>
          </Card>
          <Card className="text-center p-6 bg-white/5 border-white/10">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <h3 className="font-bold text-white mb-2">
              {language === 'ar' ? 'ذكاء اصطناعي متقدم' : 'Advanced AI'}
            </h3>
            <p className="text-sm text-gray-200">
              {language === 'ar' ? 'مساعد ذكي لإدارة أعمالك بفعالية' : 'Smart assistant for efficient business management'}
            </p>
          </Card>
          <Card className="text-center p-6 bg-white/5 border-white/10">
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="font-bold text-white mb-2">
              {language === 'ar' ? 'دعم متميز' : 'Premium Support'}
            </h3>
            <p className="text-sm text-gray-200">
              {language === 'ar' ? 'فريق دعم متاح على مدار الساعة' : '24/7 support team available'}
            </p>
          </Card>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="text-white border-white/20 hover:bg-white/10"
          >
            {language === 'ar' ? 'العودة' : 'Back'}
          </Button>
        </div>
      </div>
    </div>
  );
}