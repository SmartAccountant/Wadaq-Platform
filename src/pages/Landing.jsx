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
    title: "الفوترة الإلكترونية والامتثال الضريبي",
    desc: "إصدار فواتير إلكترونية وفق متطلبات المرحلة الأولى الصادرة عن هيئة الزكاة والضريبة والجمارك، بما يعزز انضباط السجلات المالية.",
  },
  {
    icon: BarChart3,
    title: "لوحات معلومات وتقارير مؤسسية",
    desc: "مؤشرات ومخرجات تُسهم في رصد الأداء المالي واتخاذ القرار وفق بيانات منظّمة.",
  },
  {
    icon: Users,
    title: "إدارة العملاء والموردين",
    desc: "تسجيل العلاقات التعاقدية والذمم والمطالبات ضمن إطار عمل موحّد.",
  },
  {
    icon: Package,
    title: "المخزون والأصناف",
    desc: "متابعة الكميات والتسعير ووسائل التعريف بما يتوافق مع سياسات المنشأة.",
  },
  {
    icon: Wallet,
    title: "المحاسبة والمصروفات",
    desc: "معالجة السندات والمصروفات والذمم المالية بما ينسجم مع دورة العمل المحاسبية.",
  },
  {
    icon: Printer,
    title: "نقاط البيع والطباعة",
    desc: "دعم بيئات البيع والطباعة الحرارية بما يلائم متطلبات التشغيل الميداني.",
  },
  {
    icon: Sparkles,
    title: "الذكاء الاصطناعي في خدمة الانضباط المالي",
    desc: "أدوات تحليل وتدقيق تسهم في تقليل الأخطاء التشغيلية ودعم التقارير التحليلية.",
  },
];

const highlights = [
  "الالتزام بمتطلبات الفوترة الإلكترونية (المرحلة الأولى) وفق الأنظمة المعمول بها",
  "دعم تقني وتقنيات تحليلية في إطار مهني يخدم متطلبات المنشآت",
  "واجهات عربية كاملة وتجربة استخدام منضبطة (دعم اتجاه RTL)",
];

const faqs = [
  {
    q: "ما هي حالة اعتماد برنامج ودق لدى هيئة الزكاة والضريبة والجمارك؟",
    a: "يؤكد نظام ودق المحاسبي التزامه التام بمتطلبات الفوترة الإلكترونية (المرحلة الأولى) الصادرة عن هيئة الزكاة والضريبة والجمارك. ويتم تحديث النظام دورياً لضمان التوافق مع كافة المعايير واللوائح الضريبية المحدثة في المملكة.",
  },
  {
    q: "هل يتطلب تشغيل النظام خبرة محاسبية سابقة؟",
    a: "صُممت واجهات النظام لتقديم تجربة مستخدم تتسم بالكفاءة والوضوح، مما يتيح للمنشآت إدارة عملياتها المالية دون الحاجة لمتطلبات محاسبية معقدة، مع توفر دعم فني وتقني متكامل لضمان سير العمل.",
  },
  {
    q: "ما هي القيمة المضافة لتقنيات الذكاء الاصطناعي في النظام؟",
    a: "يعمل محرك الذكاء الاصطناعي كأداة تدقيق وتحليل متقدمة؛ حيث يساهم في أتمتة تصنيف القيود المحاسبية، وتوليد التقارير التحليلية بدقة عالية، وتقليل هامش الخطأ البشري في المعالجات المالية.",
  },
  {
    q: "ما هي معايير أمن المعلومات وحماية البيانات المتبعة؟",
    a: "تضع منصة ودق أمن البيانات في مقدمة أولوياتها؛ حيث يتم تشفير البيانات وتخزينها في بيئات سحابية محمية وفق بروتوكولات الأمن السيبراني المعتمدة، بما يضمن سرية المعلومات والامتثال لسياسات حماية البيانات الوطنية.",
  },
  {
    q: "هل تتوفر نسخة تجريبية لتقييم الحلول المقدمة؟",
    a: "تتيح المنصة إمكانية الوصول التجريبي لفترة محددة، وذلك لتمكين أصحاب المنشآت من تقييم جودة الحلول المحاسبية والميزات التقنية قبل اعتماد الاشتراك النهائي، دون اشتراط وسائل دفع مسبقة.",
  },
  {
    q: "كيف تتم معالجة ضريبة القيمة المضافة والتقارير المالية؟",
    a: "يقوم النظام بمعالجة ضريبة القيمة المضافة آلياً وفق النسب المقررة نظاماً، ويصدر تقارير مالية تفصيلية تشمل (الإقرارات الضريبية، الميزانية العمومية، وقائمة الأرباح والخسائر) بما يتوافق مع المعايير المحاسبية الدولية.",
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
            منصة محاسبية تدعم الامتثال للأنظمة الضريبية المعمول بها في المملكة العربية السعودية
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.15] tracking-tight">
            حلول مؤسسية لإدارة العمليات المالية عبر{" "}
            <span style={{ color: GOLD }}>برنامج ودق المحاسبي</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            يوفّر النظام أدوات منضبطة للفوترة الإلكترونية والتقارير والالتزامات الضريبية، بما ينسجم مع الممارسات المهنية
            والمتطلبات الرائجة في بيئة الأعمال بالمملكة، وبما يعزز دقة السجلات وسرعة إنجاز المهام المحاسبية.
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
                الدخول إلى المنصّة
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <p className="text-xs text-slate-500 max-w-xs text-center sm:text-right leading-relaxed">
              يُرجى الاطلاع على{" "}
              <Link to="/terms" className="underline underline-offset-2 hover:text-slate-300">
                الشروط والأحكام
              </Link>{" "}
              و{" "}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-slate-300">
                سياسة الخصوصية
              </Link>
              قبل المتابعة.
            </p>
          </div>
        </div>
      </section>

      {/* ميزات أساسية */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black" style={{ color: NAVY }}>
              الميزات الأساسية للمنصّة
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
              مجموعة موحّدة من الوحدات تدعم دورة العمل المحاسبي والمالي للمنشآت، ضمن واجهة مؤسسية بألوان الهوية المعتمدة للنظام.
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

      {/* الأسئلة الشائعة — أسفل الصفحة */}
      <section className="py-14 px-4 sm:px-6 border-t bg-white/90" style={{ borderColor: "rgba(26,58,92,0.08)" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-2" style={{ color: NAVY }}>
            الأسئلة الشائعة
          </h2>
          <p className="text-center text-sm text-slate-600 mb-10 max-w-xl mx-auto leading-relaxed">
            إجابات موجزة ضمن الإطار الرسمي للمعلومات المتعلقة بمنصّة ودق المحاسبي والمتطلبات النظامية والمهنية في المملكة العربية السعودية.
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
                  <span className="text-right text-sm sm:text-base leading-snug break-words">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-slate-700 leading-relaxed border-t border-slate-100 pt-3 text-justify">
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
          <h2 className="text-2xl sm:text-3xl font-black text-white">البدء في استخدام المنصّة</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            يمكن للمنشآت إنشاء حساب مستخدم أو تسجيل الدخول لاستكمال إجراءات التفعيل والاطلاع على الخدمات المتاحة وفق سياسات الاستخدام المعتمدة.
          </p>
          <Button
            asChild
            size="lg"
            className="font-black text-lg h-14 px-10 rounded-2xl border-0"
            style={{ background: GOLD, color: NAVY_DEEP }}
          >
            <Link to="/login">الدخول إلى المنصّة</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
