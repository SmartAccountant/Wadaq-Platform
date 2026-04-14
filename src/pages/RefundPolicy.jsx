import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageContext";
import { RefreshCw, XCircle, Clock, Shield, AlertCircle } from "lucide-react";
export default function RefundPolicy({ embedded = false }) {
  const { language } = useLanguage();

  React.useEffect(() => {
    if (embedded) return;
    document.title =
      language === "ar"
        ? "سياسة الاسترجاع | ودق"
        : "Refund Policy | Wadaq";
  }, [language, embedded]);

  const content = {
    ar: {
      title: "سياسة الاسترجاع والإلغاء",
      lastUpdated: "آخر تحديث: أبريل 2026",
      intro:
        "توضح هذه السياسة قواعد الاسترجاع والإلغاء المتعلقة باشتراكات برنامج «ودق» المقدَّمة من مؤسسة ثروة لتقنية المعلومات.",
      highlight: {
        title: "بند أساسي — المبيعات نهائية بعد التجربة",
        text:
          "نظراً لتوفر فترة تجربة مجانية كاملة مدتها (14) يوماً تُمكِّن المنشأة من تقييم النظام قبل أي التزام مالي، فإن جميع المبيعات والاشتراكات المدفوعة (شهرية أو سنوية أو غيرها) تُعد نهائية. لا يُسترد المبلغ بعد تفعيل الاشتراك المدفوع، ولا تُسترد المبالغ عن الفترات الجزئية أو غير المستخدمة من فترة الاشتراك.",
      },
      sections: [
        {
          icon: XCircle,
          color: "from-rose-600 to-red-700",
          title: "عدم الاسترداد بعد تفعيل الاشتراك",
          items: [
            "بمجرد نجاح عملية الدفع وتفعيل باقة مدفوعة (شهرية أو سنوية)، يُستبعد استرداد الرسوم بشكل عام، وذلك لأن المنشأة سبق أن تمتعت بالتجربة المجانية الكافية لاتخاذ قرار مستنير.",
            "لا يُعد عدم استخدام المنصة بعد الاشتراك سبباً للاسترداد؛ وتظل الالتزامات المالية سارية وفق شروط الباقة حتى يتم إلغاء التجديد وفق البند أدناه.",
          ],
        },
        {
          icon: Clock,
          color: "from-indigo-600 to-blue-700",
          title: "إلغاء التجديد التلقائي",
          items: [
            "قد تخضع الاشتراكات الشهرية أو السنوية للتجديد التلقائي وفق ما يُعرَض عند الاشتراك؛ ويتحمّل المستخدم مسؤولية إلغاء التجديد من إعدادات الحساب أو بوابة الدفع قبل موعد التجديد القادم إذا رغب في عدم استمرار الخدمة.",
            "عند الإلغاء الصحيح قبل موعد التجديد، لا يُخصم مبلغ جديد للفترة التالية؛ ولا يترتب على الإلغاء استرداد ما سبق دفعه عن الفترة الحالية المفعّلة.",
            "عدم استخدام الحساب لا يُعد إلغاءً تلقائياً للاشتراك أو للتجديد؛ ويُنصح بمراجعة حالة الاشتراك بشكل دوري.",
          ],
        },
        {
          icon: Shield,
          color: "from-emerald-600 to-teal-700",
          title: "حالات استثنائية محدودة (أخطاء فوترة)",
          items: [
            "في حال إثبات خصم مكرر لنفس الفترة نفسها بسبب خلل تقني مؤكد من جانب المزوّد أو بوابة الدفع، يُعالَج الطلب وفق تحقق داخلي وقد يُسترد الفرق أو يُعاد توجيهه بالاتفاق مع المستخدم.",
            "لا تشمل الاستثناءات: تغيّر رأي المستخدم، أو عدم الاستفادة من الميزات، أو إغلاق المنشأة، ما لم يُنص صراحة على خلاف ذلك في عرض مكتوب معتمد.",
          ],
        },
        {
          icon: AlertCircle,
          color: "from-slate-600 to-slate-800",
          title: "القانون المعمول به",
          items: [
            "تُفسَّر هذه السياسة وفق أنظمة المملكة العربية السعودية، بما في ذلك أنظمة التجارة الإلكترونية وحماية المستهلك، دون الإخلال بأي حق إلزامي للمستهلك.",
          ],
        },
      ],
      howToRequest: {
        title: "طلبات مراجعة الفوترة (الحالات الاستثنائية)",
        steps: [
          "راسلنا على support@rikazai.com مع عنوان واضح (مثلاً: «مراجعة خصم مكرر»).",
          "أرفق البريد المسجّل في المنصة، تاريخ العملية، وأي مرجع دفع متاح.",
          "سيتم الرد خلال مدة عمل معقولة بعد التحقق من السجلات وبوابة الدفع.",
        ],
      },
      footer: "تحتفظ مؤسسة ثروة بحق تحديث هذه السياسة؛ يُنصح بمراجعتها دورياً.",
    },
    en: {
      title: "Refund & cancellation policy",
      lastUpdated: "Last updated: April 2026",
      intro:
        "This policy describes refunds and cancellations for Wadaq subscriptions provided by Tharwa Information Technology Establishment.",
      highlight: {
        title: "Key clause — sales are final after the trial",
        text:
          "Because a full 14-day free trial is provided for you to evaluate the product before paying, all paid subscriptions (monthly, annual or otherwise) are final. No refund is due after a paid subscription is activated, and no partial refunds are granted for unused time.",
      },
      sections: [
        {
          icon: XCircle,
          color: "from-rose-600 to-red-700",
          title: "No refund after activation",
          items: [
            "Once payment succeeds and a paid plan is activated, fees are generally non-refundable, as the free trial already allowed an informed decision.",
            "Lack of use after purchase is not a ground for refund; obligations remain until auto-renewal is cancelled as below.",
          ],
        },
        {
          icon: Clock,
          color: "from-indigo-600 to-blue-700",
          title: "Auto-renewal cancellation",
          items: [
            "Plans may auto-renew as disclosed at purchase; you must cancel renewal in account or payment settings before the next charge date to avoid further billing.",
            "Correct cancellation before renewal prevents the next charge; it does not refund the current activated period.",
            "Non-use does not cancel billing; review subscription status regularly.",
          ],
        },
        {
          icon: Shield,
          color: "from-emerald-600 to-teal-700",
          title: "Limited exceptions (billing errors)",
          items: [
            "If a duplicate charge for the same period is proven due to a confirmed technical error on our side or the gateway, we will review and may refund the difference as agreed.",
            "Exceptions do not cover change of mind, unused features, or business closure, unless a separate written offer states otherwise.",
          ],
        },
        {
          icon: AlertCircle,
          color: "from-slate-600 to-slate-800",
          title: "Governing law",
          items: [
            "This policy is interpreted under the laws of the Kingdom of Saudi Arabia, including e-commerce and consumer protection rules, without prejudice to any mandatory consumer rights.",
          ],
        },
      ],
      howToRequest: {
        title: "Billing review requests (exceptional cases)",
        steps: [
          "Email support@rikazai.com with a clear subject (e.g. “Duplicate charge review”).",
          "Include your registered email, transaction date, and any payment reference.",
          "We respond within a reasonable time after verifying logs and the payment gateway.",
        ],
      },
      footer: "Tharwa may update this policy; please review it periodically.",
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
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <RefreshCw className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{c.title}</h1>
            <p className="text-slate-400 text-sm">{c.lastUpdated}</p>
          </div>

          <Card className="mb-6 bg-white/5 border-white/10">
            <CardContent className="pt-6 text-slate-200 leading-relaxed">{c.intro}</CardContent>
          </Card>

          <Card className="mb-8 border-2 border-amber-500/40 bg-amber-500/10">
            <CardHeader>
              <CardTitle className="text-amber-200 text-lg leading-snug">{c.highlight.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-100 leading-relaxed text-sm sm:text-base">
              {c.highlight.text}
            </CardContent>
          </Card>

          <div className="space-y-5">
            {c.sections.map((section, index) => (
              <Card key={index} className="bg-white/5 border-white/10">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="flex items-center gap-3 text-lg text-white">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${section.color} rounded-lg flex items-center justify-center shrink-0`}
                    >
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <ul className="space-y-3 text-slate-300 text-sm leading-relaxed">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-emerald-400 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-blue-500/10 border-blue-400/20">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-300" />
                {c.howToRequest.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-slate-300 text-sm">
                {c.howToRequest.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/30 text-blue-200 text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 pt-4 border-t border-white/10 text-slate-300 text-sm space-y-2">
                <p>
                  <a href="mailto:support@rikazai.com" className="text-sky-300 hover:underline">
                    support@rikazai.com
                  </a>
                </p>
                <p dir="ltr" className="text-right">
                  <a href="tel:+966500070065" className="text-sky-300 hover:underline">
                    +966 50 007 0065
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-slate-500 text-sm">{c.footer}</p>

          {!embedded && (
            <div className="mt-8 text-center">
              <Link to="/Landing" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold">
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
