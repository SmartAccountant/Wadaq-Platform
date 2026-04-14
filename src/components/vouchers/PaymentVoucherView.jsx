import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Printer, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function PaymentVoucherView({ voucher, onClose, companyInfo, language }) {
  const handlePrint = () => {
    const printContent = document.querySelector('.voucher-print-area');
    const originalBody = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    document.body.style.background = 'white';
    window.print();
    document.body.innerHTML = originalBody;
    window.location.reload();
  };

  const categoryLabels = {
    expense: language === 'ar' ? 'مصروف' : 'Expense',
    salary: language === 'ar' ? 'راتب' : 'Salary',
    supplier_payment: language === 'ar' ? 'دفع لمورد' : 'Supplier Payment',
    loan_repayment: language === 'ar' ? 'سداد قرض' : 'Loan Repayment',
    other: language === 'ar' ? 'أخرى' : 'Other'
  };

  const paymentMethodLabels = {
    cash: language === 'ar' ? 'نقدي' : 'Cash',
    bank_transfer: language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
    check: language === 'ar' ? 'شيك' : 'Check',
    other: language === 'ar' ? 'أخرى' : 'Other'
  };

  const statusLabels = {
    draft: language === 'ar' ? 'مسودة' : 'Draft',
    approved: language === 'ar' ? 'معتمد' : 'Approved',
    paid: language === 'ar' ? 'مدفوع' : 'Paid',
    cancelled: language === 'ar' ? 'ملغي' : 'Cancelled'
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto no-print">
      <div className="w-full max-w-2xl my-4">
        <div className="flex justify-end gap-2 mb-3 no-print">
          <Button variant="outline" onClick={handlePrint} className="bg-white">
            <Printer className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'طباعة' : 'Print'}
          </Button>
          <Button variant="outline" onClick={onClose} className="bg-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Card className="bg-white shadow-2xl voucher-content">
          <div className="voucher-print-area">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-6 pb-6 border-b-4 border-rose-500">
              {companyInfo?.logo && (
                <img 
                  src={companyInfo.logo} 
                  alt="Logo" 
                  className="h-20 mx-auto mb-4 object-contain"
                />
              )}
              <h1 className="text-4xl font-bold text-rose-600 mb-2">
                {language === 'ar' ? 'سند صرف' : 'PAYMENT VOUCHER'}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-4">
                <ArrowDownCircle className="w-6 h-6 text-rose-500" />
                <p className="text-2xl font-bold text-slate-800">
                  {voucher.voucher_number}
                </p>
              </div>
            </div>

            {/* Company Info */}
            {companyInfo && (
              <div className="mb-8 text-center pb-6 border-b border-slate-200">
                <p className="text-lg font-semibold text-slate-800">{companyInfo.name}</p>
                {companyInfo.address && <p className="text-slate-600 text-sm mt-1">{companyInfo.address}</p>}
                {companyInfo.phone && <p className="text-slate-600 text-sm">{companyInfo.phone}</p>}
                {companyInfo.vat_number && (
                  <p className="text-slate-600 text-sm">
                    {language === 'ar' ? 'الرقم الضريبي:' : 'VAT:'} {companyInfo.vat_number}
                  </p>
                )}
              </div>
            )}

            {/* Voucher Details */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                  <p className="text-xs text-rose-600 font-semibold mb-1">
                    {language === 'ar' ? 'المستفيد' : 'BENEFICIARY'}
                  </p>
                  <p className="text-xl font-bold text-slate-800">{voucher.beneficiary_name}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">
                    {language === 'ar' ? 'التاريخ' : 'DATE'}
                  </p>
                  <p className="text-lg font-medium text-slate-800">
                    {voucher.date && format(new Date(voucher.date), "d MMMM yyyy", { 
                      locale: language === 'ar' ? ar : undefined 
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">
                    {language === 'ar' ? 'الحساب/الخزينة' : 'ACCOUNT'}
                  </p>
                  <p className="text-lg font-medium text-slate-800">{voucher.account_name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-rose-500 p-6 rounded-lg text-white text-center">
                  <p className="text-sm font-semibold mb-2">
                    {language === 'ar' ? 'المبلغ المدفوع' : 'AMOUNT PAID'}
                  </p>
                  <p className="text-4xl font-bold">
                    {voucher.amount?.toLocaleString()}
                  </p>
                  <p className="text-lg mt-1">{language === 'ar' ? 'ريال سعودي' : 'SAR'}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">
                    {language === 'ar' ? 'طريقة الدفع' : 'PAYMENT METHOD'}
                  </p>
                  <Badge className="bg-slate-100 text-slate-700 text-sm">
                    {paymentMethodLabels[voucher.payment_method] || voucher.payment_method}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">
                    {language === 'ar' ? 'التصنيف' : 'CATEGORY'}
                  </p>
                  <Badge className="bg-rose-100 text-rose-700 text-sm">
                    {categoryLabels[voucher.category] || voucher.category}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            {voucher.description && (
              <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 font-semibold mb-2">
                  {language === 'ar' ? 'البيان' : 'DESCRIPTION'}
                </p>
                <p className="text-slate-800 whitespace-pre-wrap">{voucher.description}</p>
              </div>
            )}

            {/* Reference */}
            {voucher.reference && (
              <div className="mb-8">
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  {language === 'ar' ? 'المرجع' : 'REFERENCE'}
                </p>
                <p className="text-slate-800 font-mono">{voucher.reference}</p>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t-2 border-slate-300">
              <div className="text-center">
                <div className="border-t-2 border-slate-400 pt-2 mt-16">
                  <p className="text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'المستفيد' : 'Beneficiary'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-slate-400 pt-2 mt-16">
                  <p className="text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'المحاسب' : 'Accountant'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-slate-400 pt-2 mt-16">
                  <p className="text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'المدير المالي' : 'Financial Manager'}
                  </p>
                </div>
              </div>
            </div>


          </CardContent>
          </div>
        </Card>


        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }

            html, body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            
            .no-print {
              display: none !important;
            }
            
            .voucher-content {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 20mm !important;
              background: white !important;
              box-shadow: none !important;
              overflow: visible !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}