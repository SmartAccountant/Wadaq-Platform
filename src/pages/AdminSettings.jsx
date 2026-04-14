import React, { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqClient";
import { useAuth } from "@/context/AuthContext";
import { hashPasswordForAuth } from "@/lib/authCrypto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  UserPlus,
  Search,
  CalendarPlus,
  CreditCard,
  FileKey,
  ScrollText,
} from "lucide-react";
import FullBackup from "@/components/settings/FullBackup";
import SourceCodeExport from "@/components/settings/SourceCodeExport";

function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "Aa1!";
}

function extendOneYearIso(currentEndIso) {
  const now = new Date();
  const end = currentEndIso ? new Date(currentEndIso) : now;
  const base = end > now ? end : now;
  const next = new Date(base);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString();
}

function addDaysIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * إعدادات المسؤول: الاشتراكات، إضافة مشترك يدوياً، تمديد، وإعدادات المنصّة
 */
export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [subFilter, setSubFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("user");
  /** trial = تجربة 14 يوم | paid_manual = اشتراك نشط سنة من اليوم */
  const [onboardingMode, setOnboardingMode] = useState("trial");

  const [orgName, setOrgName] = useState("");
  const [appName, setAppName] = useState("");

  const { data: me } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => Wadaq.auth.me(),
    enabled: user?.role === "admin",
  });

  React.useEffect(() => {
    if (me) {
      setOrgName(me.organization_name || "");
      setAppName(me.app_name || "");
    }
  }, [me]);

  const savePlatformMutation = useMutation({
    mutationFn: (data) => Wadaq.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast({ title: "تم حفظ إعدادات المنصّة" });
    },
    onError: (e) => toast({ variant: "destructive", title: "خطأ", description: e?.message }),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => Wadaq.entities.User.list("-created_date"),
    enabled: user?.role === "admin",
  });

  const filtered = useMemo(() => {
    let rows = [...users];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          String(r.email || "")
            .toLowerCase()
            .includes(q) || String(r.name || "")
            .toLowerCase()
            .includes(q)
      );
    }
    if (subFilter !== "all") {
      rows = rows.filter((r) => (r.subscription_status || "") === subFilter);
    }
    return rows;
  }, [users, search, subFilter]);

  const updateUser = useMutation({
    mutationFn: ({ id, data }) => Wadaq.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: "تم حفظ التغييرات" });
    },
    onError: (e) =>
      toast({ variant: "destructive", title: "خطأ", description: e?.message }),
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const em = String(newEmail).trim().toLowerCase();
      if (!em) throw new Error("البريد مطلوب");
      const exists = await Wadaq.entities.User.filter({ email: em });
      if (exists.length) throw new Error("البريد مسجّل مسبقاً");
      const tempPass = randomPassword();
      const password_hash = await hashPasswordForAuth(tempPass);
      const trialEnd = addDaysIso(14);
      const paidEnd = extendOneYearIso(null);

      const base = {
        email: em,
        name: newName.trim() || em.split("@")[0],
        password_hash,
        role: newRole,
        account_status: "active",
        auth_provider: "email",
        company_name: "",
        company_vat_number: "",
        settings: {},
      };

      const row =
        onboardingMode === "paid_manual"
          ? await Wadaq.entities.User.create({
              ...base,
              subscription_status: "active",
              subscription_end_date: paidEnd,
              subscription_type: "manual",
              trial_ends_at: null,
              trial_end_date: null,
            })
          : await Wadaq.entities.User.create({
              ...base,
              subscription_status: "trial",
              trial_ends_at: trialEnd,
              trial_end_date: trialEnd,
            });

      await Wadaq.api.SendEmail({
        to: em,
        subject: "بيانات الدخول — ودق",
        body: `مرحباً،\n\nتم إنشاء حسابك.\nالبريد: ${em}\nكلمة المرور المؤقتة: ${tempPass}\nيُنصح بتغييرها بعد أول دخول.\n`,
      });
      return { row, tempPass };
    },
    onSuccess: (data) => {
      const { tempPass, row } = data;
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setDialogOpen(false);
      setNewEmail("");
      setNewName("");
      setNewRole("user");
      setOnboardingMode("trial");
      toast({
        title: "تم إنشاء المستخدم",
        description: `أُرسلت تفاصيل الدخول إلى ${row.email}. كلمة المرور المؤقتة: ${tempPass}`,
      });
    },
    onError: (e) =>
      toast({ variant: "destructive", title: "فشل الإنشاء", description: e?.message }),
  });

  if (user?.role !== "admin") {
    return <Navigate to="/Dashboard" replace />;
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-xl"
            style={{ background: "#1a3a5c", color: "#c9a227" }}
          >
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">إعدادات المسؤول</h1>
            <p className="text-sm text-slate-500">
              الاشتراكات، إضافة مشترك يدوياً، وتمديد الصلاحيات
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/payment-settings" className="gap-2">
              <CreditCard className="w-4 h-4" />
              إعدادات الدفع
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/payment-logs" className="gap-2">
              <ScrollText className="w-4 h-4" />
              سجلات الدفع
            </Link>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="font-bold text-white gap-2"
                style={{ background: "#1a3a5c", borderBottom: "2px solid #c9a227" }}
              >
                <UserPlus className="w-4 h-4" />
                إضافة مشترك
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>مستخدم / مشترك جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label>البريد الإلكتروني *</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>الاسم</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>الدور</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">مستخدم</SelectItem>
                      <SelectItem value="admin">مدير</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>نوع التفعيل</Label>
                  <Select value={onboardingMode} onValueChange={setOnboardingMode}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">تجربة 14 يوماً</SelectItem>
                      <SelectItem value="paid_manual">اشتراك نشط سنة (يدوي — دون دفع عبر البوابة)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-slate-500">
                  تُولَّد كلمة مرور عشوائية وتُعرض لك مرة واحدة، ويُرسل إشعار بريد عبر{" "}
                  <code>Wadaq.api.SendEmail</code>.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={() => createUser.mutate()}
                  disabled={createUser.isPending}
                  style={{ background: "#1a3a5c" }}
                  className="text-white"
                >
                  {createUser.isPending ? "جاري الحفظ…" : "إنشاء الحساب"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="بحث بالبريد أو الاسم…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={subFilter} onValueChange={setSubFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="حالة الاشتراك" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="trial">تجريبي</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="expired">منتهي</SelectItem>
            <SelectItem value="unlimited">غير محدود</SelectItem>
            <SelectItem value="cancelled">ملغى</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right min-w-[140px]">المنشأة</TableHead>
              <TableHead className="text-right">البريد</TableHead>
              <TableHead className="text-right">حالة الاشتراك</TableHead>
              <TableHead className="text-right min-w-[160px] whitespace-nowrap">انتهاء الاشتراك</TableHead>
              <TableHead className="text-right min-w-[120px]">تمديد</TableHead>
              <TableHead className="text-right min-w-[120px]">تجربة</TableHead>
              <TableHead className="text-right whitespace-nowrap">الحساب</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  جاري التحميل…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  لا نتائج
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const isSelf = u.id === user?.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.company_name || u.name || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs" dir="ltr">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.subscription_status || "trial"}
                        onValueChange={(v) =>
                          updateUser.mutate({ id: u.id, data: { subscription_status: v } })
                        }
                      >
                        <SelectTrigger className="h-8 w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">تجريبي</SelectItem>
                          <SelectItem value="active">نشط (مدفوع)</SelectItem>
                          <SelectItem value="expired">منتهٍ</SelectItem>
                          <SelectItem value="unlimited">غير محدود</SelectItem>
                          <SelectItem value="cancelled">ملغى</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="datetime-local"
                        className="h-8 text-xs font-mono"
                        dir="ltr"
                        value={
                          u.subscription_end_date
                            ? new Date(u.subscription_end_date).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          updateUser.mutate({
                            id: u.id,
                            data: {
                              subscription_end_date: v ? new Date(v).toISOString() : null,
                            },
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1 whitespace-nowrap"
                        disabled={u.subscription_status === "unlimited"}
                        onClick={() =>
                          updateUser.mutate({
                            id: u.id,
                            data: {
                              subscription_status: "active",
                              subscription_end_date: extendOneYearIso(u.subscription_end_date),
                            },
                          })
                        }
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        + سنة
                      </Button>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                      {u.trial_ends_at || u.trial_end_date
                        ? new Date(u.trial_ends_at || u.trial_end_date).toLocaleDateString("ar-SA")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-slate-500 hidden sm:inline">
                          {(u.account_status || "active") === "active" ? "مفعّل" : "معطّل"}
                        </span>
                        <Switch
                          checked={(u.account_status || "active") === "active"}
                          disabled={isSelf}
                          onCheckedChange={(checked) =>
                            updateUser.mutate({
                              id: u.id,
                              data: { account_status: checked ? "active" : "suspended" },
                            })
                          }
                          aria-label="تفعيل أو تعطيل الحساب"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Card className="border-amber-100 bg-amber-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileKey className="w-5 h-5 text-[#1a3a5c]" />
            <CardTitle className="text-lg">إعدادات المنصّة (الاسم الظاهر)</CardTitle>
          </div>
          <CardDescription>
            اسم المؤسسة المطوِّرة واسم التطبيق كما يظهران في النظام — للمسؤول فقط
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label>اسم المؤسسة (Organization)</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>اسم التطبيق (App)</Label>
            <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
          </div>
          <Button
            type="button"
            onClick={() =>
              savePlatformMutation.mutate({
                organization_name: orgName,
                app_name: appName,
              })
            }
            disabled={savePlatformMutation.isPending}
            style={{ background: "#1a3a5c" }}
            className="text-white"
          >
            {savePlatformMutation.isPending ? "جاري الحفظ…" : "حفظ إعدادات المنصّة"}
          </Button>
        </CardContent>
      </Card>

      <FullBackup />
      {user?.email === user?.owner_email && <SourceCodeExport />}

      <p className="text-center text-sm text-slate-500">
        <Link to={createPageUrl("Settings")} className="text-[#1a3a5c] font-semibold hover:underline">
          الانتقال إلى إعدادات الحساب (المنشأة والفواتير)
        </Link>
      </p>
    </div>
  );
}
