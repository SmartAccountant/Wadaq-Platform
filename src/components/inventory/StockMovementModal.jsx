import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function StockMovementModal({ product, products, onClose, onSave }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    product_id: product?.id || "",
    product_name: product?.name || "",
    type: "in",
    quantity: "",
    reference_type: "manual",
    reference_id: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.quantity) {
      alert(language === 'ar' ? 'الرجاء إدخال جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    
    onSave({
      ...formData,
      quantity: parseFloat(formData.quantity)
    });
  };

  const handleProductChange = (productId) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {language === 'ar' ? 'حركة مخزون جديدة' : 'New Stock Movement'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!product && (
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'المنتج *' : 'Product *'}</Label>
                <select
                  value={formData.product_id}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{language === 'ar' ? 'اختر المنتج' : 'Select Product'}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {language === 'ar' ? p.name : (p.name_en || p.name)}
                      {p.code && ` (${p.code})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'نوع الحركة *' : 'Movement Type *'}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'in' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'in'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <ArrowUpCircle className={`w-8 h-8 mx-auto mb-2 ${
                    formData.type === 'in' ? 'text-emerald-600' : 'text-slate-400'
                  }`} />
                  <p className={`font-medium ${
                    formData.type === 'in' ? 'text-emerald-700' : 'text-slate-600'
                  }`}>
                    {language === 'ar' ? 'إدخال' : 'Stock In'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'out' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'out'
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <ArrowDownCircle className={`w-8 h-8 mx-auto mb-2 ${
                    formData.type === 'out' ? 'text-rose-600' : 'text-slate-400'
                  }`} />
                  <p className={`font-medium ${
                    formData.type === 'out' ? 'text-rose-700' : 'text-slate-600'
                  }`}>
                    {language === 'ar' ? 'إخراج' : 'Stock Out'}
                  </p>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الكمية *' : 'Quantity *'}</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder={language === 'ar' ? 'أدخل الكمية' : 'Enter quantity'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'نوع المرجع' : 'Reference Type'}</Label>
              <select
                value={formData.reference_type}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">{language === 'ar' ? 'يدوي' : 'Manual'}</option>
                <option value="invoice">{language === 'ar' ? 'فاتورة' : 'Invoice'}</option>
                <option value="purchase">{language === 'ar' ? 'شراء' : 'Purchase'}</option>
                <option value="return">{language === 'ar' ? 'مرتجع' : 'Return'}</option>
              </select>
            </div>

            {formData.reference_type !== 'manual' && (
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'رقم المرجع' : 'Reference Number'}</Label>
                <Input
                  value={formData.reference_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_id: e.target.value }))}
                  placeholder={language === 'ar' ? 'رقم الفاتورة أو المرجع' : 'Invoice or reference number'}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={language === 'ar' ? 'أضف ملاحظات...' : 'Add notes...'}
                className="min-h-20"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                <X className="w-4 h-4 ml-2" />
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 ml-2" />
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}