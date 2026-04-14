import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Printer, X } from "lucide-react";

export default function PostSaveModal({ open, onClose, onPrintA4, onPrintThermal, language }) {
  const isAr = language === "ar";

  const actions = [
    {
      icon: <Printer className="w-6 h-6" />,
      label: isAr ? "طباعة حرارية (80mm)" : "Thermal Print (80mm)",
      desc: isAr ? "طابعة الكاشير" : "Receipt printer",
      color: "bg-orange-500 hover:bg-orange-600",
      onClick: onPrintThermal,
    },
    {
      icon: <FileText className="w-6 h-6" />,
      label: isAr ? "طباعة A4 / PDF" : "Print A4 / PDF",
      desc: isAr ? "فاتورة كاملة" : "Full invoice",
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: onPrintA4,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white" dir={isAr ? "rtl" : "ltr"}>
        <DialogTitle className="text-lg font-bold text-slate-800 text-center">
          {isAr ? "✅ تم حفظ الفاتورة بنجاح!" : "✅ Invoice saved successfully!"}
        </DialogTitle>
        <p className="text-sm text-slate-500 text-center -mt-2 mb-4">
          {isAr ? "اختر ما تريد فعله الآن:" : "What would you like to do now?"}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); onClose(); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl text-white transition-all ${action.color} shadow-sm hover:shadow-md`}
            >
              {action.icon}
              <span className="font-semibold text-sm text-center leading-tight">{action.label}</span>
              <span className="text-xs opacity-80">{action.desc}</span>
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full mt-2 text-slate-500 hover:text-slate-700"
          onClick={onClose}
        >
          <X className="w-4 h-4 ml-1" />
          {isAr ? "تخطي / لاحقاً" : "Skip / Later"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}