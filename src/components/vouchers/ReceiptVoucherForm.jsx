import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageContext";

export default function ReceiptVoucherForm({ accounts, onSave, onCancel }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    payer_name: "",
    amount: "",
    payment_method: "cash",
    account_name: accounts[0]?.account_name || "",
    description: "",
    category: "invoice_payment",
    status: "draft"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Generate voucher number
    const voucherNumber = `REC-${Date.now().toString().slice(-6)}`;
    
    onSave({
      ...formData,
      voucher_number: voucherNumber,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {language === 'ar' ? 'سند قبض جديد' : 'New Receipt Voucher'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ar' ? 'التاريخ' : 'Date'}</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label>{language === 'ar' ? 'اسم الدافع' : 'Payer Name'}</Label>
              <Input
                value={formData.payer_name}
                onChange={(e) => setFormData({...formData, payer_name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label>{language === 'ar' ? 'المبلغ' : 'Amount'}</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</Label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="cash">{language === 'ar' ? 'نقدي' : 'Cash'}</option>
                <option value="bank_transfer">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                <option value="check">{language === 'ar' ? 'شيك' : 'Check'}</option>
                <option value="credit_card">{language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</option>
                <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
            
            <div>
              <Label>{language === 'ar' ? 'الحساب/الخزينة' : 'Account'}</Label>
              <select
                value={formData.account_name}
                onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.account_name}>
                    {acc.account_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label>{language === 'ar' ? 'التصنيف' : 'Category'}</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="invoice_payment">{language === 'ar' ? 'دفعة فاتورة' : 'Invoice Payment'}</option>
                <option value="sale">{language === 'ar' ? 'مبيعات' : 'Sale'}</option>
                <option value="loan">{language === 'ar' ? 'قرض' : 'Loan'}</option>
                <option value="investment">{language === 'ar' ? 'استثمار' : 'Investment'}</option>
                <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
          </div>
          
          <div>
            <Label>{language === 'ar' ? 'البيان' : 'Description'}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {language === 'ar' ? 'حفظ السند' : 'Save Voucher'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}