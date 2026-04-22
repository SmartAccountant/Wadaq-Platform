import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileSignature, Users, Truck, Calendar, DollarSign, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import PlanGuard from "@/components/auth/PlanGuard";
import { differenceInDays, parseISO } from "date-fns";

const typeLabels = { customer: "عميل", supplier: "مورد", employee: "موظف", rental: "إيجار", service: "خدمة", other: "أخرى" };
const typeColors = { customer: "bg-blue-500/20 text-blue-300", supplier: "bg-emerald-500/20 text-emerald-300", employee: "bg-purple-500/20 text-purple-300", rental: "bg-amber-500/20 text-amber-300", service: "bg-cyan-500/20 text-cyan-300", other: "bg-slate-500/20 text-slate-300" };
const statusColors = { draft: "bg-slate-500/20 text-slate-300 border-slate-500/30", active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", expired: "bg-rose-500/20 text-rose-300 border-rose-500/30", cancelled: "bg-red-500/20 text-red-300 border-red-500/30", renewed: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
const statusLabels = { draft: "مسودة", active: "نشط", expired: "منتهي", cancelled: "ملغي", renewed: "مجدد" };

const emptyForm = { contract_number: "", title: "", contract_type: "customer", party_name: "", start_date: "", end_date: "", value: "", payment_terms: "", description: "", status: "draft", auto_renew: false, notes: "" };

function ContractForm({ contract, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(contract ? { ...contract, value: String(contract.value || "") } : emptyForm);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const daysLeft = form.end_date ? differenceInDays(parseISO(form.end_date), new Date()) : null;

  const mutation = useMutation({
    mutationFn: async () => {
      const user = await Wadaq.auth.me();
      if (!user?.email) throw new Error("يجب تسجيل الدخول");
      const payload = { ...form, value: parseFloat(form.value) || 0 };
      if (contract) return Wadaq.entities.Contract.update(contract.id, payload);
      return Wadaq.entities.Contract.create({ ...payload, created_by: user.email });
    },
    onSuccess: () => { queryClient.invalidateQueries(["contracts"]); onClose(); }
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-slate-400 mb-1 block">رقم العقد *</label><Input value={form.contract_number} onChange={e => set("contract_number", e.target.value)} placeholder="CNT-001" className="bg-slate-800/50 border-white/10 text-white text-sm" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">نوع العقد</label>
          <Select value={form.contract_type} onValueChange={v => set("contract_type", v)}>
            <SelectTrigger className="bg-slate-800/50 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><label className="text-xs text-slate-400 mb-1 block">عنوان العقد *</label><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="عقد توريد / عقد خدمات..." className="bg-slate-800/50 border-white/10 text-white text-sm" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">اسم الطرف الآخر *</label><Input value={form.party_name} onChange={e => set("party_name", e.target.value)} className="bg-slate-800/50 border-white/10 text-white text-sm" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">قيمة العقد (ر.س)</label><Input type="number" value={form.value} onChange={e => set("value", e.target.value)} className="bg-slate-800/50 border-white/10 text-white text-sm" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">تاريخ البداية *</label><Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className="bg-slate-800/50 border-white/10 text-white text-sm" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">تاريخ الانتهاء *</label><Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="bg-slate-800/50 border-white/10 text-white text-sm" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">شروط الدفع</label><Input value={form.payment_terms} onChange={e => set("payment_terms", e.target.value)} placeholder="30 يوم من الاستلام" className="bg-slate-800/50 border-white/10 text-white text-sm" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">الحالة</label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="bg-slate-800/50 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><label className="text-xs text-slate-400 mb-1 block">الوصف / الشروط</label><textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl p-2 text-sm resize-none" placeholder="أدخل تفاصيل وشروط العقد..." /></div>
      </div>

      {daysLeft !== null && form.end_date && (
        <div className={`p-3 rounded-xl flex items-center gap-2 ${daysLeft < 30 ? "bg-rose-500/10 border border-rose-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
          <Calendar className={`w-4 h-4 ${daysLeft < 30 ? "text-rose-400" : "text-emerald-400"}`} />
          <span className={`text-sm ${daysLeft < 30 ? "text-rose-300" : "text-emerald-300"}`}>
            {daysLeft > 0 ? `متبقي ${daysLeft} يوم` : `انتهى منذ ${Math.abs(daysLeft)} يوم`}
          </span>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} className="border-white/10 text-slate-300">إلغاء</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="bg-gradient-to-r from-cyan-500 to-blue-500">
          {mutation.isPending ? "جارٍ الحفظ..." : contract ? "تحديث" : "حفظ العقد"}
        </Button>
      </div>
    </div>
  );
}

function ContractsContent() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editContract, setEditContract] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const user = await Wadaq.auth.me();
      return Wadaq.entities.Contract.filter({ created_by: user.email }, "-start_date");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: id => Wadaq.entities.Contract.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["contracts"])
  });

  const filtered = contracts.filter(c => (filterStatus === "all" || c.status === filterStatus) && (filterType === "all" || c.contract_type === filterType));

  const expiringSoon = contracts.filter(c => {
    if (!c.end_date || c.status !== "active") return false;
    return differenceInDays(parseISO(c.end_date), new Date()) <= 30 && differenceInDays(parseISO(c.end_date), new Date()) >= 0;
  }).length;

  const totalValue = contracts.filter(c => c.status === "active").reduce((s, c) => s + (c.value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">إدارة العقود</h1>
          <p className="text-slate-400 mt-1 text-sm">عقود العملاء والموردين والخدمات</p>
        </div>
        <Button onClick={() => { setEditContract(null); setShowForm(true); }} className="bg-gradient-to-r from-cyan-500 to-blue-500">
          <Plus className="w-4 h-4 ml-2" /> عقد جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي العقود", value: contracts.length, color: "from-blue-500 to-cyan-500", icon: FileSignature },
          { label: "عقود نشطة", value: contracts.filter(c => c.status === "active").length, color: "from-emerald-500 to-teal-500", icon: FileSignature },
          { label: "تنتهي قريباً", value: expiringSoon, color: "from-amber-500 to-orange-500", icon: AlertTriangle },
          { label: "قيمة النشطة", value: `${totalValue.toLocaleString()} ر.س`, color: "from-purple-500 to-pink-500", icon: DollarSign },
        ].map((s, i) => (
          <Card key={i} className="border-white/10" style={{ background: "rgba(20,20,40,0.7)" }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-slate-400 text-xs">{s.label}</p><p className="text-xl font-bold text-white mt-1">{s.value}</p></div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}><s.icon className="w-5 h-5 text-white" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 bg-slate-800/50 border-white/10 text-white text-sm"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent><SelectItem value="all">كل الحالات</SelectItem>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 bg-slate-800/50 border-white/10 text-white text-sm"><SelectValue placeholder="النوع" /></SelectTrigger>
          <SelectContent><SelectItem value="all">كل الأنواع</SelectItem>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Contracts Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">جارٍ التحميل...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-white/10 border-dashed" style={{ background: "rgba(20,20,40,0.4)" }}>
          <CardContent className="py-16 text-center">
            <FileSignature className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">لا توجد عقود</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-500"><Plus className="w-4 h-4 ml-2" />إضافة أول عقد</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(contract => {
            const daysLeft = contract.end_date ? differenceInDays(parseISO(contract.end_date), new Date()) : null;
            return (
              <Card key={contract.id} className={`border-white/10 hover:border-cyan-500/30 transition-all ${daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 ? "border-amber-500/30" : ""}`} style={{ background: "rgba(20,20,40,0.7)" }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{contract.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{contract.contract_number}</p>
                    </div>
                    <div className="flex gap-1.5 mr-2 flex-shrink-0">
                      <Badge className={`text-xs ${typeColors[contract.contract_type]}`}>{typeLabels[contract.contract_type]}</Badge>
                      <Badge className={`text-xs border ${statusColors[contract.status]}`}>{statusLabels[contract.status]}</Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-300">{contract.party_name}</span></div>
                    {contract.value > 0 && <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-slate-500" /><span className="text-white">{contract.value.toLocaleString()} ر.س</span></div>}
                    <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-300">{contract.start_date} ← {contract.end_date}</span></div>
                    {daysLeft !== null && (
                      <div className={`flex items-center gap-1.5 mt-1 ${daysLeft <= 30 && daysLeft >= 0 ? "text-amber-400" : daysLeft < 0 ? "text-rose-400" : "text-slate-400"}`}>
                        {daysLeft <= 30 && <AlertTriangle className="w-3 h-3" />}
                        <span>{daysLeft > 0 ? `متبقي ${daysLeft} يوم` : daysLeft === 0 ? "ينتهي اليوم!" : `انتهى منذ ${Math.abs(daysLeft)} يوم`}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                    <Button size="sm" variant="ghost" onClick={() => { setEditContract(contract); setShowForm(true); }} className="text-slate-400 hover:text-white"><Edit className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(contract.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>{editContract ? "تعديل العقد" : "عقد جديد"}</DialogTitle></DialogHeader>
          <ContractForm contract={editContract} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Contracts() {
  const { language } = useLanguage();
  return (
    <PlanGuard requiredPlans={["smart"]} featureName={language === "ar" ? "إدارة العقود" : "Contracts"}>
      <ContractsContent />
    </PlanGuard>
  );
}