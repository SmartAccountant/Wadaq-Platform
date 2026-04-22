import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, BookOpen, Trash2, Eye, CheckCircle, AlertCircle, PlusCircle, MinusCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import PlanGuard from "@/components/auth/PlanGuard";

const statusColors = { draft: "bg-amber-500/20 text-amber-300 border-amber-500/30", posted: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };

const defaultAccounts = [
  { code: "101", name: "الصندوق" }, { code: "102", name: "البنك" }, { code: "201", name: "المبيعات" },
  { code: "301", name: "المشتريات" }, { code: "401", name: "المصروفات العمومية" }, { code: "501", name: "الذمم المدينة" },
  { code: "601", name: "الذمم الدائنة" }, { code: "701", name: "ضريبة القيمة المضافة" },
];

function JournalEntryForm({ entry, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(entry || { entry_number: `JE-${Date.now().toString().slice(-6)}`, date: new Date().toISOString().split("T")[0], description: "", reference: "", lines: [{ account_code: "", account_name: "", debit: "", credit: "", notes: "" }, { account_code: "", account_name: "", debit: "", credit: "", notes: "" }], status: "draft" });

  const totalDebit = form.lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const addLine = () => setForm(p => ({ ...p, lines: [...p.lines, { account_code: "", account_name: "", debit: "", credit: "", notes: "" }] }));
  const removeLine = (i) => setForm(p => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }));
  const setLine = (i, k, v) => setForm(p => { const lines = [...p.lines]; lines[i] = { ...lines[i], [k]: v }; if (k === "account_code") { const acc = defaultAccounts.find(a => a.code === v); if (acc) lines[i].account_name = acc.name; } return { ...p, lines }; });

  const mutation = useMutation({
    mutationFn: async () => {
      const user = await Wadaq.auth.me();
      if (!user?.email) throw new Error("يجب تسجيل الدخول");
      const payload = { ...form, total_debit: totalDebit, total_credit: totalCredit, lines: form.lines.map(l => ({ ...l, debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0 })) };
      if (entry) return Wadaq.entities.JournalEntry.update(entry.id, payload);
      return Wadaq.entities.JournalEntry.create({ ...payload, created_by: user.email });
    },
    onSuccess: () => { queryClient.invalidateQueries(["journal_entries"]); onClose(); }
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-slate-400 mb-1 block">رقم القيد</label><Input value={form.entry_number} onChange={e => setForm(p => ({ ...p, entry_number: e.target.value }))} className="bg-slate-800/50 border-white/10 text-white text-sm" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">التاريخ</label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="bg-slate-800/50 border-white/10 text-white text-sm" /></div>
      </div>
      <div><label className="text-xs text-slate-400 mb-1 block">البيان *</label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف القيد المحاسبي" className="bg-slate-800/50 border-white/10 text-white text-sm" /></div>

      {/* Lines Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-slate-400">سطور القيد</label>
          <Button size="sm" variant="ghost" onClick={addLine} className="text-purple-400 hover:text-purple-300 text-xs"><PlusCircle className="w-3.5 h-3.5 ml-1" />إضافة سطر</Button>
        </div>
        <div className="rounded-xl overflow-hidden border border-white/10">
          <table className="w-full text-xs">
            <thead><tr className="bg-slate-800/50"><th className="p-2 text-right text-slate-400">الحساب</th><th className="p-2 text-slate-400">مدين</th><th className="p-2 text-slate-400">دائن</th><th className="p-2"></th></tr></thead>
            <tbody>
              {form.lines.map((line, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="p-1.5">
                    <select value={line.account_code} onChange={e => setLine(i, "account_code", e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs">
                      <option value="">اختر حساب</option>
                      {defaultAccounts.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                    </select>
                  </td>
                  <td className="p-1.5"><Input type="number" value={line.debit} onChange={e => setLine(i, "debit", e.target.value)} placeholder="0" className="bg-slate-800/50 border-white/10 text-emerald-300 h-8 text-xs text-center" /></td>
                  <td className="p-1.5"><Input type="number" value={line.credit} onChange={e => setLine(i, "credit", e.target.value)} placeholder="0" className="bg-slate-800/50 border-white/10 text-rose-300 h-8 text-xs text-center" /></td>
                  <td className="p-1.5"><Button size="sm" variant="ghost" onClick={() => removeLine(i)} className="text-slate-500 hover:text-rose-400 h-8 w-8 p-0"><MinusCircle className="w-3.5 h-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Check */}
      <div className={`p-3 rounded-xl flex items-center justify-between ${isBalanced ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"}`}>
        <div className="flex items-center gap-2">
          {isBalanced ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span className={`text-sm ${isBalanced ? "text-emerald-300" : "text-rose-300"}`}>{isBalanced ? "القيد متوازن ✓" : "القيد غير متوازن"}</span>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="text-emerald-400">مدين: {totalDebit.toLocaleString()} ر.س</span>
          <span className="text-rose-400">دائن: {totalCredit.toLocaleString()} ر.س</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} className="border-white/10 text-slate-300">إلغاء</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !isBalanced} className="bg-gradient-to-r from-blue-500 to-purple-500">
          {mutation.isPending ? "جارٍ الحفظ..." : entry ? "تحديث" : "حفظ القيد"}
        </Button>
      </div>
    </div>
  );
}

