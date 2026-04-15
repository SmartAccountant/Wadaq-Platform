/**
 * تبديل المحرك: Grok للتحيات والعامة (تكلفة أقل)، OpenAI للمحاسبة والتحليل المعقّد.
 * @returns {'grok' | 'openai'}
 */
export function decideEngine(userText) {
  const t = String(userText || "").trim();
  if (!t) return "grok";

  const lower = t.toLowerCase();

  const greetingStart =
    /^(السلام|مرحبا|مرحباً|هلا|أهلاً|أهلا|صباح|مساء|شكرا|شكراً|thanks|thank you|hello|hi|hey)\b/i;
  if (t.length <= 52 && greetingStart.test(t)) {
    return "grok";
  }

  const accountingHints = [
    "محاسب",
    "محاسبة",
    "قيد محاسبي",
    "قيد",
    "دفتر أستاذ",
    "ميزان مراجعة",
    "أرباح وخسائر",
    "قائمة الدخل",
    "الميزانية",
    "التدفقات النقدية",
    "ضريبة",
    "زكاة",
    "قيمة مضافة",
    "فاتورة إلكترونية",
    "فاتورة الكترونية",
    "إقرار ضريبي",
    "zatca",
    "vat",
    "ذمة مدينة",
    "ذمة دائنة",
    "إهلاك",
    "مراجعة",
    "تقرير مالي",
    "تحليل مالي",
    "ربحية",
    "هامش",
    "تكلفة",
    "مخزون تقديري",
    "جرد",
    "قيد يومية",
    "سند قبض",
    "سند صرف",
  ];

  const hasAccounting = accountingHints.some((k) => lower.includes(k) || t.includes(k));

  const hasHeavyNumbers =
    /[0-9٫٬]{2,}/.test(t) && t.length > 55;

  if (hasAccounting || hasHeavyNumbers || t.length > 160) {
    return "openai";
  }

  if (t.length <= 40 && !/[0-9٣-٩]{3,}/.test(t)) {
    return "grok";
  }

  return t.length > 90 ? "openai" : "grok";
}
