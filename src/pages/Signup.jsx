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
import { useLanguage } from "@/components/LanguageContext";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

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
  const { t, language, isRTL, setLanguage } = useLanguage();

  const afterAuth = async () => {
    await refresh();
    navigate(createPageUrl("Dashboard"), { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: t("signup_password_short_title"),
        description: t("signup_password_short_desc"),
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
        title: t("signup_ok_title"),
        description: t("signup_ok_desc"),
      });
      await afterAuth();
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("signup_fail_title"),
        description: err?.message || t("signup_fail_desc"),
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
        title: t("signup_google_ok_title"),
        description: t("signup_google_ok_desc"),
      });
      await afterAuth();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Google",
        description: err?.message || t("login_google_err"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 py-12"
      style={{
        background: `linear-gradient(160deg, ${NAVY} 0%, #0f2744 45%, #152a45 100%)`,
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <button
        type="button"
        onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
        className={cn(
          "absolute top-4 flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs font-bold text-slate-200 backdrop-blur-sm hover:bg-white/10 hover:text-white",
          isRTL ? "left-4" : "right-4"
        )}
        aria-label={language === "ar" ? t("language_en") : t("language_ar")}
      >
        <Languages className="h-4 w-4 text-amber-200/90" />
        {language === "ar" ? t("language_en") : t("language_ar")}
      </button>

      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-8 border"
        style={{
          background: "rgba(255,255,255,0.98)",
          borderColor: "rgba(201,162,39,0.35)",
        }}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black mb-1" style={{ color: NAVY }}>
            {t("signup_title")}
          </h1>
          <p className="text-sm font-semibold" style={{ color: GOLD }}>
            {t("signup_subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("signup_name")}</Label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("signup_name_placeholder")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("login_email")}</Label>
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
            <Label htmlFor="password">{t("signup_password_hint")}</Label>
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
            {submitting ? t("signup_submitting") : t("signup_submit")}
          </Button>
        </form>

        {googleId ? (
          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={onGoogle}
              onError={() =>
                toast({ variant: "destructive", title: t("signup_google_onerror") })
              }
              useOneTap={false}
              theme="outline"
              size="large"
              text="signup_with"
              locale={language === "ar" ? "ar" : "en"}
            />
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500 mt-4">{t("signup_google_env_hint")}</p>
        )}

        <p className="text-center text-sm text-slate-600 mt-6">
          {t("signup_has_account")}{" "}
          <Link to="/login" className="font-bold" style={{ color: NAVY }}>
            {t("signup_login_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
