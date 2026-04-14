import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageContext";

export default function PaymentVoucherForm({ accounts, onSave, onCancel }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    beneficiary_name: "",
    amount: "",
    payment_method: "cash",
    account_name: accounts[0]?.account_name || "",
    description: "",
    category: "expense",
    status: "draft"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Generate voucher number
    const voucherNumber = `PAY-${Date.now().toString().slice(-6)}`;
    
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
          {language === 'ar' ? 'سند صرف جديد' : 'New Payment Voucher'}
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
              <Label>{language === 'ar' ? 'اسم المستفيد' : 'Beneficiary Name'}</Label>
              <Input
                value={formData.beneficiary_name}
                onChange={(e) => setFormData({...formData, beneficiary_name: e.target.value})}
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
                <option value="expense">{language === 'ar' ? 'مصروف' : 'Expense'}</option>
                <option value="salary">{language === 'ar' ? 'راتب' : 'Salary'}</option>
                <option value="supplier_payment">{language === 'ar' ? 'دفع لمورد' : 'Supplier Payment'}</option>
                <option value="loan_repayment">{language === 'ar' ? 'سداد قرض' : 'Loan Repayment'}</option>
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
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700">
              {language === 'ar' ? 'حفظ السند' : 'Save Voucher'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}