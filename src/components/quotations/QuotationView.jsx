import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Calendar, User, Phone, Mail, MapPin, Printer, Download, Lock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import { Wadaq } from "@/api/WadaqClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function QuotationView({ quotation, onBack, onConvertToInvoice, isConverting }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    Wadaq.auth.me().then(setUser).catch(() => {});
  }, []);

  const statusMap = {
    draft: { label: language === 'ar' ? 'مسودة' : 'Draft', color: "bg-slate-100 text-slate-700" },
    sent: { label: language === 'ar' ? 'مرسل' : 'Sent', color: "bg-blue-100 text-blue-700" },
    accepted: { label: language === 'ar' ? 'مقبول' : 'Accepted', color: "bg-emerald-100 text-emerald-700" },
    rejected: { label: language === 'ar' ? 'مرفوض' : 'Rejected', color: "bg-rose-100 text-rose-700" },
    converted: { label: language === 'ar' ? 'تم التحويل' : 'Converted', color: "bg-purple-100 text-purple-700" },
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConvertClick = () => {
    // Check if user has Pro or Enterprise plan
    const hasPremiumAccess = user?.subscription_plan === 'pro' || 
                              user?.subscription_plan === 'enterprise' ||
                              user?.subscription_plan === 'founder';
    
    if (!hasPremiumAccess) {
      setShowUpgradeDialog(true);
    } else {
      onConvertToInvoice();
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeDialog(false);
    navigate(createPageUrl('Subscription'));
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 ml-2" />
          {language === 'ar' ? 'رجوع' : 'Back'}
        </Button>
        <div className="flex gap-2">
          {quotation.status !== 'converted' && (
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleConvertClick}
              disabled={isConverting}
            >
              <FileText className="w-4 h-4 ml-2" />
              {isConverting 
                ? (language === 'ar' ? 'جاري التحويل...' : 'Converting...') 
                : (language === 'ar' ? 'تحويل إلى فاتورة' : 'Convert to Invoice')}
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'طباعة' : 'Print'}
          </Button>
        </div>
      </div>

      {/* Quotation Content */}
      <Card className="invoice-content">
        <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl mb-2">
                {language === 'ar' ? 'عرض سعر' : 'Quotation'}
              </CardTitle>
              <p className="text-slate-600 font-bold">{quotation.quote_number}</p>
            </div>
            <Badge className={`${statusMap[quotation.status]?.color} text-lg px-4 py-2`}>
              {statusMap[quotation.status]?.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Customer & Date Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 border-b pb-2">
                {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
              </h3>
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</p>
                  <p className="font-medium">{quotation.customer_name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 border-b pb-2">
                {language === 'ar' ? 'معلومات العرض' : 'Quote Information'}
              </h3>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">{language === 'ar' ? 'تاريخ العرض' : 'Quote Date'}</p>
                  <p className="font-medium">
                    {quotation.date && format(new Date(quotation.date), "d MMMM yyyy")}
                  </p>
                </div>
              </div>
              {quotation.valid_until && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-orange-500 mt-1" />
                  <div>
                    <p className="text-sm text-slate-500">{language === 'ar' ? 'صالح حتى' : 'Valid Until'}</p>
                    <p className="font-medium text-orange-600">
                      {format(new Date(quotation.valid_until), "d MMMM yyyy")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">
              {language === 'ar' ? 'بنود العرض' : 'Quote Items'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-right p-3 font-semibold">#</th>
                    <th className="text-right p-3 font-semibold">{language === 'ar' ? 'المنتج' : 'Product'}</th>
                    <th className="text-center p-3 font-semibold">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                    <th className="text-center p-3 font-semibold">{language === 'ar' ? 'السعر' : 'Price'}</th>
                    <th className="text-center p-3 font-semibold">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items?.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{item.product_name}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-center" dir="ltr">{item.price?.toLocaleString()}</td>
                      <td className="p-3 text-center font-medium" dir="ltr">{item.total?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-3 bg-slate-50 p-6 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span className="font-medium" dir="ltr">{quotation.subtotal?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
              
              {quotation.apply_vat && quotation.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{language === 'ar' ? `ضريبة القيمة المضافة (${quotation.tax_rate}%)` : `VAT (${quotation.tax_rate}%)`}</span>
                  <span className="font-medium" dir="ltr">{quotation.tax_amount?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
              )}

              {quotation.discount > 0 && (
                <div className="flex justify-between text-sm text-rose-600">
                  <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                  <span className="font-medium" dir="ltr">-{quotation.discount?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold border-t-2 border-slate-300 pt-3">
                <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span className="text-blue-600" dir="ltr">{quotation.total?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="border-t pt-6">
              <h3 className="font-bold text-slate-700 mb-3">{language === 'ar' ? 'ملاحظات' : 'Notes'}</h3>
              <p className="text-slate-600 whitespace-pre-wrap">{quotation.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-xl">
                {language === 'ar' ? 'ميزة متقدمة' : 'Premium Feature'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              {language === 'ar' 
                ? 'ميزة تحويل عرض السعر إلى فاتورة متاحة في الباقة الاحترافية وما فوق'
                : 'The Convert to Invoice feature is available in Pro plan and above'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
              className="w-full sm:w-auto"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleUpgrade}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {language === 'ar' ? 'اشترك الآن في الباقة الاحترافية' : 'Upgrade Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}