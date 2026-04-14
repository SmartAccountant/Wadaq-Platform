import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";
import { 
  Sparkles, 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Globe,
  HeartHandshake
} from "lucide-react";

export default function AboutPage({ embedded = false }) {
  const { language, isRTL } = useLanguage();

  const content = {
    ar: {
      hero: {
        title: "نظام محاسبي ذكي صُمم خصيصاً للسوق السعودي",
        subtitle: "حوّل عملك إلى تجربة رقمية سلسة مع نظام متكامل يجمع بين البساطة والاحترافية",
        cta: "ابدأ مجاناً"
      },
      story: {
        title: "قصتنا",
        text: "بدأت رحلتنا من فهم عميق لاحتياجات رواد الأعمال والتجار في المملكة. لاحظنا أن معظم الأنظمة المحاسبية إما معقّدة جداً أو لا تتوافق مع متطلبات السوق السعودي. لذا قررنا بناء حل محلي، سهل الاستخدام، ويلبي جميع المتطلبات النظامية بما في ذلك الفوترة الإلكترونية وضريبة القيمة المضافة."
      },
      mission: {
        title: "مهمتنا",
        text: "تمكين كل صاحب عمل في المملكة من إدارة حساباته بكل سهولة وثقة، مع الالتزام الكامل بالأنظمة المحلية وتوفير أدوات ذكية تساعد على نمو الأعمال."
      },
      features: [
        { icon: Zap, title: "سهل وسريع", description: "تصميم عصري وبديهي - أصدر فاتورتك الأولى في أقل من دقيقة دون أي تعقيدات" },
        { icon: Shield, title: "متوافق مع الزكاة والضريبة", description: "فواتير إلكترونية مطابقة 100% لمتطلبات هيئة الزكاة والضريبة والجمارك مع رمز QR تلقائي" },
        { icon: BarChart3, title: "تقارير ذكية", description: "تحليلات فورية لمبيعاتك وأرباحك مع رسوم بيانية واضحة تساعدك على اتخاذ القرارات الصحيحة" },
        { icon: Smartphone, title: "نظام كاشير متكامل", description: "كاشير احترافي للمطاعم والسوبر ماركت مع دعم الباركود والطباعة الحرارية" },
        { icon: TrendingUp, title: "إدارة مخزون ذكية", description: "تتبع دقيق للمخزون مع تنبيهات تلقائية عند نفاد الكميات وتقارير حركة المنتجات" },
        { icon: Users, title: "إدارة العملاء والموردين", description: "ملفات كاملة لعملائك مع سجل المشتريات وإمكانية إرسال الفواتير بالإيميل والواتساب" },
        { icon: Sparkles, title: "مساعد ذكي بالذكاء الاصطناعي", description: "مساعد محاسبي يحلل بياناتك ويعطيك توصيات ذكية لزيادة أرباحك" },
        { icon: Globe, title: "متعدد اللغات", description: "دعم كامل للعربية والإنجليزية مع إمكانية طباعة الفواتير بكلا اللغتين" },
        { icon: Clock, title: "سحابي وآمن 100%", description: "بياناتك محفوظة في السحابة مع نسخ احتياطية يومية - ادخل من أي مكان وأي جهاز" }
      ],
      plans: {
        title: "باقات مرنة تناسب حجم عملك",
        subtitle: "ابدأ بفترة تجريبية مجانية 10 أيام - بدون بطاقة ائتمانية",
        cta: "اختر باقتك"
      },
      why: {
        title: "لماذا تختار برنامج ودق المحاسبي؟",
        reasons: [
          { icon: CheckCircle2, text: "نظام محلي مصمم للسوق السعودي" },
          { icon: CheckCircle2, text: "متوافق 100% مع متطلبات الهيئات الحكومية" },
          { icon: CheckCircle2, text: "دعم فني سريع بالعربية عبر واتساب" },
          { icon: CheckCircle2, text: "تحديثات مستمرة ومجانية" },
          { icon: CheckCircle2, text: "بدون عقود طويلة - إلغاء في أي وقت" },
          { icon: CheckCircle2, text: "تكامل مع أنظمة الدفع الإلكتروني" }
        ]
      },
      cta: {
        title: "جاهز لتحويل عملك رقمياً؟",
        subtitle: "انضم لآلاف التجار الذين يديرون أعمالهم بثقة وسهولة",
        button: "ابدأ الآن مجاناً"
      },
      support: {
        title: "نحن معك في كل خطوة",
        text: "فريق الدعم الفني متواجد للإجابة على أسئلتك ومساعدتك في أي وقت",
        whatsapp: "تواصل معنا",
        email: "support@rikazai.com"
      }
    },
    en: {
      hero: {
        title: "Smart Accounting System Built for Saudi Market",
        subtitle: "Transform your business with an integrated system that combines simplicity and professionalism",
        cta: "Start Free"
      },
      story: {
        title: "Our Story",
        text: "Our journey began with a deep understanding of entrepreneurs and merchants needs in Saudi Arabia. We noticed that most accounting systems are either too complex or don't comply with local requirements. So we decided to build a local solution that's easy to use and meets all regulatory requirements including e-invoicing and VAT."
      },
      mission: {
        title: "Our Mission",
        text: "Empower every business owner in Saudi Arabia to manage their accounts easily and confidently, while fully complying with local regulations and providing smart tools that help businesses grow."
      },
      features: [
        { icon: Zap, title: "Easy & Fast", description: "Modern and intuitive design - issue your first invoice in less than a minute without complications" },
        { icon: Shield, title: "ZATCA Compliant", description: "Electronic invoices 100% compliant with ZATCA requirements with automatic QR code generation" },
        { icon: BarChart3, title: "Smart Reports", description: "Instant analytics for your sales and profits with clear charts to help you make the right decisions" },
        { icon: Smartphone, title: "Complete POS System", description: "Professional cashier for restaurants and supermarkets with barcode support and thermal printing" },
        { icon: TrendingUp, title: "Smart Inventory Management", description: "Accurate inventory tracking with automatic alerts for low stock and product movement reports" },
        { icon: Users, title: "Customer & Supplier Management", description: "Complete customer files with purchase history and ability to send invoices via email and WhatsApp" },
        { icon: Sparkles, title: "AI Assistant", description: "Accounting assistant that analyzes your data and gives you smart recommendations to increase profits" },
        { icon: Globe, title: "Multilingual", description: "Full support for Arabic and English with ability to print invoices in both languages" },
        { icon: Clock, title: "100% Cloud & Secure", description: "Your data is stored in the cloud with daily backups - access from anywhere, any device" }
      ],
      plans: {
        title: "Flexible Plans That Fit Your Business",
        subtitle: "Start with 10 days free trial - no credit card required",
        cta: "Choose Your Plan"
      },
      why: {
        title: "Why Choose Wadq Accounting Software?",
        reasons: [
          { icon: CheckCircle2, text: "Local system designed for Saudi market" },
          { icon: CheckCircle2, text: "100% compliant with government requirements" },
          { icon: CheckCircle2, text: "Fast Arabic technical support via WhatsApp" },
          { icon: CheckCircle2, text: "Continuous free updates" },
          { icon: CheckCircle2, text: "No long contracts - cancel anytime" },
          { icon: CheckCircle2, text: "Integration with payment gateways" }
        ]
      },
      cta: {
        title: "Ready to Digitize Your Business?",
        subtitle: "Join thousands of merchants managing their business with confidence and ease",
        button: "Start Now for Free"
      },
      support: {
        title: "We're With You Every Step",
        text: "Our technical support team is available to answer your questions anytime",
        whatsapp: "Contact Us",
        email: "support@rikazai.com"
      }
    }
  };

  const t = content[language];

  return (
    <div className={embedded ? "max-h-[min(80vh,840px)] overflow-y-auto overscroll-contain rounded-b-lg bg-slate-950" : "min-h-screen"}>
      {/* Hero Section */}
      <div className="relative overflow-hidden py-24" style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)"
      }}>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-20 w-80 h-80 bg-purple-400 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-violet-500 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
            style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", color: "#c4b5fd" }}>
            <Sparkles className="w-4 h-4" />
            برنامج ودق المحاسبي
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            {t.hero.title}
          </h1>
          <p className="text-xl mb-10 max-w-3xl mx-auto leading-relaxed" style={{ color: "#c4b5fd" }}>
            {t.hero.subtitle}
          </p>
          <Link to={createPageUrl('Subscription')}>
            <Button className="h-14 px-10 text-lg font-bold text-white rounded-2xl"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
              {t.hero.cta} <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-14">

        {/* Story */}
        <Card className="p-8 border-0 shadow-xl" style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #2d2670 100%)",
          border: "1px solid rgba(124,58,237,0.25)"
        }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.25)" }}>
              <HeartHandshake className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-3xl font-bold text-white">{t.story.title}</h2>
          </div>
          <p className="text-lg leading-relaxed" style={{ color: "#c4b5fd" }}>{t.story.text}</p>
        </Card>

        {/* Mission */}
        <Card className="p-8 border-0 shadow-xl" style={{
          background: "linear-gradient(135deg, #3b0764 0%, #4c1d95 100%)",
          border: "1px solid rgba(167,139,250,0.3)"
        }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(167,139,250,0.2)" }}>
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <h2 className="text-3xl font-bold text-white">{t.mission.title}</h2>
          </div>
          <p className="text-lg leading-relaxed" style={{ color: "#ddd6fe" }}>{t.mission.text}</p>
        </Card>

        {/* Features */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-3">{language === 'ar' ? 'مميزات النظام' : 'System Features'}</h2>
            <p className="text-lg" style={{ color: "#a78bfa" }}>{language === 'ar' ? 'كل ما تحتاجه لإدارة عملك بنجاح' : 'Everything you need to manage your business successfully'}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.features.map((feature, idx) => (
              <div key={idx} className="rounded-2xl p-6 transition-all duration-300 group hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, rgba(30,27,75,0.9) 0%, rgba(45,38,112,0.9) 100%)",
                  border: "1px solid rgba(124,58,237,0.2)",
                  boxShadow: "0 4px 24px rgba(124,58,237,0.08)"
                }}>
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.2)" }}>
                  <feature.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p style={{ color: "#a78bfa" }} className="text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="rounded-3xl p-10" style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          border: "1px solid rgba(124,58,237,0.3)"
        }}>
          <h2 className="text-3xl font-black text-white text-center mb-10">{t.why.title}</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {t.why.reasons.map((reason, idx) => (
              <div key={idx} className="flex items-center gap-4 rounded-xl p-4"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(124,58,237,0.3)" }}>
                  <CheckCircle2 className="w-5 h-5 text-violet-300" />
                </div>
                <span className="text-white font-medium">{reason.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plans CTA */}
        <div className="rounded-3xl p-12 text-center" style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)",
          boxShadow: "0 20px 60px rgba(124,58,237,0.4)"
        }}>
          <h2 className="text-3xl font-black text-white mb-3">{t.plans.title}</h2>
          <p className="text-purple-100 text-lg mb-8">{t.plans.subtitle}</p>
          <Link to={createPageUrl('Subscription')}>
            <Button className="h-14 px-10 text-lg font-bold rounded-2xl"
              style={{ background: "white", color: "#6d28d9" }}>
              {t.plans.cta} <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>

        {/* Support */}
        <div className="rounded-3xl p-10 text-center" style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #2d2670 100%)",
          border: "1px solid rgba(124,58,237,0.25)"
        }}>
          <h2 className="text-3xl font-black text-white mb-4">{t.support.title}</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: "#c4b5fd" }}>{t.support.text}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="https://wa.me/966500070065" target="_blank" rel="noopener noreferrer">
              <Button className="h-12 px-8 font-bold rounded-xl"
                style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", color: "white" }}>
                {t.support.whatsapp} 📱
              </Button>
            </a>
            <a href="mailto:support@rikazai.com">
              <Button variant="outline" className="h-12 px-8 rounded-xl font-bold"
                style={{ borderColor: "rgba(167,139,250,0.4)", color: "#c4b5fd", background: "rgba(124,58,237,0.1)" }}>
                {t.support.email} ✉️
              </Button>
            </a>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center py-12">
          <h2 className="text-4xl font-black text-white mb-4">{t.cta.title}</h2>
          <p className="text-xl mb-10" style={{ color: "#a78bfa" }}>{t.cta.subtitle}</p>
          <Link to={createPageUrl('Subscription')}>
            <Button className="h-16 px-12 text-xl font-black rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                boxShadow: "0 10px 40px rgba(124,58,237,0.5)"
              }}>
              {t.cta.button} ✨
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}