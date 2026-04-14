import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowUpCircle, ArrowDownCircle, Edit } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function StockHistoryModal({ product, movements, onClose }) {
  const { language } = useLanguage();

  const typeMap = {
    in: { label: language === 'ar' ? 'إدخال' : 'In', color: "bg-emerald-100 text-emerald-700", icon: ArrowUpCircle },
    out: { label: language === 'ar' ? 'إخراج' : 'Out', color: "bg-rose-100 text-rose-700", icon: ArrowDownCircle },
    adjustment: { label: language === 'ar' ? 'تعديل' : 'Adjustment', color: "bg-blue-100 text-blue-700", icon: Edit }
  };

  const refTypeMap = {
    manual: language === 'ar' ? 'يدوي' : 'Manual',
    invoice: language === 'ar' ? 'فاتورة' : 'Invoice',
    purchase: language === 'ar' ? 'شراء' : 'Purchase',
    return: language === 'ar' ? 'مرتجع' : 'Return'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white max-h-[90vh] flex flex-col">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {language === 'ar' ? 'سجل حركات المخزون' : 'Stock Movement History'}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'ar' ? product.name : (product.name_en || product.name)}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto">
          {movements.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {language === 'ar' ? 'لا توجد حركات مخزون لهذا المنتج' : 'No stock movements for this product'}
            </div>
          ) : (
            <div className="space-y-4">
              {movements.map((movement, index) => {
                const typeInfo = typeMap[movement.type];
                const Icon = typeInfo.icon;
                
                return (
                  <div key={movement.id || index} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${typeInfo.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <Badge className={typeInfo.color}>
                            {typeInfo.label}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            {movement.date && format(new Date(movement.date), "d MMMM yyyy", { locale: language === 'ar' ? ar : undefined })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${movement.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {movement.type === 'in' ? '+' : '-'}{Math.abs(movement.quantity)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">{language === 'ar' ? 'الكمية السابقة' : 'Previous Qty'}</p>
                        <p className="font-medium text-slate-800">{movement.previous_quantity}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">{language === 'ar' ? 'الكمية الجديدة' : 'New Qty'}</p>
                        <p className="font-medium text-slate-800">{movement.new_quantity}</p>
                      </div>
                    </div>

                    {movement.reference_type && movement.reference_type !== 'manual' && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                          {language === 'ar' ? 'المرجع:' : 'Reference:'} {refTypeMap[movement.reference_type]}
                          {movement.reference_id && ` - ${movement.reference_id}`}
                        </p>
                      </div>
                    )}

                    {movement.notes && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500">{language === 'ar' ? 'ملاحظات:' : 'Notes:'}</p>
                        <p className="text-sm text-slate-700 mt-1">{movement.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}