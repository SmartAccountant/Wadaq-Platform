import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Palette, AlignLeft, AlignCenter, AlignRight, Save, X, CheckCircle, Cloud } from "lucide-react";
import { TEMPLATES } from "./InvoiceTemplates";
import { Textarea } from "@/components/ui/textarea";
import { Wadaq } from "@/api/WadaqCore";

const COLORS = [
  { name: "أزرق", value: "#2563eb" },
  { name: "بنفسجي", value: "#7c3aed" },
  { name: "أخضر", value: "#059669" },
  { name: "أحمر", value: "#dc2626" },
  { name: "برتقالي", value: "#d97706" },
  { name: "رمادي", value: "#475569" },
  { name: "وردي", value: "#db2777" },
  { name: "سماوي", value: "#0891b2" },
];

const LOGO_SIZES = [
  { label: "صغير", value: "h-10" },
  { label: "متوسط", value: "h-16" },
  { label: "كبير", value: "h-24" },
];

const LOGO_POSITIONS = [
  { label: "يمين", value: "right", icon: AlignRight },
  { label: "وسط", value: "center", icon: AlignCenter },
  { label: "يسار", value: "left", icon: AlignLeft },
];

const COMPANY_POSITIONS = [
  { label: "أعلى يمين", value: "top-right" },
  { label: "أعلى يسار", value: "top-left" },
  { label: "أسفل الشعار", value: "below-logo" },
];

export const DEFAULT_INVOICE_STYLE = {
  template: "classic",
  primaryColor: "#2563eb",
  logoSize: "h-16",
  logoPosition: "right",
  companyPosition: "top-right",
  showQr: true,
  showFooter: true,
  tableStyle: "default",
  customNotes: "",       // ملاحظات ثابتة تظهر في كل فاتورة
  returnPolicy: "",      // سياسة الاستبدال والإرجاع
  termsText: "",         // الشروط والأحكام
};

function ColorSwatch({ color, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(color.value)}
      className={`w-8 h-8 rounded-full border-2 transition-all ${
        selected ? "border-white scale-110 shadow-lg ring-2 ring-offset-1 ring-gray-400" : "border-transparent hover:scale-105"
      }`}
      style={{ backgroundColor: color.value }}
      title={color.name}
    />
  );
}

