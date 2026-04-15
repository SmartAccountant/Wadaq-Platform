import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Shield,
  BarChart3,
  Users,
  Package,
  Wallet,
  Printer,
  ArrowLeft,
  ChevronDown,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const NAVY = "#1a3a5c";
const NAVY_DEEP = "#0f2744";
const GOLD = "#c9a227";

const coreFeatures = [
  {
    icon: FileText,
    title: "فواتير إلكترونية وZATCA",
    desc: "إصدار فواتير مع رمز QR وفق متطلبات هيئة الزكاة والضريبة والجمارك.",
  },
  {
    icon: BarChart3,
    title: "لوحة تحكم وتقارير",
    desc: "مبيعات، أرباح، ضرائب، ومؤشرات واضحة لاتخاذ القرار.",
  },
  {
    icon: Users,
    title: "عملاء وموردون",
    desc: "إدارة العلاقات والذمم والمطالبات من مكان واحد.",
  },
  {
    icon: Package,
    title: "مخزون ومنتجات",
    desc: "تتبع الكميات والتسعير والباركود بسهولة.",
  },
  {
    icon: Wallet,
    title: "محاسبة ومصروفات",
    desc: "سندات، مصروفات، وذمم مالية متكاملة مع نشاطك.",
  },
  {
    icon: Printer,
    title: "كاشير وطباعة",
    desc: "نقاط بيع وطابعات حرارية لتجربة بيع سلسة.",
  },
  {
    icon: Sparkles,
    title: "ذكاء اصطناعي محاسبي",
    desc: "مساعد ذكي يفهم سياق «ودق» ويجيب بالعربية — من الاستفسارات العامة إلى التحليل المحاسبي عند الحاجة.",
  },
];

const highlights = [
  "ربط مع متطلبات الفوترة الإلكترونية (مرحلة أولى — QR)",
  "مساعد ذكاء اصطناعي يتحدث العربية بخصوص ودق",
  "سهولة استخدام وواجهة عربية كاملة (RTL)",
];

