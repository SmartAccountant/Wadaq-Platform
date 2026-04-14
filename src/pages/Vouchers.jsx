import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowDownCircle, ArrowUpCircle, Filter, Eye, Download, Printer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import PlanGuard from "@/components/auth/PlanGuard";
import PaymentVoucherForm from "@/components/vouchers/PaymentVoucherForm";
import ReceiptVoucherForm from "@/components/vouchers/ReceiptVoucherForm";
import PaymentVoucherView from "@/components/vouchers/PaymentVoucherView";
import ReceiptVoucherView from "@/components/vouchers/ReceiptVoucherView";

function VouchersContent() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("payment");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [selectedPaymentVoucher, setSelectedPaymentVoucher] = useState(null);
  const [selectedReceiptVoucher, setSelectedReceiptVoucher] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    Wadaq.auth.me().then(async (user) => {
      const orgs = await Wadaq.entities.Organization.filter({ owner_email: user.email });
      setCompanyInfo(orgs[0] || {
        name: user?.company_name || '',
        logo: user?.company_logo,
        address: user?.company_address,
        phone: user?.company_phone,
        vat_number: user?.company_vat_number
      });
    }).catch(() => {});
  }, []);

  const { data: paymentVouchers = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["paymentVouchers"],
    queryFn: async () => {
      const user = await Wadaq.auth.me();
      return Wadaq.entities.PaymentVoucher.filter({ created_by: user.email }, "-created_date");
    },
  });

  const { data: receiptVouchers = [], isLoading: loadingReceipts } = useQuery({
    queryKey: ["receiptVouchers"],
    queryFn: async () => {
      const user = await Wadaq.auth.me();
      return Wadaq.entities.ReceiptVoucher.filter({ created_by: user.email }, "-created_date");
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["cashAccounts"],
    queryFn: async () => {
      const user = await Wadaq.auth.me();
      const accs = await Wadaq.entities.CashAccount.filter({ created_by: user.email });
      // Create default account if none exists
      if (accs.length === 0) {
        await Wadaq.entities.CashAccount.create({
          account_name: language === 'ar' ? 'الخزينة الرئيسية' : 'Main Cash',
          account_type: 'cash',
          balance: 0,
          initial_balance: 0
        });
        const user2 = await Wadaq.auth.me();
        return Wadaq.entities.CashAccount.filter({ created_by: user2.email });
      }
      return accs;
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data) => Wadaq.entities.PaymentVoucher.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentVouchers"] });
      setShowPaymentForm(false);
    },
  });

  const createReceiptMutation = useMutation({
    mutationFn: (data) => Wadaq.entities.ReceiptVoucher.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receiptVouchers"] });
      setShowReceiptForm(false);
    },
  });

  const filteredPayments = paymentVouchers.filter(v =>
    v.voucher_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.beneficiary_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReceipts = receiptVouchers.filter(v =>
    v.voucher_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.payer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusMap = {
    draft: { label: language === 'ar' ? 'مسودة' : 'Draft', color: "bg-slate-100 text-slate-700" },
    approved: { label: language === 'ar' ? 'معتمد' : 'Approved', color: "bg-blue-100 text-blue-700" },
    paid: { label: language === 'ar' ? 'مدفوع' : 'Paid', color: "bg-emerald-100 text-emerald-700" },
    received: { label: language === 'ar' ? 'مستلم' : 'Received', color: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: language === 'ar' ? 'ملغي' : 'Cancelled', color: "bg-rose-100 text-rose-700" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
            {language === 'ar' ? 'سندات القبض والصرف' : 'Payment & Receipt Vouchers'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-light tracking-wide">
            {language === 'ar' ? 'إدارة سندات القبض والصرف المالية' : 'Manage financial payment and receipt vouchers'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
            onClick={() => setShowPaymentForm(true)}
          >
            <ArrowDownCircle className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'سند صرف' : 'Payment'}
          </Button>
          <Button 
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            onClick={() => setShowReceiptForm(true)}
          >
            <ArrowUpCircle className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'سند قبض' : 'Receipt'}
          </Button>
        </div>
      </div>

      {/* Forms */}
      {showPaymentForm && (
        <PaymentVoucherForm
          accounts={accounts}
          onSave={(data) => createPaymentMutation.mutate(data)}
          onCancel={() => setShowPaymentForm(false)}
        />
      )}

      {showReceiptForm && (
        <ReceiptVoucherForm
          accounts={accounts}
          onSave={(data) => createReceiptMutation.mutate(data)}
          onCancel={() => setShowReceiptForm(false)}
        />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder={language === 'ar' ? 'بحث برقم السند أو الاسم...' : 'Search by voucher number or name...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" />
            {language === 'ar' ? 'سندات الصرف' : 'Payment Vouchers'}
          </TabsTrigger>
          <TabsTrigger value="receipt" className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4" />
            {language === 'ar' ? 'سندات القبض' : 'Receipt Vouchers'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ArrowDownCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  {language === 'ar' ? 'لا توجد سندات صرف' : 'No Payment Vouchers'}
                </h3>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPayments.map((voucher) => (
                <Card key={voucher.id} className="hover:shadow-lg transition-shadow border-rose-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-rose-600">
                            {voucher.voucher_number}
                          </h3>
                          <Badge className={statusMap[voucher.status]?.color}>
                            {statusMap[voucher.status]?.label}
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-sm mb-1">
                          {language === 'ar' ? 'المستفيد:' : 'Beneficiary:'} <span className="font-medium">{voucher.beneficiary_name}</span>
                        </p>
                        <p className="text-slate-500 text-xs">
                          {language === 'ar' ? 'الحساب:' : 'Account:'} {voucher.account_name}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                          {voucher.date && format(new Date(voucher.date), "d MMMM yyyy", { locale: language === 'ar' ? ar : undefined })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-xs text-slate-500">{language === 'ar' ? 'المبلغ' : 'Amount'}</p>
                          <p className="text-xl font-bold text-rose-600">
                            {voucher.amount?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => setSelectedPaymentVoucher(voucher)}
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            {language === 'ar' ? 'عرض' : 'View'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => setSelectedPaymentVoucher(voucher)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="receipt" className="space-y-4">
          {filteredReceipts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ArrowUpCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  {language === 'ar' ? 'لا توجد سندات قبض' : 'No Receipt Vouchers'}
                </h3>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredReceipts.map((voucher) => (
                <Card key={voucher.id} className="hover:shadow-lg transition-shadow border-emerald-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-emerald-600">
                            {voucher.voucher_number}
                          </h3>
                          <Badge className={statusMap[voucher.status]?.color}>
                            {statusMap[voucher.status]?.label}
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-sm mb-1">
                          {language === 'ar' ? 'الدافع:' : 'Payer:'} <span className="font-medium">{voucher.payer_name}</span>
                        </p>
                        <p className="text-slate-500 text-xs">
                          {language === 'ar' ? 'الحساب:' : 'Account:'} {voucher.account_name}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                          {voucher.date && format(new Date(voucher.date), "d MMMM yyyy", { locale: language === 'ar' ? ar : undefined })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-xs text-slate-500">{language === 'ar' ? 'المبلغ' : 'Amount'}</p>
                          <p className="text-xl font-bold text-emerald-600">
                            {voucher.amount?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => setSelectedReceiptVoucher(voucher)}
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            {language === 'ar' ? 'عرض' : 'View'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => setSelectedReceiptVoucher(voucher)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Modals */}
      {selectedPaymentVoucher && (
        <PaymentVoucherView
          voucher={selectedPaymentVoucher}
          onClose={() => setSelectedPaymentVoucher(null)}
          companyInfo={companyInfo}
          language={language}
        />
      )}

      {selectedReceiptVoucher && (
        <ReceiptVoucherView
          voucher={selectedReceiptVoucher}
          onClose={() => setSelectedReceiptVoucher(null)}
          companyInfo={companyInfo}
          language={language}
        />
      )}
    </div>
  );
}

export default function Vouchers() {
  const { language } = useLanguage();
  
  return (
    <PlanGuard 
      requiredPlans={['advanced', 'smart', 'golden']} 
      featureName={language === 'ar' ? 'سندات القبض والصرف' : 'Payment & Receipt Vouchers'}
    >
      <VouchersContent />
    </PlanGuard>
  );
}