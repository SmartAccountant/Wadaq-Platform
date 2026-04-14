import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function InvoicePDF({ invoice, companyInfo, onBack }) {
  const { language } = useLanguage();

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const items = invoice?.items || [];
  const subtotal = invoice?.subtotal || 0;
  const taxAmount = invoice?.tax_amount || 0;
  const discount = invoice?.discount || 0;
  const total = invoice?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 no-print">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 ml-2" />
          {language === 'ar' ? 'رجوع' : 'Back'}
        </Button>
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="w-4 h-4 ml-2" />
          {language === 'ar' ? 'طباعة PDF' : 'Print PDF'}
        </Button>
      </div>

      <div className="invoice-content bg-white text-black p-8 rounded-xl shadow-lg" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-200 pb-6">
          <div>
            {companyInfo?.logo && (
              <img src={companyInfo.logo} alt="Logo" className="h-16 object-contain mb-2" />
            )}
            <h2 className="text-xl font-bold text-slate-900">{companyInfo?.name || ''}</h2>
            {companyInfo?.address && <p className="text-sm text-slate-600">{companyInfo.address}</p>}
            {companyInfo?.phone && <p className="text-sm text-slate-600">{companyInfo.phone}</p>}
            {companyInfo?.email && <p className="text-sm text-slate-600">{companyInfo.email}</p>}
            {companyInfo?.vat_number && (
              <p className="text-sm text-slate-600">
                {language === 'ar' ? 'الرقم الضريبي: ' : 'VAT: '}{companyInfo.vat_number}
              </p>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {language === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'}
            </h1>
            <p className="text-slate-600">
              {language === 'ar' ? 'رقم الفاتورة: ' : 'Invoice #: '}<strong>{invoice?.invoice_number}</strong>
            </p>
            <p className="text-slate-600">
              {language === 'ar' ? 'التاريخ: ' : 'Date: '}{formatDate(invoice?.date)}
            </p>
            {invoice?.due_date && (
              <p className="text-slate-600">
                {language === 'ar' ? 'تاريخ الاستحقاق: ' : 'Due Date: '}{formatDate(invoice.due_date)}
              </p>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6 bg-slate-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-700 mb-2">{language === 'ar' ? 'بيانات العميل' : 'Customer Info'}</h3>
          <p className="font-semibold text-slate-900">{invoice?.customer_name}</p>
          {invoice?.customer_address && <p className="text-sm text-slate-600">{invoice.customer_address}</p>}
          {invoice?.customer_vat_number && (
            <p className="text-sm text-slate-600">
              {language === 'ar' ? 'الرقم الضريبي: ' : 'VAT: '}{invoice.customer_vat_number}
            </p>
          )}
        </div>

        {/* Items Table */}
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="p-3 text-right text-sm">{language === 'ar' ? 'المنتج/الخدمة' : 'Item'}</th>
              <th className="p-3 text-center text-sm">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
              <th className="p-3 text-center text-sm">{language === 'ar' ? 'السعر' : 'Price'}</th>
              <th className="p-3 text-left text-sm">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="p-3 text-right text-sm border-b border-slate-100">{item.product_name}</td>
                <td className="p-3 text-center text-sm border-b border-slate-100">{item.quantity}</td>
                <td className="p-3 text-center text-sm border-b border-slate-100">{Number(item.price).toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</td>
                <td className="p-3 text-left text-sm border-b border-slate-100">{Number(item.total).toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span>{subtotal.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-rose-600">
                <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                <span>- {discount.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
            )}
            {invoice?.apply_vat !== false && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{language === 'ar' ? `ضريبة القيمة المضافة (${invoice?.tax_rate || 15}%)` : `VAT (${invoice?.tax_rate || 15}%)`}</span>
                <span>{taxAmount.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t-2 border-slate-800 pt-2">
              <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
              <span>{total.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        {invoice?.qr_code && (
          <div className="flex justify-center mb-4">
            <img src={`data:image/png;base64,${invoice.qr_code}`} alt="QR" className="w-24 h-24" />
          </div>
        )}

        {/* Notes */}
        {invoice?.notes && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600"><strong>{language === 'ar' ? 'ملاحظات: ' : 'Notes: '}</strong>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}