import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Truck, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import PlanGuard from "@/components/auth/PlanGuard";
import { differenceInDays, parseISO } from "date-fns";

function ReceivablesContent() {
  const { language } = useLanguage();

  const { data: invoices = [] } = useQuery({ queryKey: ["invoices_rec"], queryFn: async () => { const user = await Wadaq.auth.me(); return Wadaq.entities.Invoice.filter({ created_by: user.email }); } });
  const { data: purchaseOrders = [] } = useQuery({ queryKey: ["po_rec"], queryFn: async () => { const user = await Wadaq.auth.me(); return Wadaq.entities.PurchaseOrder.filter({ created_by: user.email }); } });
  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers_rec"], queryFn: async () => { const user = await Wadaq.auth.me(); return Wadaq.entities.Supplier.filter({ created_by: user.email }); } });

  // Customer Receivables: invoices not fully paid
  const customerReceivables = React.useMemo(() => {
    const map = {};
    invoices.filter(inv => inv.status !== "paid" && inv.status !== "cancelled" && inv.status !== "draft").forEach(inv => {
      const name = inv.customer_name || "غير محدد";
      if (!map[name]) map[name] = { name, total: 0, overdue: 0, invoices: [] };
      map[name].total += inv.total || 0;
      const daysLeft = inv.due_date ? differenceInDays(parseISO(inv.due_date), new Date()) : 0;
      if (daysLeft < 0) map[name].overdue += inv.total || 0;
      map[name].invoices.push({ ...inv, daysLeft });
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [invoices]);

  // Supplier Payables: purchase orders not fully paid
  const supplierPayables = React.useMemo(() => {
    const map = {};
    purchaseOrders.filter(po => po.payment_status !== "paid" && po.status !== "cancelled").forEach(po => {
      const name = po.supplier_name || "غير محدد";
      if (!map[name]) map[name] = { name, total: 0, invoices: [] };
      map[name].total += po.total || 0;
      map[name].invoices.push(po);
    });
    // Also add suppliers with manual balances
    suppliers.filter(s => (s.balance || 0) > 0).forEach(s => {
      if (!map[s.name]) map[s.name] = { name: s.name, total: 0, invoices: [] };
      map[s.name].total += s.balance || 0;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [purchaseOrders, suppliers]);

  const totalReceivable = customerReceivables.reduce((s, c) => s + c.total, 0);
  const totalOverdue = customerReceivables.reduce((s, c) => s + c.overdue, 0);
  const totalPayable = supplierPayables.reduce((s, s2) => s + s2.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">الذمم المالية</h1>
        <p className="text-slate-400 mt-1 text-sm">مديونيات العملاء والمستحقات للموردين</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "ذمم مدينة (مستحقة من عملاء)", value: totalReceivable, icon: Users, color: "from-blue-500 to-cyan-500" },
          { label: "متأخرة (عملاء)", value: totalOverdue, icon: AlertTriangle, color: "from-rose-500 to-red-500" },
          { label: "ذمم دائنة (مستحقة للموردين)", value: totalPayable, icon: Truck, color: "from-amber-500 to-orange-500" },
        ].map((s, i) => (
          <Card key={i} className="border-white/10" style={{ background: "rgba(20,20,40,0.7)" }}>
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-slate-400 text-xs">{s.label}</p><p className="text-2xl font-bold text-white mt-1">{s.value.toLocaleString()} ر.س</p></div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center`}><s.icon className="w-6 h-6 text-white" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="receivable">
        <TabsList className="bg-slate-800/50 border border-white/10">
          <TabsTrigger value="receivable" className="data-[state=active]:bg-blue-500/20 text-slate-300 data-[state=active]:text-blue-300">ذمم مدينة (عملاء)</TabsTrigger>
          <TabsTrigger value="payable" className="data-[state=active]:bg-amber-500/20 text-slate-300 data-[state=active]:text-amber-300">ذمم دائنة (موردون)</TabsTrigger>
        </TabsList>

        <TabsContent value="receivable" className="mt-4">
          {customerReceivables.length === 0 ? (
            <EmptyState icon={Users} msg="لا توجد مديونيات مستحقة من عملاء" sub="جميع الفواتير مدفوعة أو لا توجد فواتير معلقة" />
          ) : (
            <div className="space-y-3">
              {customerReceivables.map((cust, i) => (
                <Card key={i} className={`border-white/10 ${cust.overdue > 0 ? "border-rose-500/20" : ""}`} style={{ background: "rgba(20,20,40,0.7)" }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-sm">{cust.name.charAt(0)}</div><p className="font-semibold text-white">{cust.name}</p></div>
                      <div className="text-left">
                        <p className="text-white font-bold">{cust.total.toLocaleString()} ر.س</p>
                        {cust.overdue > 0 && <p className="text-rose-400 text-xs">متأخر: {cust.overdue.toLocaleString()} ر.س</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {cust.invoices.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-1.5">
                          <span className="text-slate-300">{inv.invoice_number}</span>
                          <span className="text-white">{(inv.total || 0).toLocaleString()} ر.س</span>
                          <Badge className={`text-xs border ${inv.daysLeft < 0 ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
                            {inv.daysLeft < 0 ? `متأخر ${Math.abs(inv.daysLeft)}ي` : `${inv.daysLeft}ي متبقي`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payable" className="mt-4">
          {supplierPayables.length === 0 ? (
            <EmptyState icon={Truck} msg="لا توجد مستحقات للموردين" sub="جميع أوامر الشراء مدفوعة" />
          ) : (
            <div className="space-y-3">
              {supplierPayables.map((sup, i) => (
                <Card key={i} className="border-white/10" style={{ background: "rgba(20,20,40,0.7)" }}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 font-bold text-sm">{sup.name.charAt(0)}</div><p className="font-semibold text-white">{sup.name}</p></div>
                    <p className="text-amber-400 font-bold text-lg">{sup.total.toLocaleString()} ر.س</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, msg, sub }) {
  return (
    <Card className="border-white/10 border-dashed" style={{ background: "rgba(20,20,40,0.4)" }}>
      <CardContent className="py-16 text-center">
        <Icon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-300 font-medium">{msg}</p>
        {sub && <p className="text-slate-500 text-sm mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function Receivables() {
  const { language } = useLanguage();
  return (
    <PlanGuard requiredPlans={["advanced", "smart", "golden"]} featureName={language === "ar" ? "الذمم المالية" : "Receivables & Payables"}>
      <ReceivablesContent />
    </PlanGuard>
  );
}