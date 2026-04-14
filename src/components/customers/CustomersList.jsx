import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Phone, Mail, Eye } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function CustomersList({ customers = [], onView, onEdit, onDelete }) {
  const { language } = useLanguage();
  
  if (customers.length === 0) {
    return (
      <Card className="p-12 text-center bg-white border-0 shadow-sm">
        <p className="text-slate-500">{language === 'ar' ? 'لا يوجد عملاء بعد' : 'No customers yet'}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.map((customer) => {
        const displayName = language === 'ar' ? customer.name : (customer.name_en || customer.name);
        
        return (
        <Card key={customer.id} className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {displayName?.charAt(0)}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(customer)}>
                  <Eye className="w-4 h-4 ml-2" />
                  {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(customer)}>
                  <Edit className="w-4 h-4 ml-2" />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(customer)}
                  className="text-rose-600 focus:text-rose-600"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h3 className="font-semibold text-slate-800 mb-2">{displayName}</h3>
          
          <div className="space-y-2 text-sm text-slate-500">
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span dir="ltr">{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span dir="ltr" className="truncate">{customer.email}</span>
              </div>
            )}
          </div>

          {customer.total_purchases > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">{language === 'ar' ? 'إجمالي المشتريات' : 'Total Purchases'}</p>
              <p className="text-lg font-bold text-emerald-600">{customer.total_purchases?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</p>
            </div>
          )}
        </Card>
      )})}
    </div>
  );
}