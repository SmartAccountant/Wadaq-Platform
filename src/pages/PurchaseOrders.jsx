import React, { useState } from "react";
import { Wadaq } from "@/api/WadaqClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, CheckCircle, XCircle, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/components/LanguageContext";
import PlanGuard from "@/components/auth/PlanGuard";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-50 text-blue-700",
  partial: "bg-amber-50 text-amber-700",
  received: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
};
const STATUS_LABELS = {
  draft: "مسودة", sent: "مُرسل", partial: "استلام جزئي", received: "مستلم", cancelled: "ملغي"
};

function PurchaseOrdersContent() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [newItem, setNewItem] = useState({ product_name: "", quantity: 1, unit_cost: 0 });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.PurchaseOrder.filter({ created_by: currentUser.email }, "-created_date");
    },
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Supplier.filter({ created_by: currentUser.email });
    },
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Product.filter({ created_by: currentUser.email });
    },
  });

  const save = useMutation({
    mutationFn: (data) => data.id ? Wadaq.entities.PurchaseOrder.update(data.id, data) : Wadaq.entities.PurchaseOrder.create(data),
    onSuccess: () => { qc.invalidateQueries(["purchase-orders"]); setForm(null); },
  });

  const receiveOrder = useMutation({
    mutationFn: async (order) => {
      // Update product quantities
      for (const item of order.items || []) {
        if (item.product_id) {
          const prod = products.find(p => p.id === item.product_id);
          if (prod) {
            await Wadaq.entities.Product.update(item.product_id, {
              quantity: (prod.quantity || 0) + (item.quantity || 0)
            });
            await Wadaq.entities.StockMovement.create({
              product_id: item.product_id,
              product_name: item.product_name,
              type: "in",
              quantity: item.quantity,
              previous_quantity: prod.quantity || 0,
              new_quantity: (prod.quantity || 0) + item.quantity,
              reference_type: "purchase",
              reference_id: order.order_number,
              date: new Date().toISOString().split("T")[0],
              notes: `استلام من أمر شراء ${order.order_number}`
            });
          }
        }
      }
      return Wadaq.entities.PurchaseOrder.update(order.id, { status: "received" });
    },
    onSuccess: () => qc.invalidateQueries(["purchase-orders"]),
  });

  const addItem = () => {
    if (!newItem.product_name) return;
    const total = newItem.quantity * newItem.unit_cost;
    const items = [...(form.items || []), { ...newItem, total }];
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const tax_amount = subtotal * 0.15;
    setForm(f => ({ ...f, items, subtotal, tax_amount, total: subtotal + tax_amount }));
    setNewItem({ product_name: "", quantity: 1, unit_cost: 0 });
  };

  const removeItem = (idx) => {
    const items = form.items.filter((_, i) => i !== idx);
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    setForm(f => ({ ...f, items, subtotal, tax_amount: subtotal * 0.15, total: subtotal * 1.15 }));
  };

  const openNew = () => setForm({
    order_number: `PO-${Date.now().toString().slice(-6)}`,
    supplier_name: "", date: new Date().toISOString().split("T")[0],
    items: [], subtotal: 0, tax_amount: 0, total: 0, status: "draft"
  });

  const filtered = orders.filter(o =>
    o.order_number?.includes(search) || o.supplier_name?.includes(search)
  );

  const fmt = (n) => (n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a3a5c', fontFamily: 'Cairo, sans-serif' }}>{ar ? "🛒 أوامر الشراء" : "🛒 Purchase Orders"}</h1>
          <p className="text-slate-500 text-sm mt-1">{ar ? "إدارة طلبات الشراء من الموردين" : "Manage purchase orders from suppliers"}</p>
        </div>
        <Button onClick={openNew} className="gap-2" style={{ background: '#1a3a5c', color: 'white' }}>
          <Plus className="w-4 h-4" /> {ar ? "أمر شراء جديد" : "New PO"}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={ar ? "بحث برقم الأمر أو المورد..." : "Search..."}
          className="pr-10 bg-white border-slate-200 text-slate-800" />
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-10">...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-400 py-16 bg-white rounded-2xl border border-slate-100">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{ar ? "لا توجد أوامر شراء" : "No purchase orders"}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(o => (
            <div key={o.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:-translate-y-0.5 transition-transform">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold" style={{ color: '#1a3a5c' }}>{o.order_number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{o.supplier_name} • {o.date}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: '#c9a227' }}>{fmt(o.total)} ر.س</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {o.status !== "received" && o.status !== "cancelled" && (
                  <Button size="sm" variant="ghost" onClick={() => receiveOrder.mutate(o)}
                    className="text-green-400 hover:bg-green-900/30 text-xs gap-1">
                    <CheckCircle className="w-3 h-3" /> {ar ? "استلام" : "Receive"}
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => setForm(o)} className="text-slate-400 hover:text-white">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={!!form} onOpenChange={() => setForm(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{ar ? "أمر شراء" : "Purchase Order"} {form?.order_number}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{ar ? "المورد *" : "Supplier *"}</label>
                  <select value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm">
                    <option value="">{ar ? "-- اختر مورد --" : "-- Select --"}</option>
                    {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{ar ? "التاريخ" : "Date"}</label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="bg-white border-slate-200 text-slate-800" />
                </div>
              </div>

              {/* Items */}
              <div>
                <label className="text-xs text-slate-500 block mb-2">{ar ? "البنود" : "Items"}</label>
                <div className="space-y-2 mb-3">
                  {(form.items || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm">
                      <span className="flex-1 text-slate-800">{item.product_name}</span>
                      <span className="text-slate-500">{item.quantity} × {item.unit_cost}</span>
                      <span className="font-mono font-semibold" style={{ color: '#c9a227' }}>{item.total?.toFixed(2)}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(i)} className="text-red-400 h-6 w-6">
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select value={newItem.product_name}
                    onChange={e => {
                      const p = products.find(p => p.name === e.target.value);
                      setNewItem(n => ({ ...n, product_name: e.target.value, product_id: p?.id, unit_cost: p?.cost_price || 0 }));
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm">
                    <option value="">{ar ? "اختر منتج" : "Select product"}</option>
                    {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                  <Input type="number" min="1" value={newItem.quantity}
                    onChange={e => setNewItem(n => ({ ...n, quantity: +e.target.value }))}
                    className="w-20 bg-white border-slate-200 text-slate-800" placeholder="كمية" />
                  <Input type="number" min="0" value={newItem.unit_cost}
                    onChange={e => setNewItem(n => ({ ...n, unit_cost: +e.target.value }))}
                    className="w-24 bg-white border-slate-200 text-slate-800" placeholder="سعر" />
                  <Button onClick={addItem} size="icon" style={{ background: '#1a3a5c', color: 'white' }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between text-slate-500"><span>{ar ? "المجموع الفرعي" : "Subtotal"}</span><span>{fmt(form.subtotal)} ر.س</span></div>
                <div className="flex justify-between text-slate-500"><span>{ar ? "ضريبة 15%" : "VAT 15%"}</span><span>{fmt(form.tax_amount)} ر.س</span></div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-1" style={{ color: '#1a3a5c' }}><span>{ar ? "الإجمالي" : "Total"}</span><span>{fmt(form.total)} ر.س</span></div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setForm(null)}>{ar ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={() => save.mutate(form)} disabled={!form.supplier_name || save.isPending}
                  style={{ background: '#1a3a5c', color: 'white' }}>
                  {save.isPending ? "..." : (ar ? "حفظ" : "Save")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PurchaseOrders() {
  const { language } = useLanguage();
  return (
    <PlanGuard requiredPlans={['advanced', 'smart', 'golden']} featureName={language === 'ar' ? 'أوامر الشراء' : 'Purchase Orders'}>
      <PurchaseOrdersContent />
    </PlanGuard>
  );
}