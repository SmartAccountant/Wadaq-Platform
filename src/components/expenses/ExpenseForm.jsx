import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X } from "lucide-react";
import { format } from "date-fns";
import LocalizedField from "@/components/LocalizedField";

const categoryLabels = {
  rent: "إيجار",
  utilities: "خدمات عامة",
  salaries: "رواتب",
  supplies: "مستلزمات",
  marketing: "تسويق",
  maintenance: "صيانة",
  transportation: "نقل ومواصلات",
  other: "أخرى",
};

const paymentMethods = {
  cash: "نقداً",
  bank_transfer: "تحويل بنكي",
  credit_card: "بطاقة ائتمان",
  other: "أخرى",
};

export default function ExpenseForm({ expense, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    title: "",
    title_en: "",
    category: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    payment_method: "",
    reference: "",
    notes: "",
    notes_en: "",
    ...expense,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: Number(formData.amount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">تفاصيل المصروف</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <LocalizedField
            label="عنوان المصروف *"
            labelEn="Expense Title *"
            value={formData.title}
            valueEn={formData.title_en}
            onChange={(val) => setFormData(prev => ({ ...prev, title: val }))}
            onChangeEn={(val) => setFormData(prev => ({ ...prev, title_en: val }))}
            placeholder="مثال: فاتورة الكهرباء"
            placeholderEn="e.g., Electricity Bill"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label>التصنيف *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المبلغ *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
                placeholder="0.00"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>التاريخ *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethods).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>رقم المرجع</Label>
              <Input
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="رقم الإيصال أو الفاتورة"
                dir="ltr"
              />
            </div>
          </div>

          <LocalizedField
            label="العنوان"
            labelEn="Address"
            value={formData.address}
            valueEn={formData.address_en}
            onChange={(val) => setFormData(prev => ({ ...prev, address: val }))}
            onChangeEn={(val) => setFormData(prev => ({ ...prev, address_en: val }))}
            placeholder="العنوان الكامل"
            placeholderEn="Full address"
          />

          <LocalizedField
            label="ملاحظات"
            labelEn="Notes"
            value={formData.notes}
            valueEn={formData.notes_en}
            onChange={(val) => setFormData(prev => ({ ...prev, notes: val }))}
            onChangeEn={(val) => setFormData(prev => ({ ...prev, notes_en: val }))}
            placeholder="أي ملاحظات إضافية..."
            placeholderEn="Any additional notes..."
            multiline={true}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 ml-2" />
          إلغاء
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 ml-2" />
          {isLoading ? "جاري الحفظ..." : "حفظ المصروف"}
        </Button>
      </div>
    </form>
  );
}