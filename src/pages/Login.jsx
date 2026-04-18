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

export default function Login() {
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
    const ret = sessionStorage.getItem("wadaq_return_url");
    if (ret) {
      sessionStorage.removeItem("wadaq_return_url");
      navigate(ret, { replace: true });
    } else {
      navigate(createPageUrl("Dashboard"), { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await Wadaq.auth.login({ email, password });
      toast({ title: t("login_toast_ok_title"), description: t("login_toast_ok_desc") });
      await afterAuth();
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("login_toast_fail_title"),
        description: err?.message || t("login_toast_fail_desc"),
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
      toast({ title: t("login_google_ok") });
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
      className="relative min-h-screen flex items-center justify-center p-6"
      style={{
        background: `linear-gradient(160deg, ${NAVY} 0%, #0f2744 45%, #152a45 100%)`,
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={cn(
          "absolute top-4 flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-2 py-1.5 backdrop-blur-sm",
          isRTL ? "left-4" : "right-4"
        )}
        role="group"
        aria-label={t("language_label")}
      >
        <Languages className="h-4 w-4 text-amber-200/90" />
        <button
          type="button"
          onClick={() => setLanguage("ar")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-bold",
            language === "ar" ? "bg-white/20 text-white" : "text-slate-300 hover:bg-white/10"
          )}
        >
          {t("language_ar")}
        </button>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-bold",
            language === "en" ? "bg-white/20 text-white" : "text-slate-300 hover:bg-white/10"
          )}
        >
          {t("language_en")}
        </button>
      </div>

      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-8 border"
        style={{
          background: "rgba(255,255,255,0.98)",
          borderColor: "rgba(201,162,39,0.35)",
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black mb-1" style={{ color: NAVY }}>
            {t("app_name_short")}
          </h1>
          <p className="text-sm font-semibold" style={{ color: GOLD }}>
            {t("login_title")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("login_email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("login_password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white"
            />
          </div>
          <Button
            type="submit"
            className="w-full font-bold text-white border-0"
            style={{ background: NAVY, borderBottom: `3px solid ${GOLD}` }}
            disabled={submitting}
          >
            {submitting ? t("login_submitting") : t("login_submit")}
          </Button>
        </form>

        {googleId ? (
          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={onGoogle}
              onError={() =>
                toast({ variant: "destructive", title: t("login_google_onerror") })
              }
              useOneTap={false}
              theme="outline"
              size="large"
              text="signin_with"
              locale={language === "ar" ? "ar" : "en"}
            />
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500 mt-4">
            {t("login_google_env_hint")}
          </p>
        )}

        <p className="text-center text-sm text-slate-600 mt-6">
          {t("login_no_account")}{" "}
          <Link to="/signup" className="font-bold" style={{ color: NAVY }}>
            {t("login_signup_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
