import React, { useState } from "react";
import { Wadaq } from "@/api/WadaqCore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, Phone, Mail, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/components/LanguageContext";
import PlanGuard from "@/components/auth/PlanGuard";

const emptySupplier = { name: "", phone: "", email: "", address: "", vat_number: "", commercial_registration: "", bank_name: "", iban: "", notes: "" };

function SuppliersContent() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null); // null=closed, {}=new, {id,...}=edit

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Supplier.filter({ created_by: currentUser.email }, "-created_date");
    },
  });

  const save = useMutation({
    mutationFn: (data) => data.id ? Wadaq.entities.Supplier.update(data.id, data) : Wadaq.entities.Supplier.create(data),
    onSuccess: () => { qc.invalidateQueries(["suppliers"]); setForm(null); },
  });

  const del = useMutation({
    mutationFn: (id) => Wadaq.entities.Supplier.delete(id),
    onSuccess: () => qc.invalidateQueries(["suppliers"]),
  });

  const filtered = suppliers.filter(s =>
    s.name?.includes(search) || s.phone?.includes(search) || s.email?.includes(search)
  );

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a3a5c', fontFamily: 'Cairo, sans-serif' }}>{ar ? "🏭 الموردون" : "🏭 Suppliers"}</h1>
          <p className="text-slate-500 text-sm mt-1">{ar ? "إدارة بيانات الموردين والمُورِّدين" : "Manage your suppliers"}</p>
        </div>
        <Button onClick={() => setForm(emptySupplier)} className="gap-2" style={{ background: '#1a3a5c', color: 'white' }}>
          <Plus className="w-4 h-4" /> {ar ? "مورد جديد" : "New Supplier"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={ar ? "بحث باسم المورد أو الهاتف..." : "Search suppliers..."}
          className="pr-10 bg-white border-slate-200 text-slate-800" />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center text-slate-400 py-10">...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-400 py-16 bg-white rounded-2xl border border-slate-100">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{ar ? "لا يوجد موردون بعد" : "No suppliers yet"}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:-translate-y-0.5 transition-transform">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: '#1a3a5c' }}>{s.name}</span>
                  {s.vat_number && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">{s.vat_number}</span>}
                </div>
                <div className="flex flex-wrap gap-4 mt-1">
                  {s.phone && <span className="text-sm text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                  {s.email && <span className="text-sm text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>}
                  {s.address && <span className="text-sm text-slate-500">{s.address}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => setForm(s)} className="text-slate-400 hover:text-slate-700">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(s.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={!!form} onOpenChange={() => setForm(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{form?.id ? (ar ? "تعديل المورد" : "Edit Supplier") : (ar ? "مورد جديد" : "New Supplier")}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { key: "name", label: ar ? "الاسم *" : "Name *", full: true },
                { key: "phone", label: ar ? "الهاتف" : "Phone" },
                { key: "email", label: ar ? "البريد" : "Email" },
                { key: "address", label: ar ? "العنوان" : "Address", full: true },
                { key: "vat_number", label: ar ? "الرقم الضريبي" : "VAT No." },
                { key: "commercial_registration", label: ar ? "السجل التجاري" : "CR No." },
                { key: "bank_name", label: ar ? "البنك" : "Bank" },
                { key: "iban", label: "IBAN" },
                { key: "notes", label: ar ? "ملاحظات" : "Notes", full: true },
              ].map(f => (
                <div key={f.key} className={f.full ? "col-span-2" : ""}>
                  <label className="text-xs text-slate-500 block mb-1">{f.label}</label>
                  <Input
                    value={form[f.key] || ""}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="bg-white border-slate-200 text-slate-800"
                  />
                </div>
              ))}
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setForm(null)}>{ar ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={() => save.mutate(form)} disabled={!form.name || save.isPending}
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

export default function Suppliers() {
  const { language } = useLanguage();
  return (
    <PlanGuard requiredPlans={['advanced', 'smart', 'golden']} featureName={language === 'ar' ? 'الموردون' : 'Suppliers'}>
      <SuppliersContent />
    </PlanGuard>
  );
}