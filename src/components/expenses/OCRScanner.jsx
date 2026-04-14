import React, { useState, useRef } from "react";
import { Wadaq } from "@/api/WadaqCore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Scan, CheckCircle, Loader2, X, FileImage, Sparkles } from "lucide-react";

export default function OCRScanner({ onExtracted, onClose }) {
  const [step, setStep] = useState("upload"); // upload | scanning | review
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setStep("scanning");

    try {
      // Upload file first
      const { file_url } = await Wadaq.integrations.Core.UploadFile({ file });

      // Use AI to extract invoice data
      const result = await Wadaq.integrations.Core.InvokeLLM({
        prompt: `استخرج البيانات التالية من هذه الفاتورة أو الإيصال:
1. اسم المورد أو الشركة (supplier_name)
2. المبلغ الإجمالي بدون ضريبة (subtotal) كرقم فقط
3. مبلغ ضريبة القيمة المضافة (tax_amount) كرقم فقط
4. المبلغ الإجمالي شاملاً الضريبة (total) كرقم فقط
5. تاريخ الفاتورة بصيغة YYYY-MM-DD (date)
6. وصف مختصر للمصروف (description)
7. تصنيف المصروف من القائمة التالية فقط: rent, utilities, salaries, supplies, marketing, maintenance, transportation, other (category)

أعد النتيجة كـ JSON فقط بدون أي نص إضافي.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            supplier_name: { type: "string" },
            subtotal: { type: "number" },
            tax_amount: { type: "number" },
            total: { type: "number" },
            date: { type: "string" },
            description: { type: "string" },
            category: { type: "string" }
          }
        }
      });

      setExtracted({
        supplier_name: result.supplier_name || "",
        subtotal: result.subtotal || 0,
        tax_amount: result.tax_amount || 0,
        total: result.total || 0,
        date: result.date || new Date().toISOString().split("T")[0],
        description: result.description || "",
        category: result.category || "other",
      });
      setStep("review");
    } catch (err) {
      console.error("OCR error:", err);
      alert("حدث خطأ أثناء تحليل الفاتورة. يرجى المحاولة مرة أخرى.");
      setStep("upload");
    } finally {
      setScanning(false);
    }
  };

  const handleConfirm = () => {
    onExtracted({
      title: extracted.description || extracted.supplier_name || "مصروف من فاتورة",
      amount: extracted.total,
      date: extracted.date,
      category: extracted.category,
      notes: `مورد: ${extracted.supplier_name} | صافي: ${extracted.subtotal} | ضريبة: ${extracted.tax_amount}`,
    });
    onClose();
  };

  const categoryLabels = {
    rent: "إيجار", utilities: "خدمات عامة", salaries: "رواتب",
    supplies: "مستلزمات", marketing: "تسويق", maintenance: "صيانة",
    transportation: "نقل ومواصلات", other: "أخرى",
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Scan className="w-5 h-5 text-purple-600" />
            استخراج بيانات الفاتورة بالذكاء الاصطناعي
          </DialogTitle>
        </DialogHeader>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all"
            >
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
              {preview ? (
                <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain mb-3" />
              ) : (
                <FileImage className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              )}
              <p className="text-sm font-medium text-slate-600">
                {file ? file.name : "اضغط لرفع صورة أو PDF للفاتورة"}
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, PDF مدعومة</p>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-700 space-y-1">
              <p className="font-semibold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> ماذا سيستخرج الذكاء الاصطناعي؟</p>
              <p>✓ اسم المورد • المبلغ الإجمالي • مبلغ الضريبة • التاريخ • التصنيف</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
              <Button onClick={handleScan} disabled={!file} className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2">
                <Sparkles className="w-4 h-4" /> تحليل الفاتورة
              </Button>
            </div>
          </div>
        )}

        {/* Step: Scanning */}
        {step === "scanning" && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
            <p className="font-semibold text-slate-700">جاري تحليل الفاتورة...</p>
            <p className="text-sm text-slate-400">يقوم الذكاء الاصطناعي باستخراج البيانات</p>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && extracted && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              تم استخراج البيانات بنجاح — راجع وعدّل إن لزم
            </div>

            <div className="space-y-3">
              {[
                { label: "اسم المورد", key: "supplier_name", type: "text" },
                { label: "المبلغ الإجمالي (ر.س)", key: "total", type: "number" },
                { label: "مبلغ الضريبة (ر.س)", key: "tax_amount", type: "number" },
                { label: "التاريخ", key: "date", type: "date" },
                { label: "الوصف", key: "description", type: "text" },
              ].map(f => (
                <div key={f.key}>
                  <Label className="text-xs text-slate-500">{f.label}</Label>
                  <Input
                    type={f.type}
                    value={extracted[f.key] || ""}
                    onChange={e => setExtracted(p => ({ ...p, [f.key]: f.type === "number" ? +e.target.value : e.target.value }))}
                    className="mt-1"
                  />
                </div>
              ))}
              <div>
                <Label className="text-xs text-slate-500">التصنيف</Label>
                <select
                  value={extracted.category}
                  onChange={e => setExtracted(p => ({ ...p, category: e.target.value }))}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white"
                >
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">رجوع</Button>
              <Button onClick={handleConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2">
                <CheckCircle className="w-4 h-4" /> إضافة كمصروف
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}