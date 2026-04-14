import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Phone, Mail, MapPin, FileText, Save, Calendar, DollarSign } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function CustomerDetails({ customer, invoices = [], onClose, onUpdateNotes }) {
  const { language } = useLanguage();
  const [notes, setNotes] = useState(customer.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const displayName = language === 'ar' ? customer.name : (customer.name_en || customer.name);
  const displayAddress = language === 'ar' ? customer.address : (customer.address_en || customer.address);

  const statusMap = {
    draft: { label: language === 'ar' ? 'مسودة' : 'Draft', color: "bg-slate-100 text-slate-700" },
    sent: { label: language === 'ar' ? 'مرسلة' : 'Sent', color: "bg-blue-100 text-blue-700" },
    paid: { label: language === 'ar' ? 'مدفوعة' : 'Paid', color: "bg-emerald-100 text-emerald-700" },
    overdue: { label: language === 'ar' ? 'متأخرة' : 'Overdue', color: "bg-rose-100 text-rose-700" },
    cancelled: { label: language === 'ar' ? 'ملغية' : 'Cancelled', color: "bg-slate-100 text-slate-500" },
  };

  const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id || inv.customer_name === customer.name);
  const totalPaid = customerInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPending = customerInvoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((sum, inv) => sum + (inv.total || 0), 0);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    await onUpdateNotes(notes);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">
          {language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Customer Info Card */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
              {displayName?.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-xl">{displayName}</CardTitle>
              {customer.tax_number && (
                <p className="text-sm text-slate-500 mt-1">
                  {language === 'ar' ? 'الرقم الضريبي:' : 'Tax Number:'} {customer.tax_number}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.phone && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Phone className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">{language === 'ar' ? 'الهاتف' : 'Phone'}</p>
                  <p className="font-medium text-slate-800" dir="ltr">{customer.phone}</p>
                </div>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Mail className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                  <p className="font-medium text-slate-800 truncate" dir="ltr">{customer.email}</p>
                </div>
              </div>
            )}
            {displayAddress && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg md:col-span-2">
                <MapPin className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">{language === 'ar' ? 'العنوان' : 'Address'}</p>
                  <p className="font-medium text-slate-800">{displayAddress}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <p className="text-sm text-emerald-700 font-medium">
                {language === 'ar' ? 'إجمالي المدفوعات' : 'Total Paid'}
              </p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{totalPaid.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-700 font-medium">
                {language === 'ar' ? 'مبالغ معلقة' : 'Pending Amounts'}
              </p>
            </div>
            <p className="text-2xl font-bold text-amber-700">{totalPending.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-700 font-medium">
                {language === 'ar' ? 'عدد الفواتير' : 'Total Invoices'}
              </p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{customerInvoices.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices History */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {language === 'ar' ? 'سجل الفواتير' : 'Invoice History'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {customerInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {language === 'ar' ? 'لا توجد فواتير لهذا العميل' : 'No invoices for this customer'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {customerInvoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-slate-800">{invoice.invoice_number}</p>
                        <Badge className={statusMap[invoice.status]?.color}>
                          {statusMap[invoice.status]?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {invoice.date && format(new Date(invoice.date), "d MMMM yyyy", { locale: language === 'ar' ? ar : undefined })}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xl font-bold text-slate-800">
                        {invoice.total?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">
            {language === 'ar' ? 'ملاحظات خاصة' : 'Private Notes'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={language === 'ar' ? 'أضف ملاحظات خاصة عن هذا العميل...' : 'Add private notes about this customer...'}
            className="min-h-32"
          />
          <Button
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 ml-2" />
            {isSaving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ الملاحظات' : 'Save Notes')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}