function GeneralLedgerContent() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const [editEntry, setEditEntry] = useState(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journal_entries"],
    queryFn: async () => {
      const user = await Wadaq.auth.me();
      return Wadaq.entities.JournalEntry.filter({ created_by: user.email }, "-date");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: id => Wadaq.entities.JournalEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["journal_entries"])
  });

  const postMutation = useMutation({
    mutationFn: id => Wadaq.entities.JournalEntry.update(id, { status: "posted" }),
    onSuccess: () => queryClient.invalidateQueries(["journal_entries"])
  });

  const totalPosted = entries.filter(e => e.status === "posted").reduce((s, e) => s + (e.total_debit || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">دفتر الأستاذ العام</h1>
          <p className="text-slate-400 mt-1 text-sm">القيود اليومية وميزان المراجعة</p>
        </div>
        <Button onClick={() => { setEditEntry(null); setShowForm(true); }} className="bg-gradient-to-r from-blue-500 to-purple-500">
          <Plus className="w-4 h-4 ml-2" /> قيد جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "إجمالي القيود", value: entries.length, color: "from-blue-500 to-purple-500" },
          { label: "قيود مرحّلة", value: entries.filter(e => e.status === "posted").length, color: "from-emerald-500 to-teal-500" },
          { label: "إجمالي المعاملات", value: `${totalPosted.toLocaleString()} ر.س`, color: "from-amber-500 to-orange-500" },
        ].map((s, i) => (
          <Card key={i} className="border-white/10" style={{ background: "rgba(20,20,40,0.7)" }}>
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-slate-400 text-xs">{s.label}</p><p className="text-2xl font-bold text-white mt-1">{s.value}</p></div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center`}><BookOpen className="w-6 h-6 text-white" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entries Table */}
      <Card className="border-white/10" style={{ background: "rgba(20,20,40,0.7)" }}>
        <CardHeader className="border-b border-white/5 pb-4"><CardTitle className="text-white text-lg">القيود المحاسبية</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">جارٍ التحميل...</div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">لا توجد قيود محاسبية</p>
              <Button onClick={() => setShowForm(true)} className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500"><Plus className="w-4 h-4 ml-2" />إنشاء أول قيد</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/5 text-slate-400 text-xs"><th className="p-4 text-right">رقم القيد</th><th className="p-4 text-right">التاريخ</th><th className="p-4 text-right">البيان</th><th className="p-4 text-center">المدين</th><th className="p-4 text-center">الدائن</th><th className="p-4 text-center">الحالة</th><th className="p-4"></th></tr></thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-purple-300 font-mono text-xs">{entry.entry_number}</td>
                      <td className="p-4 text-slate-300">{entry.date}</td>
                      <td className="p-4 text-white max-w-xs truncate">{entry.description}</td>
                      <td className="p-4 text-center text-emerald-400 font-medium">{(entry.total_debit || 0).toLocaleString()}</td>
                      <td className="p-4 text-center text-rose-400 font-medium">{(entry.total_credit || 0).toLocaleString()}</td>
                      <td className="p-4 text-center"><Badge className={`text-xs border ${statusColors[entry.status]}`}>{entry.status === "posted" ? "مرحّل" : "مسودة"}</Badge></td>
                      <td className="p-4">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setViewEntry(entry)} className="text-slate-400 hover:text-white h-7 w-7 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                          {entry.status === "draft" && <Button size="sm" variant="ghost" onClick={() => postMutation.mutate(entry.id)} className="text-emerald-400 hover:text-emerald-300 h-7 w-7 p-0"><CheckCircle className="w-3.5 h-3.5" /></Button>}
                          {entry.status === "draft" && <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(entry.id)} className="text-rose-400 hover:text-rose-300 h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>قيد محاسبي جديد</DialogTitle></DialogHeader>
          <JournalEntryForm entry={editEntry} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
        <DialogContent className="max-w-lg bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>تفاصيل القيد: {viewEntry?.entry_number}</DialogTitle></DialogHeader>
          {viewEntry && (
            <div className="space-y-3">
              <p className="text-slate-300 text-sm">{viewEntry.description}</p>
              <div className="rounded-xl overflow-hidden border border-white/10">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-800/50"><th className="p-2 text-right text-slate-400">الحساب</th><th className="p-2 text-slate-400">مدين</th><th className="p-2 text-slate-400">دائن</th></tr></thead>
                  <tbody>
                    {(viewEntry.lines || []).map((l, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="p-2 text-white">{l.account_code} - {l.account_name}</td>
                        <td className="p-2 text-center text-emerald-400">{l.debit ? l.debit.toLocaleString() : "-"}</td>
                        <td className="p-2 text-center text-rose-400">{l.credit ? l.credit.toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GeneralLedger() {
  const { language } = useLanguage();
  return (
    <PlanGuard requiredPlans={["smart"]} featureName={language === "ar" ? "دفتر الأستاذ العام" : "General Ledger"}>
      <GeneralLedgerContent />
    </PlanGuard>
  );
}