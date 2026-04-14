import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";

const categoryLabels = {
  rent: { label: "إيجار", color: "bg-blue-100 text-blue-700" },
  utilities: { label: "خدمات عامة", color: "bg-amber-100 text-amber-700" },
  salaries: { label: "رواتب", color: "bg-green-100 text-green-700" },
  supplies: { label: "مستلزمات", color: "bg-purple-100 text-purple-700" },
  marketing: { label: "تسويق", color: "bg-pink-100 text-pink-700" },
  maintenance: { label: "صيانة", color: "bg-orange-100 text-orange-700" },
  transportation: { label: "نقل ومواصلات", color: "bg-cyan-100 text-cyan-700" },
  other: { label: "أخرى", color: "bg-slate-100 text-slate-700" },
};

export default function ExpensesList({ expenses = [], onEdit, onDelete }) {
  const { language, t } = useLanguage();
  
  if (expenses.length === 0) {
    return (
      <Card className="p-12 text-center bg-white border-0 shadow-sm">
        <p className="text-slate-500">{language === 'ar' ? 'لا توجد مصروفات بعد' : 'No expenses yet'}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const displayTitle = language === 'ar' ? expense.title : (expense.title_en || expense.title);
        
        return (
        <Card key={expense.id} className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`${categoryLabels[expense.category]?.color} border-0 font-normal`}>
                  {language === 'ar' ? categoryLabels[expense.category]?.label : t(expense.category)}
                </Badge>
              </div>
              <p className="font-semibold text-slate-800">{displayTitle}</p>
              <p className="text-sm text-slate-500">
                {expense.date && format(new Date(expense.date), "d MMMM yyyy", { locale: language === 'ar' ? ar : undefined })}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={language === 'ar' ? 'text-left' : 'text-right'}>
                <p className="text-2xl font-bold text-rose-600">{expense.amount?.toLocaleString()}</p>
                <p className="text-sm text-slate-500">{language === 'ar' ? 'ر.س' : 'SAR'}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(expense)}>
                    <Edit className="w-4 h-4 ml-2" />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(expense)}
                    className="text-rose-600 focus:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      )})}
    </div>
  );
}