export default function InvoiceCustomizer({ invoice, companyInfo, onClose, onStyleChange, embeddedInSettings }) {
  const [style, setStyle] = useState(DEFAULT_INVOICE_STYLE);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    // Load from user account first, fallback to localStorage
    const loadStyle = async () => {
      try {
        const user = await Wadaq.auth.me();
        if (user?.invoice_style) {
          const merged = { ...DEFAULT_INVOICE_STYLE, ...user.invoice_style };
          setStyle(merged);
          onStyleChange?.(merged);
          return;
        }
      } catch (e) {}
      // fallback localStorage
      const saved = localStorage.getItem("invoice_style");
      if (saved) {
        try {
          const merged = { ...DEFAULT_INVOICE_STYLE, ...JSON.parse(saved) };
          setStyle(merged);
          onStyleChange?.(merged);
        } catch (e) {}
      }
    };
    loadStyle();
  }, []);

  const updateStyle = (key, value) => {
    const newStyle = { ...style, [key]: value };
    setStyle(newStyle);
    onStyleChange?.(newStyle);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to user account (cloud) + localStorage
      await Wadaq.auth.updateMe({ invoice_style: style });
      localStorage.setItem("invoice_style", JSON.stringify(style));
      onStyleChange?.(style);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    } catch (e) {
      // fallback to localStorage only
      localStorage.setItem("invoice_style", JSON.stringify(style));
      onStyleChange?.(style);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    }
    setSaving(false);
  };

  return (
    <Card className={embeddedInSettings ? "bg-white border shadow-sm" : "bg-white border shadow-xl sticky top-4"}>
      <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-base font-semibold text-slate-800">تخصيص الفاتورة</CardTitle>
        </div>
        {!embeddedInSettings && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-5 overflow-y-auto max-h-[70vh]">

        {/* Templates */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">القالب</Label>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => updateStyle("template", t.id)}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg border-2 transition-all text-xs font-medium ${
                  style.template === t.id
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-2xl">{t.preview}</span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Color */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">اللون الرئيسي</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <ColorSwatch
                key={color.value}
                color={color}
                selected={style.primaryColor === color.value}
                onClick={(val) => updateStyle("primaryColor", val)}
              />
            ))}
          </div>
        </div>

        {/* Logo Size */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">حجم الشعار</Label>
          <div className="flex gap-2">
            {LOGO_SIZES.map((size) => (
              <button
                key={size.value}
                onClick={() => updateStyle("logoSize", size.value)}
                className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-all font-medium ${
                  style.logoSize === size.value
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Position */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">موضع الشعار</Label>
          <div className="flex gap-2">
            {LOGO_POSITIONS.map((pos) => {
              const Icon = pos.icon;
              return (
                <button
                  key={pos.value}
                  onClick={() => updateStyle("logoPosition", pos.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 text-xs rounded-lg border transition-all font-medium ${
                    style.logoPosition === pos.value
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {pos.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Company Info Position */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">موضع بيانات الشركة</Label>
          <div className="flex flex-col gap-1">
            {COMPANY_POSITIONS.map((pos) => (
              <button
                key={pos.value}
                onClick={() => updateStyle("companyPosition", pos.value)}
                className={`text-right py-2 px-3 text-xs rounded-lg border transition-all font-medium ${
                  style.companyPosition === pos.value
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Style */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">شكل الجدول</Label>
          <div className="flex flex-col gap-1">
            {[
              { value: "default", label: "خطوط فاصلة فقط" },
              { value: "striped", label: "صفوف متناوبة الألوان" },
              { value: "bordered", label: "إطار كامل" },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => updateStyle("tableStyle", t.value)}
                className={`text-right py-2 px-3 text-xs rounded-lg border transition-all font-medium ${
                  style.tableStyle === t.value
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">عناصر إضافية</Label>
          <div className="space-y-2">
            {[
              { key: "showQr", label: "إظهار رمز QR" },
              { key: "showFooter", label: "إظهار تذييل الفاتورة" },
            ].map((opt) => (
              <label key={opt.key} className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <span className="text-sm text-slate-700">{opt.label}</span>
                <div
                  onClick={() => updateStyle(opt.key, !style[opt.key])}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    style[opt.key] ? "bg-purple-500" : "bg-slate-300"
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    style[opt.key] ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Invoice Texts */}
        <div className="space-y-3 border-t pt-4">
          <Label className="text-sm font-semibold text-slate-700">نصوص ثابتة في الفاتورة</Label>

          <div className="space-y-1">
            <Label className="text-xs text-slate-500">سياسة الاستبدال والإرجاع</Label>
            <Textarea
              value={style.returnPolicy || ""}
              onChange={(e) => updateStyle("returnPolicy", e.target.value)}
              placeholder="مثال: لا يقبل الاسترجاع أو الاستبدال بعد 7 أيام من تاريخ الشراء..."
              className="text-xs min-h-[70px] bg-white border-slate-200 text-slate-800 resize-none"
              dir="rtl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-500">الشروط والأحكام</Label>
            <Textarea
              value={style.termsText || ""}
              onChange={(e) => updateStyle("termsText", e.target.value)}
              placeholder="مثال: تُعدّ هذه الفاتورة سارية المفعول وفقاً للشروط المتفق عليها..."
              className="text-xs min-h-[70px] bg-white border-slate-200 text-slate-800 resize-none"
              dir="rtl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-500">ملاحظات ثابتة (تظهر في كل فاتورة)</Label>
            <Textarea
              value={style.customNotes || ""}
              onChange={(e) => updateStyle("customNotes", e.target.value)}
              placeholder="مثال: شكراً لتعاملكم معنا..."
              className="text-xs min-h-[55px] bg-white border-slate-200 text-slate-800 resize-none"
              dir="rtl"
            />
          </div>
        </div>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2" style={{ backgroundColor: showSaved ? "#059669" : style.primaryColor }}>
          {showSaved ? <CheckCircle className="w-4 h-4" /> : saving ? <Cloud className="w-4 h-4 animate-pulse" /> : <Save className="w-4 h-4" />}
          {saving ? "جاري الحفظ على حسابك..." : showSaved ? "✓ تم الحفظ على حسابك" : "حفظ كإعداد افتراضي للحساب"}
        </Button>
      </CardContent>
    </Card>
  );
}