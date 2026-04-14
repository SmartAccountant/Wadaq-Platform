import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Save, AlertTriangle, RotateCcw } from "lucide-react";
import { format } from "date-fns";

export default function CreditNoteForm({ invoice, onSave, onCancel, isLoading, language }) {
  const [selectedItems, setSelectedItems] = useState({});
  const [returnQuantities, setReturnQuantities] = useState({});
  const [notes, setNotes] = useState("");
  const [creditNoteNumber, setCreditNoteNumber] = useState("");

  useEffect(() => {
    // توليد رقم الإشعار الدائن
    const timestamp = Date.now().toString().slice(-6);
    setCreditNoteNumber(`CN-${timestamp}`);
    
    // تحديد جميع البنود بشكل افتراضي
    const initialSelected = {};
    const initialQuantities = {};
    invoice.items?.forEach((item, index) => {
      initialSelected[index] = true;
      initialQuantities[index] = item.quantity;
    });
    setSelectedItems(initialSelected);
    setReturnQuantities(initialQuantities);
  }, [invoice]);

  const toggleItem = (index) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const updateReturnQuantity = (index, quantity) => {
    const maxQty = invoice.items[index].quantity;
    const validQty = Math.min(Math.max(0, quantity), maxQty);
    setReturnQuantities(prev => ({
      ...prev,
      [index]: validQty
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    
    invoice.items?.forEach((item, index) => {
      if (selectedItems[index] && returnQuantities[index] > 0) {
        subtotal += item.price * returnQuantities[index];
      }
    });

    const taxAmount = invoice.apply_vat ? (subtotal * (invoice.tax_rate || 15)) / 100 : 0;
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { subtotal, taxAmount, total } = calculateTotals();

    if (total === 0) {
      alert(language === 'ar' ? 'يجب اختيار بند واحد على الأقل' : 'At least one item must be selected');
      return;
    }

    const creditNoteItems = invoice.items
      .map((item, index) => {
        if (selectedItems[index] && returnQuantities[index] > 0) {
          return {
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: returnQuantities[index],
            price: item.price,
            total: item.price * returnQuantities[index]
          };
        }
        return null;
      })
      .filter(item => item !== null);

    const creditNoteData = {
      credit_note_number: creditNoteNumber,
      original_invoice_id: invoice.id,
      original_invoice_number: invoice.invoice_number,
      customer_id: invoice.customer_id,
      customer_name: invoice.customer_name,
      date: format(new Date(), "yyyy-MM-dd"),
      items: creditNoteItems,
      subtotal: -subtotal,
      tax_rate: invoice.tax_rate || 15,
      tax_amount: -taxAmount,
      total: -total,
      notes: notes
    };

    onSave(creditNoteData);
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <form onSubmit={handleSubmit}>
          <CardHeader className="bg-gradient-to-r from-rose-50 to-rose-100 border-b border-rose-200 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-800">
                    {language === 'ar' ? 'إنشاء إشعار دائن' : 'Create Credit Note'}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    {language === 'ar' ? 'للفاتورة:' : 'For Invoice:'} {invoice.invoice_number}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="text-slate-600 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* معلومات الإشعار */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-rose-50 p-4 rounded-lg border border-rose-200">
              <div>
                <Label className="text-slate-700 font-medium">
                  {language === 'ar' ? 'رقم الإشعار' : 'Credit Note Number'}
                </Label>
                <Input
                  value={creditNoteNumber}
                  onChange={(e) => setCreditNoteNumber(e.target.value)}
                  className="mt-1 bg-white font-mono font-bold"
                  required
                />
              </div>
              <div>
                <Label className="text-slate-700 font-medium">
                  {language === 'ar' ? 'العميل' : 'Customer'}
                </Label>
                <Input
                  value={invoice.customer_name}
                  className="mt-1 bg-white"
                  disabled
                />
              </div>
              <div>
                <Label className="text-slate-700 font-medium">
                  {language === 'ar' ? 'التاريخ' : 'Date'}
                </Label>
                <Input
                  value={format(new Date(), "yyyy-MM-dd")}
                  className="mt-1 bg-white"
                  disabled
                />
              </div>
            </div>

            {/* تحذير */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 text-sm">
                  {language === 'ar' ? 'ملاحظة هامة' : 'Important Note'}
                </p>
                <p className="text-amber-800 text-sm mt-1">
                  {language === 'ar' 
                    ? 'الإشعار الدائن سيسترد المبلغ للعميل وسيعيد المنتجات للمخزون'
                    : 'Credit note will refund the amount to customer and return products to inventory'}
                </p>
              </div>
            </div>

            {/* البنود المرتجعة */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {language === 'ar' ? 'اختر البنود المرتجعة' : 'Select Items to Return'}
              </h3>
              
              <div className="space-y-3">
                {invoice.items?.map((item, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedItems[index] 
                        ? 'bg-rose-50 border-rose-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex items-center h-full pt-1">
                        <Checkbox
                          checked={selectedItems[index] || false}
                          onCheckedChange={() => toggleItem(index)}
                          className="w-5 h-5"
                        />
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="md:col-span-2">
                          <p className="font-semibold text-slate-800">{item.product_name}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {language === 'ar' ? 'السعر:' : 'Price:'} {item.price?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                          </p>
                        </div>

                        <div>
                          <Label className="text-xs text-slate-600 mb-1 block">
                            {language === 'ar' ? 'الكمية المرتجعة' : 'Return Quantity'}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => updateReturnQuantity(index, (returnQuantities[index] || 0) - 1)}
                              disabled={!selectedItems[index]}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={returnQuantities[index] || 0}
                              onChange={(e) => updateReturnQuantity(index, parseFloat(e.target.value) || 0)}
                              disabled={!selectedItems[index]}
                              className="w-20 h-8 text-center"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => updateReturnQuantity(index, (returnQuantities[index] || 0) + 1)}
                              disabled={!selectedItems[index]}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {language === 'ar' ? 'من أصل' : 'Out of'} {item.quantity}
                          </p>
                        </div>

                        <div className="text-right">
                          <Label className="text-xs text-slate-600 mb-1 block">
                            {language === 'ar' ? 'المبلغ المسترد' : 'Refund Amount'}
                          </Label>
                          <p className="text-lg font-bold text-rose-600">
                            -{(item.price * (returnQuantities[index] || 0)).toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* الملاحظات */}
            <div>
              <Label className="text-slate-700 font-medium mb-2 block">
                {language === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'ar' 
                  ? 'مثال: منتجات تالفة، عدم رضا العميل، خطأ في الفاتورة...'
                  : 'Example: Damaged products, customer dissatisfaction, invoice error...'}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* ملخص المبالغ */}
            <div className="bg-gradient-to-r from-rose-50 to-rose-100 rounded-xl p-6 border-2 border-rose-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {language === 'ar' ? 'ملخص الاسترداد' : 'Refund Summary'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-slate-700">
                  <span>{language === 'ar' ? 'المجموع الفرعي المسترد' : 'Subtotal Refund'}</span>
                  <span className="font-bold text-rose-600">-{subtotal.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
                {invoice.apply_vat && (
                  <div className="flex justify-between text-slate-700">
                    <span>{language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} ({invoice.tax_rate || 15}%)</span>
                    <span className="font-bold text-rose-600">-{taxAmount.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-bold border-t-2 border-rose-300 pt-3">
                  <span className="text-slate-800">{language === 'ar' ? 'الإجمالي المسترد' : 'Total Refund'}</span>
                  <span className="text-rose-600">-{total.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
              </div>
            </div>

            {/* الأزرار */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                disabled={isLoading}
                className="flex-1 h-12"
              >
                <X className="w-4 h-4 ml-2" />
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || total === 0}
                className="flex-1 h-12 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white"
              >
                <Save className="w-4 h-4 ml-2" />
                {isLoading 
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                  : (language === 'ar' ? 'إصدار الإشعار الدائن' : 'Issue Credit Note')}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}