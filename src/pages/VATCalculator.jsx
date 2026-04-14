import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wadaq } from "@/api/WadaqClient";
import { Calculator, ArrowLeft, RefreshCw, Copy, Check, ChevronDown } from "lucide-react";

export default function VATCalculator() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [vatRate, setVatRate] = useState(15);
  const [mode, setMode] = useState("add"); // add = أضف VAT, extract = استخرج VAT
  const [copied, setCopied] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const numAmount = parseFloat(amount) || 0;

  const vatAmount = mode === "add"
    ? (numAmount * vatRate) / 100
    : (numAmount * vatRate) / (100 + vatRate);

  const totalAmount = mode === "add"
    ? numAmount + vatAmount
    : numAmount;

  const baseAmount = mode === "add"
    ? numAmount
    : numAmount - vatAmount;

  const copyToClipboard = (value, key) => {
    navigator.clipboard.writeText(value.toFixed(2));
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const reset = () => {
    setAmount("");
    setVatRate(15);
    setMode("add");
  };

  const faqs = [
    { q: "ما هي نسبة ضريبة القيمة المضافة في السعودية؟", a: "نسبة ضريبة القيمة المضافة (VAT) في المملكة العربية السعودية هي 15% اعتباراً من يوليو 2020، بعد أن كانت 5% منذ تطبيقها في 2018." },
    { q: "كيف أحسب ضريبة القيمة المضافة على المبيعات؟", a: "اضرب المبلغ الأساسي في 0.15 للحصول على قيمة الضريبة. مثال: 1000 ريال × 15% = 150 ريال ضريبة، والإجمالي 1150 ريال." },
    { q: "كيف أستخرج الضريبة من مبلغ شامل للضريبة؟", a: "اقسم المبلغ الإجمالي على 1.15 للحصول على المبلغ الأساسي، والفرق هو قيمة الضريبة. مثال: 1150 ÷ 1.15 = 1000 ريال أساسي، والضريبة 150 ريال." },
    { q: "من هم الملزمون بتسجيل ضريبة القيمة المضافة؟", a: "كل منشأة يتجاوز إيرادها السنوي 375,000 ريال ملزمة بالتسجيل الإجباري، وبالاختياري من 187,500 ريال." },
    { q: "هل هناك سلع أو خدمات معفاة من الضريبة؟", a: "نعم، من بينها: الخدمات الصحية، التعليم، العقارات السكنية، وبعض الخدمات المالية. الصادرات معفاة وبعض المعاملات خاضعة لنسبة صفر." },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Wadaq-prod/public/6971dab01aac952606d6505f/5c1b2ad18_92490488-9162-457f-ad0c-6b04cd984bf6.png"
            alt="برنامج ودق" className="h-9 object-contain cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-slate-500 hover:text-slate-800 text-sm transition-colors"
            >
              الرئيسية
            </button>
            <button
              onClick={() => Wadaq.auth.redirectToLogin("/Dashboard")}
              className="bg-slate-900 hover:bg-slate-700 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium"
            >
              ابدأ مجاناً
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-28 pb-10 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium mb-6">
          <Calculator className="w-4 h-4" />
          أداة مجانية — لا يلزم تسجيل
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">
          حاسبة ضريبة القيمة المضافة
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          احسب ضريبة VAT بسهولة للمبيعات والمشتريات — نسبة 15% وفق معايير هيئة الزكاة والضريبة والجمارك
        </p>
      </section>

      {/* CALCULATOR */}
      <section className="px-6 pb-16 max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">

          {/* Mode Toggle */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setMode("add")}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === "add" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              إضافة ضريبة على المبلغ
            </button>
            <button
              onClick={() => setMode("extract")}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === "extract" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              استخراج الضريبة من الإجمالي
            </button>
          </div>

          <div className="p-8 space-y-6">

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {mode === "add" ? "المبلغ الأساسي (قبل الضريبة)" : "المبلغ الإجمالي (شامل الضريبة)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-2xl font-bold text-left border-2 border-slate-200 focus:border-slate-800 rounded-2xl px-5 py-4 outline-none transition-colors"
                  dir="ltr"
                />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">ر.س</span>
              </div>
            </div>

            {/* VAT Rate */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نسبة الضريبة</label>
              <div className="flex gap-2">
                {[5, 15].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setVatRate(rate)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${vatRate === rate ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {rate}%
                    {rate === 15 && <span className="block text-xs font-normal opacity-70">المعمول به حالياً</span>}
                    {rate === 5 && <span className="block text-xs font-normal opacity-70">قبل 2020</span>}
                  </button>
                ))}
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={vatRate}
                    onChange={e => setVatRate(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 focus:border-slate-800 outline-none font-bold text-sm text-center"
                    placeholder="نسبة مخصصة"
                    dir="ltr"
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                </div>
              </div>
            </div>

            {/* Results */}
            {numAmount > 0 && (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  النتيجة
                </div>
                {[
                  { label: "المبلغ الأساسي", value: baseAmount, key: "base", color: "text-slate-700" },
                  { label: `قيمة الضريبة (${vatRate}%)`, value: vatAmount, key: "vat", color: "text-orange-600" },
                  { label: "الإجمالي شامل الضريبة", value: totalAmount, key: "total", color: "text-slate-900", bold: true },
                ].map(row => (
                  <div key={row.key} className={`flex items-center justify-between px-5 py-4 border-b border-slate-200 last:border-0 ${row.bold ? "bg-white" : ""}`}>
                    <span className={`text-sm font-medium ${row.color}`}>{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-lg ${row.color}`} dir="ltr">
                        {row.value.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
                      </span>
                      <button
                        onClick={() => copyToClipboard(row.value, row.key)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-700"
                        title="نسخ"
                      >
                        {copied === row.key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reset */}
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors font-medium text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تعيين
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-3xl bg-slate-900 text-white p-8 text-center">
          <h2 className="text-xl font-black mb-2">هل تريد إصدار فواتير ضريبية احترافية؟</h2>
          <p className="text-slate-400 text-sm mb-5">برنامج ودق يحسب الضريبة تلقائياً على كل فاتورة — متوافق 100% مع ZATCA</p>
          <button
            onClick={() => Wadaq.auth.redirectToLogin("/Dashboard")}
            className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 rounded-xl font-bold text-sm transition-colors inline-flex items-center gap-2"
          >
            جرب مجاناً 10 أيام
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">أسئلة شائعة عن ضريبة القيمة المضافة</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white border border-slate-200">
              <button
                className="w-full flex items-center justify-between p-5 text-right text-slate-800 font-semibold hover:bg-slate-50 transition-colors text-sm"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 mr-3 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-slate-500 text-sm leading-relaxed border-t border-slate-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-8 px-6 text-center text-sm text-slate-400">
        <p>© 2026 برنامج ودق المحاسبي — <button onClick={() => navigate("/")} className="underline hover:text-slate-600">العودة للرئيسية</button></p>
      </footer>
    </div>
  );
}