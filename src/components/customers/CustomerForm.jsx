import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X } from "lucide-react";
import LocalizedField from "@/components/LocalizedField";
import { useLanguage } from "@/components/LanguageContext";

export default function CustomerForm({ customer, onSave, onCancel, isLoading }) {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    phone: "",
    email: "",
    address: "",
    address_en: "",
    tax_number: "",
    notes: "",
    notes_en: "",
    ...customer,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name?.trim()) {
      alert(language === 'ar' ? 'يجب إدخال اسم العميل' : 'Customer name is required');
      return;
    }
    
    if (formData.email && !formData.email.includes('@')) {
      alert(language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address');
      return;
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">{language === 'ar' ? t('customer_information') : t('customer_information')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <LocalizedField
            label={t('customer_name')}
            labelEn={t('customer_name')}
            value={formData.name}
            valueEn={formData.name_en}
            onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
            onChangeEn={(val) => setFormData(prev => ({ ...prev, name_en: val }))}
            placeholder={language === 'ar' ? 'أدخل اسم العميل' : 'Enter customer name'}
            placeholderEn={language === 'ar' ? 'أدخل اسم العميل' : 'Enter customer name'}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label>{language === 'ar' ? t('phone_number') : t('phone_number')}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? t('email') : t('email')}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? t('tax_number') : t('tax_number')}</Label>
              <Input
                value={formData.tax_number}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
                placeholder="123456789"
                dir="ltr"
              />
            </div>
          </div>

          <LocalizedField
            label={t('address')}
            labelEn={t('address')}
            value={formData.address}
            valueEn={formData.address_en}
            onChange={(val) => setFormData(prev => ({ ...prev, address: val }))}
            onChangeEn={(val) => setFormData(prev => ({ ...prev, address_en: val }))}
            placeholder={language === 'ar' ? 'العنوان الكامل' : 'Full address'}
            placeholderEn={language === 'ar' ? 'العنوان الكامل' : 'Full address'}
          />

          <LocalizedField
            label={t('notes')}
            labelEn={t('notes')}
            value={formData.notes}
            valueEn={formData.notes_en}
            onChange={(val) => setFormData(prev => ({ ...prev, notes: val }))}
            onChangeEn={(val) => setFormData(prev => ({ ...prev, notes_en: val }))}
            placeholder={language === 'ar' ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
            placeholderEn={language === 'ar' ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
            multiline={true}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 ml-2" />
          {language === 'ar' ? t('cancel') : t('cancel')}
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 ml-2" />
          {isLoading ? t('saving') : t('save_customer')}
        </Button>
      </div>
    </form>
  );
}