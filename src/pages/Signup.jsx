import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Wadaq } from "@/api/WadaqCore";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";

const NAVY = "#1a3a5c";
const GOLD = "#c9a227";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const afterAuth = async () => {
    await refresh();
    navigate(createPageUrl("Dashboard"), { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "كلمة المرور قصيرة",
        description: "استخدم 8 أحرف على الأقل",
      });
      return;
    }
    setSubmitting(true);
    try {
      await Wadaq.auth.signup({
        email,
        password,
        name: name.trim() || undefined,
        company_name: "",
        company_vat_number: "",
      });
      toast({
        title: "تم إنشاء الحساب",
        description: "يمكنك الآن استخدام النظام — فترة تجريبية عند التفعيل",
      });
      await afterAuth();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "تعذّر التسجيل",
        description: err?.message || "حاول مرة أخرى",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async (credentialResponse) => {
    const c = credentialResponse?.credential;
    if (!c) return;
    setSubmitting(true);
    try {
      await Wadaq.auth.loginWithGoogle({ credential: c });
      toast({
        title: "تم إنشاء / ربط الحساب",
        description: "حساب جديد يحصل على فترة تجريبية عند التفعيل",
      });
      await afterAuth();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Google",
        description: err?.message || "فشل المصادقة",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 py-12"
      style={{
        background: `linear-gradient(160deg, ${NAVY} 0%, #0f2744 45%, #152a45 100%)`,
      }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-8 border"
        style={{
          background: "rgba(255,255,255,0.98)",
          borderColor: "rgba(201,162,39,0.35)",
        }}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black mb-1" style={{ color: NAVY }}>
            إنشاء حساب جديد
          </h1>
          <p className="text-sm font-semibold" style={{ color: GOLD }}>
            بالبريد الإلكتروني وكلمة المرور — أو عبر Google
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد محمد"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور (8 أحرف فأكثر)</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button
            type="submit"
            className="w-full font-bold text-white border-0 mt-2"
            style={{ background: NAVY, borderBottom: `3px solid ${GOLD}` }}
            disabled={submitting}
          >
            {submitting ? "جاري إنشاء الحساب…" : "إنشاء الحساب"}
          </Button>
        </form>

        {googleId ? (
          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={onGoogle}
              onError={() =>
                toast({ variant: "destructive", title: "تعذّر التسجيل بجوجل" })
              }
              useOneTap={false}
              theme="outline"
              size="large"
              text="signup_with"
              locale="ar"
            />
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500 mt-4">
            لإظهار «Google» أضف <code className="bg-slate-100 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code>
          </p>
        )}

        <p className="text-center text-sm text-slate-600 mt-6">
          لديك حساب؟{" "}
          <Link to="/login" className="font-bold" style={{ color: NAVY }}>
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
