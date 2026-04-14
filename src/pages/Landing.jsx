import React, { useState, useEffect } from "react";
import AppDemoAnimation from "@/components/landing/AppDemoAnimation";
import { useNavigate } from "react-router-dom";
import { Wadaq } from "@/api/WadaqCore";
import { Button } from "@/components/ui/button";
import {
  Check, FileText, Bot, Zap, ArrowLeft, Shield, BarChart3,
  Users, Printer, Package, Wallet, Receipt, TrendingUp, Award,
  ChevronDown, Smartphone
} from "lucide-react";
export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [subscribersCount, setSubscribersCount] = React.useState(0);
  const [openFaq, setOpenFaq] = React.useState(null);
  const MAX_FOUNDERS = 1500;

  React.useEffect(() => {
    document.title = 'برنامج ودق المحاسبي';
    Wadaq.auth.isAuthenticated().then(isAuth => {
      if (isAuth) navigate("/Dashboard");
    }).catch(() => {});

    Wadaq.entities.FounderSubscription.list().then(subs => {
      setSubscribersCount(subs.length);
    }).catch(() => {});
  }, [navigate]);

  const handleStartTrial = async () => {
    if (!agreedToTerms) {
      alert("يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة");
      return;
    }
    setLoading(true);
    try {
      const isAuth = await Wadaq.auth.isAuthenticated();
      if (isAuth) navigate("/Dashboard");
      else Wadaq.auth.redirectToLogin("/Dashboard");
    } catch {
      Wadaq.auth.redirectToLogin("/Dashboard");
    }
  };

  const handleFounderPurchase = async () => {
    if (!agreedToTerms) {
      alert("يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة");
      return;
    }
    setLoading(true);
    try {
      const isAuth = await Wadaq.auth.isAuthenticated();
      if (!isAuth) { Wadaq.auth.redirectToLogin("/Landing"); return; }
      const response = await Wadaq.functions.invoke('createCheckoutSession', {
        success_url: `${window.location.origin}/checkout?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/Landing?canceled=true`
      });
      if (response.data.error) { alert(response.data.error); setLoading(false); return; }
      window.location.href = response.data.url;
    } catch {
      alert("حدث خطأ أثناء إنشاء جلسة الدفع. يرجى المحاولة مرة أخرى.");
      setLoading(false);
    }
  };

  const features = [
    { icon: FileText, title: "فواتير إلكترونية مع رمز QR", desc: "إصدار فواتير إلكترونية مع رمز QR تلقائي وفق متطلبات هيئة الزكاة والضريبة", color: "bg-blue-100 text-blue-600" },
    { icon: Bot, title: "مستشار مالي بالذكاء الاصطناعي", desc: "محادثة طبيعية مع مستشارك المالي الذكي — يحلل أرباحك ويقترح قرارات استراتيجية", color: "bg-purple-100 text-purple-600" },
    { icon: Shield, title: "أمان مصرفي للبيانات", desc: "تشفير AES-256 ونسخ احتياطي تلقائي يومياً — بياناتك محمية بنفس معايير البنوك", color: "bg-emerald-100 text-emerald-600" },
    { icon: BarChart3, title: "تقارير تحليلية متقدمة", desc: "لوحة تحكم تفاعلية تعرض الأرباح والمصروفات والضرائب بمخططات بيانية واضحة", color: "bg-orange-100 text-orange-600" },
    { icon: Users, title: "إدارة العملاء والموردين", desc: "سجل متكامل للعملاء والموردين مع تتبع الديون والمطالبات", color: "bg-rose-100 text-rose-600" },
    { icon: Package, title: "إدارة المخزون الذكية", desc: "تتبع الكميات وتنبيهات النقص التلقائية مع إدارة الدفعات وتواريخ الصلاحية", color: "bg-indigo-100 text-indigo-600" },
    { icon: Printer, title: "طباعة حرارية وكاشير POS", desc: "نظام نقاط بيع متكامل مع دعم الطابعات الحرارية وقراءة الباركود", color: "bg-teal-100 text-teal-600" },
    { icon: Receipt, title: "الموارد البشرية والرواتب", desc: "إدارة الموظفين والحضور ومسير الرواتب مع احتساب التأمينات الاجتماعية تلقائياً", color: "bg-violet-100 text-violet-600" },
  ];

  const stats = [
    { value: "100%", label: "متوافق مع ZATCA" },
    { value: "+15", label: "وحدة متكاملة" },
    { value: "10", label: "أيام تجريب مجاني" },
    { value: "24/7", label: "دعم فني مستمر" },
  ];

  const tools = [
    { label: "🧮 حاسبة ضريبة القيمة المضافة", path: "/VATCalculator", desc: "احسب VAT مجاناً بدون تسجيل" },
  ];

  const faqs = [
    { q: "هل النظام متوافق مع هيئة الزكاة والضريبة؟", a: "النظام يدعم إصدار الفواتير الإلكترونية مع رمز QR وفق متطلبات ZATCA للمرحلة الأولى. ونعمل على استكمال متطلبات الربط مع المرحلة الثانية." },
    { q: "كيف أبدأ؟", a: "اضغط على 'ابدأ تجربتك المجانية' وسجل دخولك بحساب Google أو البريد الإلكتروني — لا يلزم بطاقة ائتمان." },
    { q: "هل يمكنني استيراد بياناتي القديمة؟", a: "نعم، يدعم النظام استيراد البيانات من ملفات Excel وCSV لنقل عملائك ومنتجاتك بسهولة." },
    { q: "هل يعمل على الجوال؟", a: "نعم، النظام متجاوب تماماً مع جميع الأجهزة ويمكن تثبيته كتطبيق على iOS وAndroid." },
  ];

  const progressWidth = Math.min((subscribersCount / MAX_FOUNDERS) * 100, 100);

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900 overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Wadaq-prod/public/6971dab01aac952606d6505f/5c1b2ad18_92490488-9162-457f-ad0c-6b04cd984bf6.png"
            alt="برنامج ودق المحاسبي" className="h-10 object-contain"
          />
          <div className="flex items-center gap-3">
            <button onClick={() => Wadaq.auth.redirectToLogin("/Dashboard")} className="text-slate-500 hover:text-slate-800 text-sm transition-colors">
              تسجيل الدخول
            </button>
            <Button onClick={handleStartTrial} className="bg-slate-900 hover:bg-slate-700 text-white text-sm">
              ابدأ مجاناً
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex flex-wrap justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
              <Zap className="w-4 h-4" />
              مدعوم بأحدث تقنيات الذكاء الاصطناعي
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
              <Smartphone className="w-4 h-4" />
              يعمل على الجوال iOS & Android
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-black leading-tight tracking-tight text-slate-900">
            برنامج ودق المحاسبي
            <span className="block mt-2 text-2xl sm:text-3xl font-light text-slate-400 tracking-widest">
              Wadq Accounting Software
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-500 leading-relaxed">
            من الفاتورة الإلكترونية إلى الرواتب — كل ما تحتاجه لإدارة أعمالك في مكان واحد.
            <br />
            <span className="text-blue-600 font-semibold">متوافق 100% مع هيئة الزكاة والضريبة والجمارك.</span>
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center bg-white border border-slate-200 shadow-sm">
                <div className="text-2xl font-black text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-500">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer accent-slate-800"
              />
              أوافق على{' '}
              <button type="button" onClick={() => navigate("/terms")} className="underline text-blue-600 hover:text-blue-500">الشروط والأحكام</button>
              {' '}و{' '}
              <button type="button" onClick={() => navigate("/privacy")} className="underline text-blue-600 hover:text-blue-500">سياسة الخصوصية</button>
            </label>

            <Button
              onClick={handleStartTrial}
              disabled={loading || !agreedToTerms}
              className="bg-slate-900 hover:bg-slate-700 text-white px-10 py-6 text-lg font-bold rounded-2xl disabled:opacity-40"
            >
              {loading ? "جاري التحميل..." : "ابدأ تجربتك المجانية"}
              <ArrowLeft className="inline w-5 h-5 mr-2" />
            </Button>
            <p className="text-xs text-slate-400">لا يلزم بطاقة ائتمان • 10 أيام مجاناً</p>
          </div>
        </div>

        <div className="flex justify-center mt-12 text-slate-300 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* FREE TOOLS BANNER */}
      <section className="py-4 px-6 bg-blue-50 border-y border-blue-100">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="text-blue-700 font-bold">🎁 أدوات مجانية:</span>
          {tools.map((tool, i) => (
            <button
              key={i}
              onClick={() => navigate(tool.path)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-blue-200 text-blue-700 hover:bg-blue-700 hover:text-white transition-colors font-medium"
            >
              {tool.label}
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </section>

      {/* APP DEMO */}
      <section className="bg-slate-50 py-4">
        <AppDemoAnimation />
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
              <Award className="w-4 h-4" />
              مميزات النظام
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-slate-500 max-w-xl mx-auto">منظومة متكاملة من الأدوات المحاسبية والإدارية المصممة خصيصاً للسوق السعودي</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 bg-white">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-slate-800 font-bold mb-2 text-sm">{f.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">ابدأ في 3 خطوات</h2>
            <p className="text-slate-500">إعداد سريع لا يستغرق أكثر من 5 دقائق</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { title: "سجّل حسابك", desc: "بـ Google أو البريد الإلكتروني — مجاناً خلال ثوانٍ", icon: Users },
              { title: "أعدّ بياناتك", desc: "أدخل معلومات شركتك وأضف منتجاتك وعملاءك", icon: Package },
              { title: "ابدأ العمل", desc: "أصدر فاتورتك الأولى واستمتع بتقارير فورية", icon: TrendingUp },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto">
                    <item.icon className="w-7 h-7 text-slate-700" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-slate-800 font-bold text-lg">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900">أسئلة شائعة</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white border border-slate-200">
                <button
                  className="w-full flex items-center justify-between p-6 text-right text-slate-800 font-semibold hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 mr-4 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-slate-500 text-sm leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-3xl p-12 bg-slate-900 text-white">
            <h2 className="text-3xl font-black mb-3">جاهز للبدء مع ودق؟</h2>
            <p className="text-slate-400 mb-8 text-sm">انضم لآلاف الشركات التي تثق في برنامج ودق المحاسبي لإدارة أعمالها</p>
            <Button
              onClick={() => Wadaq.auth.redirectToLogin("/Dashboard")}
              className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-5 text-lg font-bold rounded-2xl"
            >
              ابدأ تجربتك المجانية الآن
              <ArrowLeft className="inline w-5 h-5 mr-2" />
            </Button>
            <p className="text-xs text-slate-500 mt-4">لا يلزم بطاقة ائتمان • 10 أيام تجريب مجاني • إلغاء في أي وقت</p>
          </div>
        </div>
      </section>

    </div>
  );
}