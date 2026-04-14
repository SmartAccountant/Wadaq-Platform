import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";

export default function CreditNoteView({ creditNote, onClose, companyInfo }) {
  const { language } = useLanguage();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = creditNote.qr_code;
    link.download = `credit-note-${creditNote.credit_note_number}-qr.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-rose-600">
          {language === 'ar' ? 'إشعار دائن' : 'Credit Note'}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-white border-2 border-rose-200 shadow-xl print:shadow-none">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 pb-8 border-b-2 border-rose-200">
            <div>
              {companyInfo?.logo && (
                <img 
                  src={companyInfo.logo} 
                  alt="Logo" 
                  className="h-16 mb-4 object-contain"
                />
              )}
              <h1 className="text-4xl font-bold text-rose-600 mb-2">
                {language === 'ar' ? 'إشعار دائن' : 'CREDIT NOTE'}
              </h1>
              <p className="text-slate-600 text-lg">
                {language === 'ar' ? 'رقم' : 'Number'}: <span className="font-bold text-rose-600">{creditNote.credit_note_number}</span>
              </p>
              <p className="text-slate-500 text-sm mt-2">
                {language === 'ar' ? 'للفاتورة رقم' : 'For Invoice'}: {creditNote.original_invoice_number}
              </p>
              <Badge className="bg-rose-100 text-rose-700 border-0 mt-3">
                {language === 'ar' ? 'مرتجع' : 'Return'}
              </Badge>
            </div>
            <div className={language === 'ar' ? 'text-right' : 'text-left'}>
              <p className="font-semibold text-slate-800">{language === 'ar' ? 'التاريخ' : 'Date'}</p>
              <p className="text-slate-600">
                {creditNote.date && format(new Date(creditNote.date), "d MMMM yyyy")}
              </p>
              
              {/* QR Code */}
              {creditNote.qr_code && (
                <div className="mt-6">
                  <img 
                    src={creditNote.qr_code} 
                    alt="QR Code" 
                    className="w-32 h-32 border-2 border-rose-200 rounded-lg"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDownloadQR}
                    className="mt-2 text-xs text-rose-600"
                  >
                    <Download className="w-3 h-3 ml-1" />
                    {language === 'ar' ? 'تحميل QR' : 'Download QR'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8 bg-rose-50 p-4 rounded-lg border border-rose-100">
            <p className="text-sm text-rose-600 font-semibold mb-1">
              {language === 'ar' ? 'إشعار مرسل إلى' : 'Credit Note To'}
            </p>
            <p className="text-xl font-semibold text-slate-800">{creditNote.customer_name}</p>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-rose-200">
                  <th className={`${language === 'ar' ? 'text-right' : 'text-left'} py-3 text-sm font-semibold text-slate-600`}>
                    {language === 'ar' ? 'المنتج' : 'Product'}
                  </th>
                  <th className="text-center py-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'الكمية المرتجعة' : 'Returned Qty'}
                  </th>
                  <th className="text-center py-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'السعر' : 'Price'}
                  </th>
                  <th className={`${language === 'ar' ? 'text-left' : 'text-right'} py-3 text-sm font-semibold text-slate-600`}>
                    {language === 'ar' ? 'الإجمالي' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {creditNote.items?.map((item, index) => (
                  <tr key={index} className="border-b border-rose-100">
                    <td className={`py-4 text-slate-800 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{item.product_name}</td>
                    <td className="py-4 text-center text-rose-600 font-semibold">{Math.abs(item.quantity)}</td>
                    <td className="py-4 text-center text-slate-600">{Math.abs(item.price).toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</td>
                    <td className={`py-4 font-medium text-rose-600 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                      -{Math.abs(item.total).toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className={`flex ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{language === 'ar' ? 'المجموع الفرعي المسترد' : 'Subtotal Refunded'}</span>
                <span className="font-medium text-rose-600">-{Math.abs(creditNote.subtotal).toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
              {creditNote.tax_amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{language === 'ar' ? 'ضريبة القيمة المضافة المستردة' : 'VAT Refunded'} ({creditNote.tax_rate}%)</span>
                  <span className="font-medium text-rose-600">-{Math.abs(creditNote.tax_amount).toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold border-t-2 border-rose-200 pt-4">
                <span className="text-slate-800">{language === 'ar' ? 'الإجمالي المسترد' : 'Total Refunded'}</span>
                <span className="text-rose-600">-{Math.abs(creditNote.total).toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {creditNote.notes && (
            <div className="mt-8 pt-8 border-t-2 border-rose-200 bg-rose-50 p-4 rounded-lg">
              <p className="text-sm text-rose-600 font-semibold mb-2">{language === 'ar' ? 'شروط وملاحظات' : 'Terms & Notes'}</p>
              <p className="text-[10px] text-slate-700 leading-relaxed whitespace-pre-line">{creditNote.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              {language === 'ar' 
                ? 'هذا إشعار دائن رسمي يؤكد استرداد المبلغ المذكور أعلاه'
                : 'This is an official credit note confirming the refund of the above amount'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}