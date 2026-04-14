import React, { useState } from "react";
import { Wadaq } from "@/api/WadaqCore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import QuotationForm from "@/components/quotations/QuotationForm";
import QuotationView from "@/components/quotations/QuotationView";
import PlanGuard from "@/components/auth/PlanGuard";

function QuotationsContent() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("list");
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      const quotes = await Wadaq.entities.Quotation.filter({ created_by: currentUser.email }, '-created_date');
      
      // Check and update expired quotations
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const quote of quotes) {
        if (quote.valid_until && quote.status !== 'expired' && quote.status !== 'converted') {
          const validUntil = new Date(quote.valid_until);
          validUntil.setHours(0, 0, 0, 0);
          
          if (validUntil < today) {
            await Wadaq.entities.Quotation.update(quote.id, { ...quote, status: 'expired' });
            quote.status = 'expired';
          }
        }
      }
      
      return quotes;
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Customer.filter({ created_by: currentUser.email });
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Product.filter({ created_by: currentUser.email });
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: (data) => Wadaq.entities.Quotation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setView("list");
      setSelectedQuotation(null);
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data) => Wadaq.entities.Customer.create(data),
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      return newCustomer;
    },
  });

  const updateQuotationMutation = useMutation({
    mutationFn: ({ id, data }) => Wadaq.entities.Quotation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => Wadaq.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const handleSave = (formData) => {
    createQuotationMutation.mutate(formData);
  };

  const handleAddCustomer = async (customerData) => {
    return createCustomerMutation.mutateAsync(customerData);
  };

  const handleConvertToInvoice = async (quotation) => {
    try {
      // Generate invoice number
      const allInvoices = await Wadaq.entities.Invoice.list("-created_date", 1);
      const lastInvoice = allInvoices[0];
      let nextNumber = 1;
      
      if (lastInvoice?.invoice_number) {
        const match = lastInvoice.invoice_number.match(/INV-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      const invoice_number = `INV-${nextNumber.toString().padStart(6, '0')}`;

      // Create invoice from quotation
      const invoiceData = {
        invoice_number,
        customer_id: quotation.customer_id,
        customer_name: quotation.customer_name,
        date: format(new Date(), "yyyy-MM-dd"),
        due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        items: quotation.items,
        subtotal: quotation.subtotal,
        tax_rate: quotation.tax_rate,
        tax_amount: quotation.tax_amount,
        discount: quotation.discount || 0,
        total: quotation.total,
        status: "draft",
        apply_vat: quotation.apply_vat,
        notes: quotation.notes || "",
      };

      await createInvoiceMutation.mutateAsync(invoiceData);
      
      // Update quotation status to converted
      await updateQuotationMutation.mutateAsync({
        id: quotation.id,
        data: { ...quotation, status: "converted" }
      });

      // Redirect to invoices page
      window.location.href = "/Invoices";
    } catch (error) {
      alert(language === 'ar' ? 'حدث خطأ أثناء التحويل' : 'Error occurred during conversion');
    }
  };

  const statusMap = {
    draft: { label: language === 'ar' ? 'مسودة' : 'Draft', color: "bg-slate-100 text-slate-700" },
    sent: { label: language === 'ar' ? 'مرسل' : 'Sent', color: "bg-blue-100 text-blue-700" },
    accepted: { label: language === 'ar' ? 'مقبول' : 'Accepted', color: "bg-emerald-100 text-emerald-700" },
    rejected: { label: language === 'ar' ? 'مرفوض' : 'Rejected', color: "bg-rose-100 text-rose-700" },
    converted: { label: language === 'ar' ? 'تم التحويل' : 'Converted', color: "bg-purple-100 text-purple-700" },
    expired: { label: language === 'ar' ? 'منتهي' : 'Expired', color: "bg-gray-300 text-gray-700" },
  };

  const filteredQuotations = quotations.filter(quote => {
    const matchesSearch = quote.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (view === "form") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">
            {language === 'ar' ? 'عرض سعر جديد' : 'New Quotation'}
          </h1>
        </div>
        <QuotationForm
          quotation={selectedQuotation}
          customers={customers}
          products={products}
          onSave={handleSave}
          onCancel={() => {
            setView("list");
            setSelectedQuotation(null);
          }}
          isLoading={createQuotationMutation.isPending}
          onAddCustomer={handleAddCustomer}
        />
      </div>
    );
  }

  if (view === "view" && selectedQuotation) {
    return (
      <QuotationView
        quotation={selectedQuotation}
        onBack={() => {
          setView("list");
          setSelectedQuotation(null);
        }}
        onConvertToInvoice={() => handleConvertToInvoice(selectedQuotation)}
        isConverting={createInvoiceMutation.isPending || updateQuotationMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {language === 'ar' ? 'عروض الأسعار' : 'Quotations'}
          </h1>
          <p className="text-slate-500 mt-1">
            {language === 'ar' ? 'إدارة عروض الأسعار والتسعيرات' : 'Manage price quotations and proposals'}
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setView("form")}
        >
          <Plus className="w-4 h-4 ml-2" />
          {language === 'ar' ? 'عرض سعر جديد' : 'New Quotation'}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={language === 'ar' ? 'بحث عن عميل أو رقم عرض...' : 'Search customer or quote number...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quotations List */}
      {filteredQuotations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {language === 'ar' ? 'لا توجد عروض أسعار' : 'No Quotations'}
            </h3>
            <p className="text-slate-500">
              {language === 'ar' ? 'ابدأ بإنشاء عرض سعر جديد' : 'Start by creating a new quotation'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQuotations.map((quote) => (
            <Card 
              key={quote.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedQuotation(quote);
                setView("view");
              }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-800">{quote.quote_number}</h3>
                      <Badge className={statusMap[quote.status]?.color}>
                        {statusMap[quote.status]?.label || quote.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{quote.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {quote.date && format(new Date(quote.date), "d MMM yyyy", { 
                            locale: language === 'ar' ? ar : undefined 
                          })}
                        </span>
                      </div>
                      {quote.valid_until && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-600">
                            {language === 'ar' ? 'صالح حتى: ' : 'Valid until: '}
                            {format(new Date(quote.valid_until), "d MMM yyyy", { 
                              locale: language === 'ar' ? ar : undefined 
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={language === 'ar' ? "text-left" : "text-left sm:text-right"}>
                    <p className="text-sm text-slate-500">
                      {language === 'ar' ? 'الإجمالي' : 'Total'}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {quote.total?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                    </p>
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

export default function Quotations() {
  const { language } = useLanguage();
  
  return (
    <PlanGuard 
      requiredPlans={['advanced', 'smart', 'golden']} 
      featureName={language === 'ar' ? 'عروض الأسعار' : 'Quotations'}
    >
      <QuotationsContent />
    </PlanGuard>
  );
}