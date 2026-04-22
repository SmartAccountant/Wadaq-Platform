import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Building2, Car, Monitor, Sofa, Package, TrendingDown, Edit, Trash2, Calculator } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import PlanGuard from "@/components/auth/PlanGuard";

const categoryIcons = { equipment: Package, vehicle: Car, computer: Monitor, furniture: Sofa, building: Building2, other: Package };
const categoryColors = { equipment: "bg-blue-500/20 text-blue-300", vehicle: "bg-emerald-500/20 text-emerald-300", computer: "bg-purple-500/20 text-purple-300", furniture: "bg-amber-500/20 text-amber-300", building: "bg-rose-500/20 text-rose-300", other: "bg-slate-500/20 text-slate-300" };

const categoryLabels = { equipment: "معدات", vehicle: "مركبات", computer: "أجهزة", furniture: "أثاث", building: "مباني", other: "أخرى" };
const statusLabels = { active: "نشط", disposed: "مستبعد", under_maintenance: "صيانة" };
const statusColors = { active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", disposed: "bg-rose-500/20 text-rose-300 border-rose-500/30", under_maintenance: "bg-amber-500/20 text-amber-300 border-amber-500/30" };

const emptyForm = { name: "", asset_number: "", category: "equipment", purchase_date: "", purchase_cost: "", salvage_value: "0", useful_life_years: "5", depreciation_method: "straight_line", location: "", serial_number: "", supplier: "", status: "active", notes: "" };

function AssetForm({ asset, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(asset ? { ...asset, purchase_cost: String(asset.purchase_cost), salvage_value: String(asset.salvage_value || 0), useful_life_years: String(asset.useful_life_years || 5) } : emptyForm);

  const calcDepreciation = () => {
    const cost = parseFloat(form.purchase_cost) || 0;
    const salvage = parseFloat(form.salvage_value) || 0;
    const life = parseFloat(form.useful_life_years) || 1;
    return ((cost - salvage) / life).toFixed(2);
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const user = await Wadaq.auth.me();
      if (!user?.email) throw new Error("يجب تسجيل الدخول");
      const payload = { ...data, purchase_cost: parseFloat(data.purchase_cost) || 0, salvage_value: parseFloat(data.salvage_value) || 0, useful_life_years: parseFloat(data.useful_life_years) || 5, annual_depreciation: parseFloat(calcDepreciation()), current_value: parseFloat(data.purchase_cost) || 0 };
      if (asset) return Wadaq.entities.Asset.update(asset.id, payload);
      return Wadaq.entities.Asset.create({ ...payload, created_by: user.email });
    },
    onSuccess: () => { queryClient.invalidateQueries(["assets"]); onClose(); }
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-xs text-slate-400 mb-1 block">اسم الأصل *</label><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="مثال: سيارة تويوتا" className="bg-slate-800/50 border-white/10 text-white" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">رقم الأصل</label><Input value={form.asset_number} onChange={e => set("asset_number", e.target.value)} placeholder="AST-001" className="bg-slate-800/50 border-white/10 text-white" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">التصنيف</label>
          <select value={form.category} onChange={e => set("category", e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label className="text-xs text-slate-400 mb-1 block">تاريخ الشراء *</label><Input type="date" value={form.purchase_date} onChange={e => set("purchase_date", e.target.value)} className="bg-slate-800/50 border-white/10 text-white" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">تكلفة الشراء (ر.س) *</label><Input type="number" value={form.purchase_cost} onChange={e => set("purchase_cost", e.target.value)} className="bg-slate-800/50 border-white/10 text-white" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">القيمة التخريدية (ر.س)</label><Input type="number" value={form.salvage_value} onChange={e => set("salvage_value", e.target.value)} className="bg-slate-800/50 border-white/10 text-white" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">العمر الإنتاجي (سنوات)</label><Input type="number" value={form.useful_life_years} onChange={e => set("useful_life_years", e.target.value)} className="bg-slate-800/50 border-white/10 text-white" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">طريقة الاستهلاك</label>
          <select value={form.depreciation_method} onChange={e => set("depreciation_method", e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
            <option value="straight_line">القسط الثابت</option>
            <option value="declining_balance">القسط المتناقص</option>
          </select>
        </div>
        <div><label className="text-xs text-slate-400 mb-1 block">الموقع</label><Input value={form.location} onChange={e => set("location", e.target.value)} className="bg-slate-800/50 border-white/10 text-white" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">الرقم التسلسلي</label><Input value={form.serial_number} onChange={e => set("serial_number", e.target.value)} className="bg-slate-800/50 border-white/10 text-white" /></div>
      </div>

      {form.purchase_cost && (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300">الاستهلاك السنوي المحسوب: <strong>{calcDepreciation()} ر.س</strong></span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="border-white/10 text-slate-300">إلغاء</Button>
        <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="bg-gradient-to-r from-purple-500 to-pink-500">
          {mutation.isPending ? "جارٍ الحفظ..." : asset ? "تحديث" : "إضافة"}
        </Button>
      </div>
    </div>
  );
}

function FixedAssetsContent() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const user = await Wadaq.auth.me();
      return Wadaq.entities.Asset.filter({ created_by: user.email });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: id => Wadaq.entities.Asset.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["assets"])
  });

  const totalCost = assets.reduce((s, a) => s + (a.purchase_cost || 0), 0);
  const totalDepreciation = assets.reduce((s, a) => s + (a.annual_depreciation || 0), 0);
  const activeCount = assets.filter(a => a.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">الأصول الثابتة</h1>
          <p className="text-slate-400 mt-1 text-sm">إدارة الأصول الثابتة وحساب الاستهلاك</p>
        </div>
        <Button onClick={() => { setEditAsset(null); setShowForm(true); }} className="bg-gradient-to-r from-purple-500 to-pink-500">
          <Plus className="w-4 h-4 ml-2" /> إضافة أصل
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "إجمالي تكلفة الأصول", value: `${totalCost.toLocaleString()} ر.س`, color: "from-blue-500 to-cyan-500", icon: Building2 },
          { label: "الاستهلاك السنوي", value: `${totalDepreciation.toLocaleString()} ر.س`, color: "from-rose-500 to-pink-500", icon: TrendingDown },
          { label: "الأصول النشطة", value: activeCount, color: "from-emerald-500 to-teal-500", icon: Package },
        ].map((s, i) => (
          <Card key={i} className="border-white/10" style={{ background: "rgba(20,20,40,0.7)" }}>
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-slate-400 text-xs">{s.label}</p><p className="text-2xl font-bold text-white mt-1">{s.value}</p></div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center`}><s.icon className="w-6 h-6 text-white" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">جارٍ التحميل...</div>
      ) : assets.length === 0 ? (
        <Card className="border-white/10 border-dashed" style={{ background: "rgba(20,20,40,0.4)" }}>
          <CardContent className="py-16 text-center">
            <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">لا توجد أصول مسجلة</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500"><Plus className="w-4 h-4 ml-2" />إضافة أول أصل</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map(asset => {
            const Icon = categoryIcons[asset.category] || Package;
            return (
              <Card key={asset.id} className="border-white/10 hover:border-purple-500/30 transition-all" style={{ background: "rgba(20,20,40,0.7)" }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryColors[asset.category]}`}><Icon className="w-5 h-5" /></div>
                      <div>
                        <p className="font-semibold text-white text-sm">{asset.name}</p>
                        <p className="text-slate-500 text-xs">{asset.asset_number}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs border ${statusColors[asset.status]}`}>{statusLabels[asset.status]}</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">تكلفة الشراء</span><span className="text-white font-medium">{(asset.purchase_cost || 0).toLocaleString()} ر.س</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">استهلاك سنوي</span><span className="text-rose-400 font-medium">{(asset.annual_depreciation || 0).toLocaleString()} ر.س</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">العمر الإنتاجي</span><span className="text-white">{asset.useful_life_years} سنة</span></div>
                    {asset.location && <div className="flex justify-between"><span className="text-slate-400">الموقع</span><span className="text-white text-xs">{asset.location}</span></div>}
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                    <Button size="sm" variant="ghost" onClick={() => { setEditAsset(asset); setShowForm(true); }} className="text-slate-400 hover:text-white"><Edit className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(asset.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>{editAsset ? "تعديل الأصل" : "إضافة أصل ثابت جديد"}</DialogTitle></DialogHeader>
          <AssetForm asset={editAsset} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FixedAssets() {
  const { language } = useLanguage();
  return (
    <PlanGuard requiredPlans={["advanced", "smart", "golden"]} featureName={language === "ar" ? "الأصول الثابتة" : "Fixed Assets"}>
      <FixedAssetsContent />
    </PlanGuard>
  );
}