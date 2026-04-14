import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, FileText, Receipt, Save, CheckCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function PrintOptionsModal({ open, onClose, invoice, onPrintA4, onPrintThermal, onSaveOnly }) {
  const { language, isRTL } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md z-[9999]" dir={isRTL ? "rtl" : "ltr"} style={{ zIndex: 9999 }}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-emerald-500" strokeWidth={2} />
          </div>
          <DialogTitle className="text-2xl text-center mb-2">
            {language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved Successfully'}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {language === 'ar' ? 'ماذا تريد أن تفعل؟' : 'What would you like to do?'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button
            onClick={onSaveOnly}
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            size="lg"
          >
            <Save className={`w-6 h-6 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            <div className={`${isRTL ? 'text-right' : 'text-left'} flex-1`}>
              <div className="font-bold text-lg">
                {language === 'ar' ? 'حفظ فقط' : 'Save Only'}
              </div>
              <div className="text-xs opacity-90">
                {language === 'ar' ? 'إنهاء وإغلاق النافذة' : 'Close and return to list'}
              </div>
            </div>
          </Button>

          <Button
            onClick={onPrintA4}
            className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            size="lg"
          >
            <FileText className={`w-6 h-6 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            <div className={`${isRTL ? 'text-right' : 'text-left'} flex-1`}>
              <div className="font-bold text-lg">
                {language === 'ar' ? 'طباعة A4' : 'Print A4 (PDF)'}
              </div>
              <div className="text-xs opacity-90">
                {language === 'ar' ? 'طباعة على ورق كامل (210×297 مم)' : 'Standard full page (210×297 mm)'}
              </div>
            </div>
          </Button>

          <Button
            onClick={onPrintThermal}
            className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-white shadow-md"
            size="lg"
          >
            <Receipt className={`w-6 h-6 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            <div className={`${isRTL ? 'text-right' : 'text-left'} flex-1`}>
              <div className="font-bold text-lg">
                {language === 'ar' ? 'طباعة حرارية 80mm' : 'Thermal Print (80mm)'}
              </div>
              <div className="text-xs opacity-90">
                {language === 'ar' ? 'طباعة على طابعة الإيصالات' : 'Receipt printer format'}
              </div>
            </div>
          </Button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          {language === 'ar' ? 'رقم الفاتورة:' : 'Invoice Number:'} {invoice?.invoice_number}
        </p>
      </DialogContent>
    </Dialog>
  );
}