const faqs = [
  {
    q: "هل برنامج ودق «معتمد» من هيئة الزكاة والضريبة والجمارك؟",
    a: "البرنامج يدعم إصدار فواتير إلكترونية وفق متطلبات المرحلة الأولى (مثل رمز الاستجابة السريعة QR) كما هو شائع في أنظمة السوق. الاعتماد النهائي أو أي اشتراطات إضافية تختلف بحسب نشاطك؛ يُنصح دائماً بالتحقق من بوابة الهيئة ومتطلبات نشاطك الخاص.",
  },
  {
    q: "هل يدعم الفاتورة الإلكترونية ومتطلبات ZATCA؟",
    a: "نعم، يوفّر ودق مساراً لإصدار فواتير إلكترونية مع رمز QR وحقول تتوافق مع ممارسات المرحلة الأولى. للربط الكامل أو المراحل اللاحقة، تابع تحديثات المنصّة ومتطلبات الهيئة لنشاطك.",
  },
  {
    q: "كيف يتم الاشتراك أو التجربة؟",
    a: "يمكنك إنشاء حساب والبدء بفترة تجريبية عند توفرها في خطتك، ثم اختيار خطة الاشتراك من داخل النظام أو صفحة الأسعار حسب ما يعرض لحسابك. لا حاجة لبطاقة في كثير من حالات البداية؛ التفاصيل تظهر قبل أي دفع.",
  },
  {
    q: "ما دور الذكاء الاصطناعي في ودق؟",
    a: "مساعد ذكي يعمل كخبير محاسبي لسياق برنامج ودق: يجيب بالعربية عن الميزات والاستفسارات العامة، ويمكن ربطه بمحركات متقدمة للأسئلة المحاسبية الأعمق عند تفعيل المفاتيح في بيئة النشر.",
  },
  {
    q: "هل برنامج ودق مناسب للمنشآت الصغيرة؟",
    a: "نعم. واجهة مبسّطة للبدء السريع مع أدوات للمبيعات والمخزون والتقارير تنمو مع توسّع عملك.",
  },
  {
    q: "كيف أبدأ استخدام النظام؟",
    a: "اضغط «ابدأ رحلتك المحاسبية» أو «إنشاء حساب»، سجّل بالبريد وكلمة المرور أو Google، ثم أكمل بيانات منشأتك من الإعدادات وابدأ إصدار الفواتير والتقارير.",
  },
  {
    q: "هل أحتاج بطاقة ائتمان للتجربة؟",
    a: "غالباً يمكن البدء دون بطاقة؛ تظهر شروط الدفع عند اختيار خطة مدفوعة داخل النظام.",
  },
  {
    q: "هل بياناتي محمية؟",
    a: "يُنصح باستخدام كلمة مرور قوية وتفعيل أفضل الممارسات لدى فريقك. التفاصيل الفنية والالتزامات تُعرَض في سياسة الخصوصية وشروط الاستخدام.",
  },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.title = "برنامج ودق المحاسبي | WADAQ";
  }, []);

  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden text-slate-900" style={{ background: "#eef1f6" }}>
      {/* شريط علوي */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          background: "rgba(26, 58, 92, 0.92)",
          borderColor: "rgba(201, 162, 39, 0.35)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0"
              style={{ background: GOLD, color: NAVY_DEEP }}
            >
              ودق
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-base leading-tight truncate">برنامج ودق المحاسبي</p>
              <p className="text-[10px] sm:text-xs font-medium truncate" style={{ color: "rgba(201,162,39,0.95)" }}>
                WADAQ SYSTEM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/login"
              className="text-sm font-semibold px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              تسجيل الدخول
            </Link>
            <Button
              asChild
              className="font-bold text-white border-0 shadow-md hidden sm:inline-flex"
              style={{ background: GOLD, color: NAVY_DEEP, boxShadow: "0 2px 0 rgba(0,0,0,0.15)" }}
            >
              <Link to="/signup">إنشاء حساب</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* هيرو */}
      <section
        className="relative px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24 overflow-hidden"
        style={{
          background: `linear-gradient(165deg, ${NAVY} 0%, ${NAVY_DEEP} 55%, #152a45 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, ${GOLD} 0, transparent 45%), radial-gradient(circle at 80% 60%, ${GOLD} 0, transparent 40%)`,
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium text-slate-200"
            style={{ borderColor: "rgba(201,162,39,0.4)", background: "rgba(0,0,0,0.2)" }}
          >
            <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
            هيكل زكوي، فوترة إلكترونية، وذكاء اصطناعي يفهم ودق
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.15] tracking-tight">
            أدر أعمالك بثقة مع{" "}
            <span style={{ color: GOLD }}>برنامج ودق المحاسبي</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            من الفاتورة الإلكترونية إلى التقارير والضرائب — أدوات عملية بأسلوب واضح، متوافقة مع توجهات السوق السعودي،
            ومصممة لتوفير الوقت وتقليل الأخطاء في يومك المحاسبي.
          </p>

          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400 max-w-xl mx-auto">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
                {h}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto min-w-[280px] h-14 sm:h-16 text-lg font-black rounded-2xl border-0 shadow-xl px-10"
              style={{
                background: GOLD,
                color: NAVY_DEEP,
                boxShadow: `0 4px 24px rgba(201, 162, 39, 0.35)`,
              }}
            >
              <Link to="/login" className="gap-2">
                ابدأ رحلتك المحاسبية
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <p className="text-xs text-slate-500 max-w-xs text-center sm:text-right">
              بالمتابعة تؤكد الاطلاع على{" "}
              <Link to="/terms" className="underline underline-offset-2 hover:text-slate-300">
                الشروط
              </Link>{" "}
              و{" "}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-slate-300">
                الخصوصية
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ميزات أساسية */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black" style={{ color: NAVY }}>
              ميزات أساسية تدعم عملك يومياً
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
              ودق يجمع ما تحتاجه للفوترة والمتابعة المالية دون تعقيد — بنفس ألوان لوحة التحكم التي تعرفها (الأزرق الداكن والذهبي).
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {coreFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6 border bg-white shadow-sm hover:shadow-md transition-shadow"
                style={{ borderColor: "rgba(26, 58, 92, 0.12)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(26, 58, 92, 0.08)", color: NAVY }}
                >
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Button
              asChild
              variant="outline"
              className="font-bold border-2 rounded-xl px-8 py-6 h-auto"
              style={{ borderColor: NAVY, color: NAVY }}
            >
              <Link to="/VATCalculator">حاسبة ضريبة القيمة المضافة — مجاناً</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* الأسئلة المتكررة — أسفل الصفحة */}
      <section className="py-14 px-4 sm:px-6 border-t bg-white/90" style={{ borderColor: "rgba(26,58,92,0.08)" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-2" style={{ color: NAVY }}>
            الأسئلة المتكررة
          </h2>
          <p className="text-center text-sm text-slate-600 mb-10 max-w-xl mx-auto">
            أهم الاستفسارات من العملاء المحتملين حول البرنامج، الاشتراك، والفوترة الإلكترونية.
          </p>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                className="rounded-xl border overflow-hidden bg-white"
                style={{ borderColor: "rgba(26, 58, 92, 0.12)" }}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-3 p-4 text-right font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ختام */}
      <section
        className="py-16 px-4 sm:px-6"
        style={{
          background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`,
        }}
      >
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <Shield className="w-10 h-10 mx-auto opacity-90" style={{ color: GOLD }} />
          <h2 className="text-2xl sm:text-3xl font-black text-white">جاهز للانطلاق؟</h2>
          <p className="text-slate-400 text-sm">
            سجّل الدخول أو أنشئ حساباً جديداً وابدأ تنظيم محاسبتك في دقائق.
          </p>
          <Button
            asChild
            size="lg"
            className="font-black text-lg h-14 px-10 rounded-2xl border-0"
            style={{ background: GOLD, color: NAVY_DEEP }}
          >
            <Link to="/login">ابدأ رحلتك المحاسبية</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
