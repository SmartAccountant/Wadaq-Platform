import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import CreditNoteView from "@/components/invoices/CreditNoteView";
import PlanGuard from "@/components/auth/PlanGuard";

function CreditNotesContent() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    Wadaq.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: creditNotes = [], isLoading } = useQuery({
    queryKey: ["creditNotes"],
    queryFn: () => Wadaq.entities.CreditNote.list("-created_date"),
  });

  const filteredCreditNotes = creditNotes.filter(cn =>
    cn.credit_note_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cn.original_invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cn.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const companyInfo = {
    name: user?.company_name || "المحاسب الذكي",
    address: user?.company_address || "الرياض، المملكة العربية السعودية",
    phone: user?.company_phone || "+966 50 000 0000",
    email: user?.company_email || "info@company.com",
    vatNumber: user?.company_vat_number || "300000000000003",
    logo: user?.company_logo,
  };

  if (selectedCreditNote) {
    return (
      <CreditNoteView 
        creditNote={selectedCreditNote}
        onClose={() => setSelectedCreditNote(null)}
        companyInfo={companyInfo}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
                {language === 'ar' ? 'إشعارات دائنة' : 'Credit Notes'}
              </h1>
              <p className="text-gray-500 text-sm font-light tracking-wide">
                {language === 'ar' ? 'إدارة المرتجعات والإشعارات الدائنة' : 'Manage Returns & Credit Notes'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder={language === 'ar' ? 'بحث برقم الإشعار أو رقم الفاتورة أو اسم العميل...' : 'Search by credit note, invoice number, or customer...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Credit Notes List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : filteredCreditNotes.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              {language === 'ar' ? 'لا توجد إشعارات دائنة' : 'No Credit Notes'}
            </h3>
            <p className="text-slate-500">
              {language === 'ar' 
                ? 'سيتم عرض إشعارات المرتجعات هنا' 
                : 'Credit notes for returns will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCreditNotes.map((cn) => (
            <Card key={cn.id} className="hover:shadow-lg transition-shadow border-rose-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-rose-600">
                        {cn.credit_note_number}
                      </h3>
                      <Badge className="bg-rose-100 text-rose-700">
                        {language === 'ar' ? 'مرتجع' : 'Return'}
                      </Badge>
                    </div>
                    <p className="text-slate-600 text-sm mb-1">
                      {language === 'ar' ? 'العميل:' : 'Customer:'} <span className="font-medium">{cn.customer_name}</span>
                    </p>
                    <p className="text-slate-500 text-xs">
                      {language === 'ar' ? 'للفاتورة:' : 'For Invoice:'} {cn.original_invoice_number}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {cn.date && format(new Date(cn.date), "d MMMM yyyy", { locale: language === 'ar' ? ar : undefined })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-xs text-slate-500">{language === 'ar' ? 'المبلغ المسترد' : 'Refunded'}</p>
                      <p className="text-xl font-bold text-rose-600">
                        -{Math.abs(cn.total).toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCreditNote(cn)}
                      className="border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      {language === 'ar' ? 'عرض' : 'View'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreditNotesPage() {
  const { language } = useLanguage();
  
  return (
    <PlanGuard 
      requiredPlans={['advanced', 'smart', 'golden']} 
      featureName={language === 'ar' ? 'الإشعارات الدائنة' : 'Credit Notes'}
    >
      <CreditNotesContent />
    </PlanGuard>
  );
}