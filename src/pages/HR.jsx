import React, { useState } from "react";
import { Wadaq } from "@/api/WadaqClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageContext";
import { Plus, Users, Clock, DollarSign, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, FileDown, TrendingUp, Calendar, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const TABS = ["employees", "attendance", "payroll", "summary"];
const TAB_LABELS = { employees: "الموظفون", attendance: "الحضور والغياب", payroll: "الرواتب", summary: "ملخص الرواتب" };
const TAB_ICONS = { employees: Users, attendance: Clock, payroll: DollarSign, summary: TrendingUp };

const STATUS_ATTENDANCE = {
  present: { label: "حاضر", color: "bg-green-900/40 text-green-300" },
  absent: { label: "غائب", color: "bg-red-900/40 text-red-300" },
  late: { label: "متأخر", color: "bg-yellow-900/40 text-yellow-300" },
  half_day: { label: "نصف يوم", color: "bg-orange-900/40 text-orange-300" },
  leave: { label: "إجازة", color: "bg-blue-900/40 text-blue-300" },
};

const emptyEmployee = { name: "", employee_number: "", national_id: "", phone: "", email: "", department: "", position: "", hire_date: "", basic_salary: 0, housing_allowance: 0, transport_allowance: 0, other_allowances: 0 };

export default function HR() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const qc = useQueryClient();
  const [tab, setTab] = useState("employees");
  const [empForm, setEmpForm] = useState(null);
  const [attForm, setAttForm] = useState(null);
  const [payForm, setPayForm] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => Wadaq.entities.Employee.list() });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance"], queryFn: () => Wadaq.entities.Attendance.list("-date") });
  const { data: payroll = [] } = useQuery({ queryKey: ["payroll"], queryFn: () => Wadaq.entities.Payroll.list("-created_date") });

  const saveEmp = useMutation({
    mutationFn: (d) => d.id ? Wadaq.entities.Employee.update(d.id, d) : Wadaq.entities.Employee.create(d),
    onSuccess: () => { qc.invalidateQueries(["employees"]); setEmpForm(null); },
  });
  const delEmp = useMutation({
    mutationFn: (id) => Wadaq.entities.Employee.delete(id),
    onSuccess: () => qc.invalidateQueries(["employees"]),
  });
  const saveAtt = useMutation({
    mutationFn: (d) => d.id ? Wadaq.entities.Attendance.update(d.id, d) : Wadaq.entities.Attendance.create(d),
    onSuccess: () => { qc.invalidateQueries(["attendance"]); setAttForm(null); },
  });
  const savePay = useMutation({
    mutationFn: async (d) => {
      const result = d.id ? await Wadaq.entities.Payroll.update(d.id, d) : await Wadaq.entities.Payroll.create(d);
      return result;
    },
    onSuccess: () => { qc.invalidateQueries(["payroll"]); setPayForm(null); },
  });

  const openPayForm = (emp) => {
    const gosi = emp.basic_salary * 0.1;
    const net = (emp.basic_salary || 0) + (emp.housing_allowance || 0) + (emp.transport_allowance || 0) + (emp.other_allowances || 0) - gosi;
    setPayForm({
      employee_id: emp.id, employee_name: emp.name,
      month: selectedMonth, year: selectedYear,
      basic_salary: emp.basic_salary || 0,
      housing_allowance: emp.housing_allowance || 0,
      transport_allowance: emp.transport_allowance || 0,
      other_allowances: emp.other_allowances || 0,
      overtime_pay: 0, deductions: 0, gosi_deduction: gosi, net_salary: net, status: "draft"
    });
  };

  const calcNet = (f) => (f.basic_salary || 0) + (f.housing_allowance || 0) + (f.transport_allowance || 0) + (f.other_allowances || 0) + (f.overtime_pay || 0) - (f.deductions || 0) - (f.gosi_deduction || 0);

  const fmt = (n) => (n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const todayAttendance = attendance.filter(a => a.date === new Date().toISOString().split("T")[0]);
  const monthPayroll = payroll.filter(p => p.month === selectedMonth && p.year === selectedYear);

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">👥 {ar ? "الموارد البشرية" : "Human Resources"}</h1>
        <p className="text-slate-400 text-sm mt-1">{ar ? "إدارة الموظفين والحضور والرواتب" : "Manage employees, attendance and payroll"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-300">{employees.filter(e => e.status === "active").length}</p>
          <p className="text-xs text-slate-400 mt-1">{ar ? "موظف نشط" : "Active Employees"}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-300">{todayAttendance.filter(a => a.status === "present").length}</p>
          <p className="text-xs text-slate-400 mt-1">{ar ? "حاضر اليوم" : "Present Today"}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-300">{fmt(monthPayroll.reduce((s, p) => s + (p.net_salary || 0), 0))}</p>
          <p className="text-xs text-slate-400 mt-1">{ar ? "رواتب الشهر (ر.س)" : "Month Payroll (SAR)"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl w-fit">
        {TABS.map(t => {
          const Icon = TAB_ICONS[t];
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}>
              <Icon className="w-4 h-4" /> {TAB_LABELS[t]}
            </button>
          );
        })}
      </div>

      {/* ── Employees Tab ── */}
      {tab === "employees" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setEmpForm(emptyEmployee)} className="bg-purple-600 hover:bg-purple-700 gap-2">
              <Plus className="w-4 h-4" /> {ar ? "موظف جديد" : "New Employee"}
            </Button>
          </div>
          {employees.length === 0 ? (
            <div className="text-center text-slate-400 py-10 bg-slate-800/30 rounded-2xl">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{ar ? "لا يوجد موظفون بعد" : "No employees yet"}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {employees.map(e => (
                <div key={e.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{e.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === "active" ? "bg-green-900/40 text-green-300" : "bg-slate-700 text-slate-400"}`}>
                        {e.status === "active" ? "نشط" : "غير نشط"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{e.position} {e.department && `• ${e.department}`}</p>
                    <p className="text-sm text-purple-300 font-mono mt-0.5">{fmt(e.basic_salary)} ر.س {ar ? "/ شهر" : "/ mo"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openPayForm(e)} className="text-amber-400 text-xs gap-1">
                      <DollarSign className="w-3 h-3" /> {ar ? "راتب" : "Pay"}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEmpForm(e)} className="text-slate-400 hover:text-white">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => delEmp.mutate(e.id)} className="text-slate-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Attendance Tab ── */}
      {tab === "attendance" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setAttForm({
              employee_id: "", employee_name: "", date: new Date().toISOString().split("T")[0],
              check_in: "08:00", check_out: "17:00", status: "present", overtime_hours: 0
            })} className="bg-purple-600 hover:bg-purple-700 gap-2">
              <Plus className="w-4 h-4" /> {ar ? "تسجيل حضور" : "Record Attendance"}
            </Button>
          </div>
          <div className="grid gap-2">
            {attendance.slice(0, 30).map(a => {
              const s = STATUS_ATTENDANCE[a.status] || { label: a.status, color: "bg-slate-700 text-slate-300" };
              return (
                <div key={a.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">{a.employee_name}</span>
                    <span className="text-slate-400 text-sm mx-2">•</span>
                    <span className="text-slate-400 text-sm">{a.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.check_in && <span className="text-xs text-slate-400">دخول: {a.check_in}</span>}
                    {a.check_out && <span className="text-xs text-slate-400">خروج: {a.check_out}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                  </div>
                </div>
              );
            })}
            {attendance.length === 0 && (
              <div className="text-center text-slate-400 py-10 bg-slate-800/30 rounded-2xl">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>{ar ? "لا توجد سجلات حضور" : "No attendance records"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Payroll Tab ── */}
      {tab === "payroll" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("ar-SA", { month: "long" })}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
              {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-sm text-slate-400">{ar ? `${monthPayroll.length} سجل راتب` : `${monthPayroll.length} records`}</span>
          </div>
          {monthPayroll.length === 0 ? (
            <div className="text-center text-slate-400 py-10 bg-slate-800/30 rounded-2xl">
              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{ar ? "لا توجد رواتب لهذا الشهر — اضغط راتب من تبويب الموظفين" : "No payroll this month"}</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {monthPayroll.map(p => (
                <div key={p.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{p.employee_name}</span>
                    <div className="text-xs text-slate-400 mt-0.5 space-x-2 space-x-reverse">
                      <span>أساسي: {fmt(p.basic_salary)}</span>
                      {p.gosi_deduction > 0 && <span>تأمينات: -{fmt(p.gosi_deduction)}</span>}
                      {p.deductions > 0 && <span>خصومات: -{fmt(p.deductions)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-purple-300">{fmt(p.net_salary)} ر.س</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "paid" ? "bg-green-900/40 text-green-300" : "bg-slate-700 text-slate-300"}`}>
                      {p.status === "paid" ? "مدفوع" : p.status === "approved" ? "معتمد" : "مسودة"}
                    </span>
                    {p.status === "draft" && (
                      <Button size="sm" variant="ghost" onClick={() => savePay.mutate({ ...p, status: "approved" })}
                        className="text-blue-400 text-xs">
                        <Award className="w-3 h-3 ml-1" /> اعتماد
                      </Button>
                    )}
                    {p.status === "approved" && (
                      <Button size="sm" variant="ghost" onClick={() => savePay.mutate({ ...p, status: "paid", payment_date: new Date().toISOString().split("T")[0] })}
                        className="text-green-400 text-xs">
                        <CheckCircle className="w-3 h-3 ml-1" /> دفع
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Payroll Summary Tab ── */}
      {tab === "summary" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("ar-SA", { month: "long" })}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
              {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-300">{fmt(monthPayroll.reduce((s, p) => s + (p.basic_salary || 0), 0))}</p>
              <p className="text-xs text-slate-400 mt-1">إجمالي الرواتب الأساسية</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-300">{fmt(monthPayroll.reduce((s, p) => s + (p.housing_allowance || 0) + (p.transport_allowance || 0) + (p.other_allowances || 0), 0))}</p>
              <p className="text-xs text-slate-400 mt-1">إجمالي البدلات</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-300">{fmt(monthPayroll.reduce((s, p) => s + (p.gosi_deduction || 0) + (p.deductions || 0), 0))}</p>
              <p className="text-xs text-slate-400 mt-1">إجمالي الخصومات</p>
            </div>
            <div className="bg-slate-800/50 border border-green-700/50 rounded-xl p-4 text-center border-2">
              <p className="text-2xl font-bold text-green-300">{fmt(monthPayroll.reduce((s, p) => s + (p.net_salary || 0), 0))}</p>
              <p className="text-xs text-slate-400 mt-1">صافي الرواتب</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { status: "paid", label: "مدفوع", color: "text-green-300", bg: "bg-green-900/20" },
              { status: "approved", label: "معتمد", color: "text-blue-300", bg: "bg-blue-900/20" },
              { status: "draft", label: "مسودة", color: "text-slate-300", bg: "bg-slate-700/30" },
            ].map(({ status, label, color, bg }) => {
              const count = monthPayroll.filter(p => p.status === status).length;
              const total = monthPayroll.filter(p => p.status === status).reduce((s, p) => s + (p.net_salary || 0), 0);
              return (
                <div key={status} className={`${bg} border border-slate-700/50 rounded-xl p-4`}>
                  <p className={`text-xl font-bold ${color}`}>{count}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                  {count > 0 && <p className="text-xs text-slate-500 mt-1">{fmt(total)} ر.س</p>}
                </div>
              );
            })}
          </div>

          {/* Per Employee Table */}
          {monthPayroll.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700/50">
                <h3 className="font-semibold text-white text-sm">تفاصيل رواتب الموظفين</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700/30">
                    <tr>
                      {["الموظف", "أساسي", "بدلات", "إضافي", "خصومات", "صافي", "الحالة"].map(h => (
                        <th key={h} className="text-right px-3 py-2 text-xs text-slate-400 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthPayroll.map(p => (
                      <tr key={p.id} className="border-t border-slate-700/30 hover:bg-slate-700/20">
                        <td className="px-3 py-2 text-white font-medium">{p.employee_name}</td>
                        <td className="px-3 py-2 text-slate-300">{fmt(p.basic_salary)}</td>
                        <td className="px-3 py-2 text-blue-300">{fmt((p.housing_allowance || 0) + (p.transport_allowance || 0) + (p.other_allowances || 0))}</td>
                        <td className="px-3 py-2 text-amber-300">{fmt(p.overtime_pay)}</td>
                        <td className="px-3 py-2 text-red-300">-{fmt((p.gosi_deduction || 0) + (p.deductions || 0))}</td>
                        <td className="px-3 py-2 text-green-300 font-bold">{fmt(p.net_salary)}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "paid" ? "bg-green-900/40 text-green-300" : p.status === "approved" ? "bg-blue-900/40 text-blue-300" : "bg-slate-700 text-slate-300"}`}>
                            {p.status === "paid" ? "مدفوع" : p.status === "approved" ? "معتمد" : "مسودة"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {monthPayroll.length === 0 && (
            <div className="text-center text-slate-400 py-10 bg-slate-800/30 rounded-2xl">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>لا توجد رواتب لهذا الشهر</p>
            </div>
          )}
        </div>
      )}

      {/* Employee Form */}
      <Dialog open={!!empForm} onOpenChange={() => setEmpForm(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{empForm?.id ? "تعديل الموظف" : "موظف جديد"}</DialogTitle></DialogHeader>
          {empForm && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { k: "name", l: "الاسم الكامل *", full: true },
                { k: "employee_number", l: "رقم الموظف *" },
                { k: "national_id", l: "رقم الهوية" },
                { k: "phone", l: "الهاتف" },
                { k: "email", l: "البريد" },
                { k: "department", l: "القسم" },
                { k: "position", l: "المسمى الوظيفي", full: true },
                { k: "hire_date", l: "تاريخ التعيين", type: "date", full: true },
                { k: "basic_salary", l: "الراتب الأساسي (ر.س)", type: "number" },
                { k: "housing_allowance", l: "بدل السكن", type: "number" },
                { k: "transport_allowance", l: "بدل المواصلات", type: "number" },
                { k: "other_allowances", l: "بدلات أخرى", type: "number" },
              ].map(f => (
                <div key={f.k} className={f.full ? "col-span-2" : ""}>
                  <label className="text-xs text-slate-400 block mb-1">{f.l}</label>
                  <Input type={f.type || "text"} value={empForm[f.k] || ""} onChange={e => setEmpForm(p => ({ ...p, [f.k]: f.type === "number" ? +e.target.value : e.target.value }))}
                    className="bg-slate-800 border-slate-600 text-white" />
                </div>
              ))}
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setEmpForm(null)}>إلغاء</Button>
                <Button onClick={() => saveEmp.mutate(empForm)} disabled={!empForm.name || saveEmp.isPending} className="bg-purple-600 hover:bg-purple-700">
                  {saveEmp.isPending ? "..." : "حفظ"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attendance Form */}
      <Dialog open={!!attForm} onOpenChange={() => setAttForm(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>تسجيل حضور</DialogTitle></DialogHeader>
          {attForm && (
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">الموظف</label>
                <select value={attForm.employee_name} onChange={e => setAttForm(f => ({ ...f, employee_name: e.target.value, employee_id: employees.find(e2 => e2.name === e.target.value)?.id || "" }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">-- اختر --</option>
                  {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-slate-400 block mb-1">التاريخ</label>
                <Input type="date" value={attForm.date} onChange={e => setAttForm(f => ({ ...f, date: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-400 block mb-1">وقت الحضور</label>
                  <Input type="time" value={attForm.check_in} onChange={e => setAttForm(f => ({ ...f, check_in: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" /></div>
                <div><label className="text-xs text-slate-400 block mb-1">وقت الانصراف</label>
                  <Input type="time" value={attForm.check_out} onChange={e => setAttForm(f => ({ ...f, check_out: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" /></div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">الحالة</label>
                <select value={attForm.status} onChange={e => setAttForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                  {Object.entries(STATUS_ATTENDANCE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAttForm(null)}>إلغاء</Button>
                <Button onClick={() => saveAtt.mutate(attForm)} disabled={!attForm.employee_name || saveAtt.isPending} className="bg-purple-600 hover:bg-purple-700">
                  {saveAtt.isPending ? "..." : "حفظ"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payroll Form */}
      <Dialog open={!!payForm} onOpenChange={() => setPayForm(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>راتب: {payForm?.employee_name}</DialogTitle></DialogHeader>
          {payForm && (
            <div className="space-y-3 mt-2">
              {[
                { k: "basic_salary", l: "الراتب الأساسي" },
                { k: "housing_allowance", l: "بدل السكن" },
                { k: "transport_allowance", l: "بدل المواصلات" },
                { k: "other_allowances", l: "بدلات أخرى" },
                { k: "overtime_pay", l: "وقت إضافي" },
                { k: "gosi_deduction", l: "خصم التأمينات (10%)" },
                { k: "deductions", l: "خصومات أخرى" },
              ].map(f => (
                <div key={f.k} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-slate-400 w-40">{f.l}</label>
                  <Input type="number" value={payForm[f.k] || 0}
                    onChange={e => {
                      const updated = { ...payForm, [f.k]: +e.target.value };
                      updated.net_salary = calcNet(updated);
                      setPayForm(updated);
                    }}
                    className="bg-slate-800 border-slate-600 text-white w-32 text-left" />
                </div>
              ))}
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-3 flex justify-between items-center">
                <span className="font-bold text-white">صافي الراتب</span>
                <span className="text-xl font-bold text-purple-300">{fmt(payForm.net_salary)} ر.س</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setPayForm(null)}>إلغاء</Button>
                <Button onClick={() => savePay.mutate(payForm)} disabled={savePay.isPending} className="bg-purple-600 hover:bg-purple-700">
                  {savePay.isPending ? "..." : "حفظ"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}