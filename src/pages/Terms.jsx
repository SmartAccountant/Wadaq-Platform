import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageContext";
import {
  FileText,
  Scale,
  Database,
  ServerCrash,
  Landmark,
  Ban,
  Copyright,
  Gavel,
} from "lucide-react";
export default function Terms({ embedded = false }) {
  const { language } = useLanguage();

  React.useEffect(() => {
    if (embedded) return;
    document.title =
      language === "ar"
        ? "الشروط والأحكام | ودق"
        : "Terms & Conditions | Wadaq";
  }, [language, embedded]);

  const content = {
    ar: {
      title: "الشروط والأحكام",
      lastUpdated: "آخر تحديث: أبريل 2026",
      intro:
        "تحكم هذه الوثيقة العلاقة التعاقدية بين مؤسسة ثروة لتقنية المعلومات («المزوّد») وبين مستخدم برنامج «ودق» السحابي («المستخدم» أو «المنشأة»). باستخدامكم للنظام فإنكم تقرون باطلاعكم على هذه الشروط وموافقتكم عليها دون تحفظ.",
      sections: [
        {
          icon: FileText,
          title: "1. التعريف والاتفاقية",
          items: [
            "«ودق»: منصة برمجية (SaaS) للفوترة والمحاسبة والتقارير، تُقدَّم عبر المتصفح أو التطبيقات المرتبطة.",
            "«المزوّد»: مؤسسة ثروة لتقنية المعلومات، سجل تجاري رقم 1009073537، مقرها الرياض — حي السفارات، المملكة العربية السعودية.",
            "يُعدُّ استمرار استخدام النظام بعد نشر أي تعديل على هذه الشروط قبولاً بهذا التعديل، ما لم تُعلَن خلاف ذلك صراحةً.",
          ],
        },
        {
          icon: Scale,
          title: "2. طبيعة الخدمة والمسؤولية المالية",
          items: [
            "يُقدَّم «ودق» بوصفه أداةً مساعدةً لإدارة البيانات المحاسبية والفوترة والتقارير، ولا يُغني عن المراجعة المهنية أو القانونية.",
            "تقع المسؤولية المالية والضريبية والمحاسبية النهائية — دون قيد أو شرط — على المنشأة المستخدمة للنظام، بما في ذلك صحة الإقرارات المقدَّمة إلى الجهات المختصة.",
            "لا يُعدُّ أي مخرج من النظام (بما في ذلك ما يُنتَج بمساعدة تقنيات الذكاء الاصطناعي) استشارةً مهنية ملزمةً؛ ويقع على عاتق المنشأة التحقق من مدى ملاءمته لوضعها قبل الاعتماد عليه.",
          ],
        },
        {
          icon: Database,
          title: "3. ملكية البيانات",
          items: [
            "تظل البيانات التي تُدخلها المنشأة (بيانات العملاء، الفواتير، المنتجات، إلخ) ملكاً لها قانوناً، مع منح المزوّد ترخيصاً غير حصري لاستضافتها ومعالجتها وتشفيرها لتشغيل الخدمة وتحسينها والامتثال للأنظمة.",
            "يلتزم المزوّد بعدم استخدام بيانات المنشأة لأغراض تنافسية أو لإعادة بيعها، وفق سياسة الخصوصية المعمول بها.",
            "يحق للمنشأة طلب تصدير بياناتها أو حذفها وفق الإجراءات المعلنة، مع مراعاة الالتزامات القانونية للاحتفاظ عند الاقتضاء.",
          ],
        },
        {
          icon: ServerCrash,
          title: "4. حدود المسؤولية التقنية",
          items: [
            "يُقدَّم النظام وفق حالة التوفر الفعلية (as is / as available)، دون ضمان خلوّه كلياً من الأعطال البرمجية أو التوقفات المؤقتة أو التأخير في التسليم عبر الشبكة.",
            "لا يتحمّل المزوّد المسؤولية عن أي خسارة مباشرة أو غير مباشرة ناجمة عن: انقطاع الإنترنت، أعطال الأجهزة، إساءة استخدام الحسابات، أو تعارض مع برمجيات طرف ثالث.",
            "يُنصح باتخاذ نسخ احتياطية دورية للبيانات الحساسة وفق سياسات المنشأة الداخلية.",
            "لا تتجاوز مسؤولية المزوّد — في أي حال — قيمة الاشتراك المدفوع للفترة التي نشأ فيها الخلل، ما لم يقتضِ النظام المعمول به خلاف ذلك.",
          ],
        },
        {
          icon: Landmark,
          title: "5. التزامات المستخدم تجاه هيئة الزكاة والضريبة والجهات الرقابية",
          items: [
            "تلتزم المنشأة بإدخال بيانات صحيحة وكاملة تتوافق مع أنظمة الضريبة والزكاة والجمارك والأنظمة ذات الصلة في المملكة العربية السعودية.",
            "تتحمّل المنشأة وحده مسؤولية الامتثال لإقرارات ضريبة القيمة المضافة وأي التزامات تتعلق بمنصة «فاتورة» أو غيرها من منصات الجهات الرسمية.",
            "لا يُعدُّ المزوّد ممثلاً عن المنشأة أمام أي جهة حكومية، ولا يتحمّل غرامات أو مطالبات ناتجة عن أخطاء إدخال أو تأخر تقديم من جانب المستخدم.",
          ],
        },
        {
          icon: Ban,
          title: "6. سياسة التوقف عن الخدمة والإنهاء",
          items: [
            "يجوز للمزوّد تعليق الخدمة أو إنهاؤها — مع إشعار مسبق قدر الإمكان — عند مخالفة الشروط، أو عند انتهاء الاشتراك، أو لأسباب قانونية أو أمنية أو تشغيلية جدية.",
            "يجوز للمنشأة إنهاء الاشتراك وفق آلية الإلغاء المعروضة؛ ويظل الحساب فعّالاً حتى نهاية الفترة المدفوعة ما لم يُنص على خلاف ذلك.",
            "بعد إنهاء العلاقة، تُطبَّق سياسات الاحتفاظ بالبيانات والحذف الواردة في سياسة الخصوصية.",
          ],
        },
        {
          icon: Copyright,
          title: "7. حقوق الملكية الفكرية (مؤسسة ثروة)",
          items: [
            "جميع الحقوق المتعلقة ببرمجيات «ودق» والواجهات والتصاميم والعلامات التجارية والمحتوى التعليمي المرتبط بالمنصة محفوظة لمؤسسة ثروة أو لمرخصيها.",
            "يُمنح المستخدم ترخيصاً محدوداً وغير قابل للتحويل لاستخدام المنصة وفق الغرض المسموح به؛ ويُحظر إعادة الهندسة أو النسخ غير المصرّح به أو إعادة البيع.",
          ],
        },
        {
          icon: Gavel,
          title: "8. الاشتراك والدفع",
          items: [
            "تُعرَض الباقات والأسعار على النحو المعلن في المنصة، وقد تشمل ضريبة القيمة المضافة وفق الأنظمة.",
            "تُفصَل سياسات الاسترجاع والتجديد التلقائي في صفحة سياسة الاسترجاع المعتمدة.",
          ],
        },
        {
          icon: FileText,
          title: "9. القانون الواجب التطبيق والتعديلات",
          items: [
            "تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وتُختص المحاكم المختصة في مدينة الرياض — ما لم يُفرَض نظاماً خلاف ذلك.",
            "يحتفظ المزوّد بحق تعديل هذه الشروط؛ مع إشعار المستخدمين بالوسائل المناسبة عند التغييرات الجوهرية.",
          ],
        },
      ],
      contactTitle: "التواصل",
      contactBody: "للاستفسارات المتعلقة بهذه الشروط:",
      footer:
        "باستخدامكم لبرنامج ودق، تقرون بأنكم اطلعتم على هذه الشروط ووافقتم عليها.",
    },
    en: {
      title: "Terms & Conditions",
      lastUpdated: "Last updated: April 2026",
      intro:
        "These Terms govern the relationship between Tharwa Information Technology Establishment (“Provider”) and the user of the Wadaq cloud software (“User” / “Establishment”). By using the service you acknowledge that you have read and agree to these Terms.",
      sections: [
        {
          icon: FileText,
          title: "1. Definitions",
          items: [
            "“Wadaq”: SaaS platform for invoicing, accounting and reporting, delivered via browser or related apps.",
            "“Provider”: Tharwa Information Technology Establishment, CR 1009073537, Riyadh — Diplomatic Quarter, Kingdom of Saudi Arabia.",
            "Continued use after publication of amendments constitutes acceptance unless expressly stated otherwise.",
          ],
        },
        {
          icon: Scale,
          title: "2. Nature of the service & financial responsibility",
          items: [
            "Wadaq is provided as an assistive tool; it does not replace professional or legal review.",
            "Financial, tax and accounting responsibility rests solely with the Establishment, including filings with competent authorities.",
            "Outputs (including AI-assisted outputs) are not binding professional advice; the Establishment must verify suitability before reliance.",
          ],
        },
        {
          icon: Database,
          title: "3. Data ownership",
          items: [
            "Data entered by the Establishment remains its property; the Provider receives a non-exclusive licence to host, process and encrypt it to operate and improve the service and comply with law.",
            "The Provider will not use Establishment data for competitive resale purposes, as further described in the Privacy Policy.",
            "Export and deletion rights apply as published, subject to legal retention requirements.",
          ],
        },
        {
          icon: ServerCrash,
          title: "4. Technical liability limits",
          items: [
            "The service is provided “as is / as available” without warranty of uninterrupted or error-free operation.",
            "The Provider is not liable for losses arising from connectivity issues, device faults, misuse, or third-party software conflicts.",
            "Regular backups are recommended.",
            "Liability is capped at fees paid for the period in which the issue arose, unless mandatory law provides otherwise.",
          ],
        },
        {
          icon: Landmark,
          title: "5. ZATCA & regulatory obligations",
          items: [
            "The Establishment must enter accurate data compliant with KSA tax, Zakat and customs rules as applicable.",
            "The Establishment alone is responsible for VAT returns and compliance with platforms such as Fatoora where relevant.",
            "The Provider is not the Establishment’s representative before any authority and is not liable for penalties due to user error or delay.",
          ],
        },
        {
          icon: Ban,
          title: "6. Suspension & termination",
          items: [
            "The Provider may suspend or terminate with notice where reasonably practicable for breach, non-payment, legal/security or operational reasons.",
            "The Establishment may cancel as per in-app flows; access may continue until the end of the paid period unless stated otherwise.",
            "Data retention/deletion after termination follows the Privacy Policy.",
          ],
        },
        {
          icon: Copyright,
          title: "7. Intellectual property (Tharwa)",
          items: [
            "Software, UI/UX, trademarks and related materials are owned by Tharwa or its licensors.",
            "A limited, non-transferable licence is granted for permitted use; reverse engineering and unauthorised redistribution are prohibited.",
          ],
        },
        {
          icon: Gavel,
          title: "8. Subscription & payment",
          items: [
            "Plans and prices are as displayed; VAT may apply under KSA law.",
            "Refund and auto-renewal rules are set out in the Refund Policy.",
          ],
        },
        {
          icon: FileText,
          title: "9. Governing law & changes",
          items: [
            "These Terms are governed by the laws of the Kingdom of Saudi Arabia; courts of Riyadh have jurisdiction unless mandatory law says otherwise.",
            "The Provider may amend these Terms and will notify users of material changes by appropriate means.",
          ],
        },
      ],
      contactTitle: "Contact",
      contactBody: "For questions about these Terms:",
      footer:
        "By using Wadaq you confirm that you have read and agreed to these Terms.",
    },
  };

  const c = content[language];

  return (
    <div
      className={
        embedded
          ? "max-h-[min(75vh,720px)] overflow-y-auto overscroll-contain bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-6 rounded-b-lg"
          : "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-8"
      }
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className={embedded ? "py-6 px-3 sm:px-4 lg:px-6" : "py-10 px-4 sm:px-6 lg:px-8"}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{c.title}</h1>
            <p className="text-slate-400 text-sm">{c.lastUpdated}</p>
          </div>

          <Card className="mb-8 bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6 text-slate-200 leading-relaxed text-base">{c.intro}</CardContent>
          </Card>

          <div className="space-y-5">
            {c.sections.map((section, index) => (
              <Card
                key={index}
                className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/[0.07] transition-colors"
              >
                <CardHeader className="border-b border-white/10 pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg text-white">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/90 to-amber-700 flex items-center justify-center shrink-0">
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <ul className="space-y-3 text-slate-300 text-sm leading-relaxed">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-amber-500/10 border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">{c.contactTitle}</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-2">
              <p>{c.contactBody}</p>
              <a href="mailto:support@rikazai.com" className="text-amber-300 hover:underline font-mono">
                support@rikazai.com
              </a>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-slate-500 text-sm px-2">{c.footer}</p>

          {!embedded && (
            <div className="mt-10 text-center">
              <Link
                to="/Landing"
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors font-semibold"
              >
                <span>←</span>
                {language === "ar" ? "العودة للصفحة الرئيسية" : "Back to home"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
