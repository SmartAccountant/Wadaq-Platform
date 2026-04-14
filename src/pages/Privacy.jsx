import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageContext";
import { Shield, Lock, Database, UserCheck, Eye, FileText, Server } from "lucide-react";
export default function Privacy({ embedded = false }) {
  const { language } = useLanguage();

  React.useEffect(() => {
    if (embedded) return;
    document.title =
      language === "ar" ? "الخصوصية والأمان | ودق" : "Privacy & Security | Wadaq";
  }, [language, embedded]);

  const content = {
    ar: {
      title: "سياسة الخصوصية والأمان",
      lastUpdated: "آخر تحديث: أبريل 2026",
      intro:
        "تلتزم مؤسسة ثروة لتقنية المعلومات («المزوّد») بحماية خصوصية بيانات مستخدمي برنامج «ودق»، وتصف هذه الوثيقة مبادئ الجمع والاستخدام والتخزين والامتثال لأنظمة المملكة العربية السعودية، بما في ذلك نظام حماية البيانات الشخصية والضوابط الأساسية للأمن السيبراني الصادرة عن الهيئة الوطنية للأمن السيبراني حيث ينطبق ذلك على طبيعة الخدمة.",
      sections: [
        {
          icon: Database,
          title: "1. البيانات التي تُجمع",
          items: [
            "بيانات المنشأة والمستخدم: البريد الإلكتروني، الاسم، بيانات الاشتراك، وما يُدخله المستخدم من بيانات محاسبية وفواتير وعملاء ومنتجات.",
            "بيانات تقنية: سجلات الاتصال الآمنة، معرّفات الجلسة، ومعلومات الجهاز الضرورية لتشغيل الخدمة وتأمينها.",
            "لا نطلب جمع بيانات حساسة غير لازمة لتقديم الخدمة؛ ويُنصح بعدم إدخال معلومات غير مطلوبة في الحقول المخصصة.",
          ],
        },
        {
          icon: Lock,
          title: "2. التشفير ومعايير الأمان التقني",
          items: [
            "يُستخدم بروتوكول TLS (HTTPS) لتشفير البيانات أثناء النقل بين المتصفح والخوادم.",
            "تُخزَّن كلمات المرور باستخدام تشفير أحادي الاتجاه ومقاومة القوة الغاشمة وفق ممارسات الصناعة.",
            "تُطبَّق مبدأ الحد الأدنى من الصلاحيات والمراقبة الدورية للأنظمة، مع تحديثات أمنية منتظمة.",
            "نسعى لمواءمة إجراءاتنا مع الضوابط الأساسية للأمن السيبراني المعتمدة في المملكة (NCA ECC) فيما يتعلق بإدارة الهوية، وحماية الشبكات، والاستجابة للحوادث، حسب نطاق الخدمة.",
          ],
        },
        {
          icon: Shield,
          title: "3. عدم بيع البيانات أو مشاركتها مع طرف ثالث للتسويق",
          items: [
            "لا نبيع بيانات المنشآت ولا نؤجرها ولن نشاركها مع أطراف ثالثة لأغراض إعلانية أو تسويقية.",
            "قد تُشارك بيانات محدودة مع مزوّدي بنية تحتية (مثل الاستضافة أو بوابات الدفع) بموجب عقود سرية والتزام بمعايير أمان مناسبة، ولغرض تشغيل الخدمة فقط.",
            "لا يُسمح لمزوّدي الخدمة الفرعيين باستخدام بياناتكم لمصلحتهم الخاصة.",
          ],
        },
        {
          icon: Server,
          title: "4. الالتزام بالأمن السيبراني والأنظمة السعودية",
          items: [
            "نلتزم بالتعاون مع الجهات المختصة عند صدور طلبات نظامية مشروعة، مع مراعاة الإفصاح المحدود الضروري.",
            "نُحدّث سياساتنا وإجراءاتنا بما يتوافق مع تطور الأنظمة والمعايير الوطنية في مجال حماية البيانات والأمن السيبراني.",
            "في حال وقوع حادث أمني يمس بياناتكم بشكل جوهري، سنسعى لإخطاركم بالوسائل المناسبة وفق المتطلبات المعمول بها.",
          ],
        },
        {
          icon: UserCheck,
          title: "5. استخدام البيانات",
          items: [
            "تشغيل المنصة وتقديم الميزات المحاسبية والفوترة والتقارير.",
            "الدعم الفني والتحقق من الهوية عند الحاجة.",
            "الامتثال للالتزامات القانونية والضريبية عند الاقتضاء.",
            "تحسين الجودة والأداء بشكل مجهّل الهوية قدر الإمكان.",
          ],
        },
        {
          icon: Eye,
          title: "6. حقوقكم",
          items: [
            "طلب الاطلاع على البيانات الشخصية المتعلقة بكم وفق الأنظمة.",
            "طلب التصحيح أو التحديث عند الدقة.",
            "طلب الحذف أو التقييد حيث ينطبق القانون، مع مراعاة الاحتفاظ الضريبي أو القضائي.",
          ],
        },
        {
          icon: FileText,
          title: "7. الاحتفاظ بالبيانات",
          items: [
            "نحتفظ بالبيانات طالما الحساب نشطاً أو لغرض الالتزام القانوني.",
            "بعد إنهاء الحساب، تُطبَّق سياسات الحذف والأرشفة المعلنة في واجهة الإعدادات أو عند الطلب.",
          ],
        },
      ],
      contact: {
        title: "التواصل — الخصوصية",
        body: "للاستفسارات المتعلقة بالخصوصية أو الأمان:",
        email: "support@rikazai.com",
      },
      footer:
        "باستخدامكم لودق، فإنكم تقرون باطلاعكم على هذه السياسة. قد نُحدّثها وسنُشعركم بالتغييرات الجوهرية بالوسائل المناسبة.",
    },
    en: {
      title: "Privacy & security policy",
      lastUpdated: "Last updated: April 2026",
      intro:
        "Tharwa Information Technology Establishment (“Provider”) is committed to protecting Wadaq users’ data. This policy describes collection, use, storage and compliance with KSA laws, including the Personal Data Protection Law and National Cybersecurity Authority (NCA) Essential Cybersecurity Controls (ECC) where applicable to our service scope.",
      sections: [
        {
          icon: Database,
          title: "1. Data we collect",
          items: [
            "Establishment and user data: email, name, subscription data, and accounting/invoicing data you enter.",
            "Technical data: secure connection logs, session identifiers, and device information needed to operate and secure the service.",
            "We avoid collecting unnecessary sensitive data; do not enter information beyond what fields require.",
          ],
        },
        {
          icon: Lock,
          title: "2. Encryption & security",
          items: [
            "TLS (HTTPS) encrypts data in transit between your browser and our servers.",
            "Passwords are stored using strong one-way hashing consistent with industry practice.",
            "Least-privilege access, monitoring, and regular security updates are applied.",
            "We align our practices with KSA NCA ECC domains such as identity management, network protection, and incident response, as applicable.",
          ],
        },
        {
          icon: Shield,
          title: "3. No sale of data / no marketing sharing",
          items: [
            "We do not sell or rent Establishment data or share it with third parties for advertising.",
            "Limited data may be shared with infrastructure or payment processors under confidentiality and security obligations, solely to operate the service.",
            "Sub-processors may not use your data for their own purposes.",
          ],
        },
        {
          icon: Server,
          title: "4. Cybersecurity & KSA compliance",
          items: [
            "We cooperate with competent authorities when lawfully required, with minimal necessary disclosure.",
            "We update policies as KSA regulations and national cybersecurity standards evolve.",
            "In case of a material personal-data breach, we will endeavour to notify you as required by applicable law.",
          ],
        },
        {
          icon: UserCheck,
          title: "5. How we use data",
          items: [
            "Operate the platform and provide accounting, invoicing and reporting features.",
            "Support and identity verification when needed.",
            "Legal/tax compliance where required.",
            "Service improvement using aggregated or de-identified insights where possible.",
          ],
        },
        {
          icon: Eye,
          title: "6. Your rights",
          items: [
            "Access personal data relating to you as permitted by law.",
            "Request correction where inaccurate.",
            "Request deletion or restriction where applicable, subject to legal/tax retention duties.",
          ],
        },
        {
          icon: FileText,
          title: "7. Retention",
          items: [
            "We retain data while the account is active or as required by law.",
            "After termination, deletion/archiving follows published settings or requests, subject to legal holds.",
          ],
        },
      ],
      contact: {
        title: "Contact — privacy",
        body: "For privacy or security questions:",
        email: "support@rikazai.com",
      },
      footer:
        "By using Wadaq you acknowledge this policy. We may update it and will notify you of material changes by appropriate means.",
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
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-gradient-to-br from-blue-500 to-indigo-700 shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{c.title}</h1>
            <p className="text-slate-400 text-sm">{c.lastUpdated}</p>
          </div>

          <Card className="mb-8 bg-white/5 border-white/10">
            <CardContent className="pt-6 text-slate-200 leading-relaxed text-sm sm:text-base">{c.intro}</CardContent>
          </Card>

          <div className="space-y-5">
            {c.sections.map((section, index) => (
              <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="flex items-center gap-3 text-lg text-white">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <ul className="space-y-3 text-slate-300 text-sm leading-relaxed">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-sky-400 shrink-0 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-indigo-500/10 border-indigo-400/25">
            <CardHeader>
              <CardTitle className="text-white text-lg">{c.contact.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-3">
              <p>{c.contact.body}</p>
              <a href={`mailto:${c.contact.email}`} className="text-sky-300 hover:underline font-mono">
                {c.contact.email}
              </a>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-slate-500 text-sm px-2">{c.footer}</p>

          {!embedded && (
            <div className="mt-8 text-center">
              <Link to="/Landing" className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-semibold">
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
