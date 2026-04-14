import React, { useState } from "react";
import { Wadaq } from "@/api/WadaqCore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Save, Loader2, Key, Copy, Eye, EyeOff, Lock, Printer, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import PrinterManager from "@/components/printer/PrinterManager";
import InvoiceCustomizer from "@/components/invoices/InvoiceCustomizer";
import "@/components/printer/ThermalPrintService";

/**
 * إعدادات حساب المستخدم: بيانات المنشأة للفواتير، الشعار، نماذج الفواتير، الطابعات، ومفتاح API عند التوفّر
 */
export default function Settings() {
  const { language } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [appName, setAppName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyVatNumber, setCompanyVatNumber] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => Wadaq.auth.me(),
  });

  React.useEffect(() => {
    if (user) {
      setOrganizationName(user.organization_name || "");
      setAppName(user.app_name || "");
      setCompanyName(user.company_name || "");
      setLogoUrl(user.company_logo || "");
      setCompanyAddress(user.company_address || "");
      setCompanyPhone(user.company_phone || "");
      setCompanyEmail(user.company_email || "");
      setCompanyVatNumber(user.company_vat_number || "");
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: (data) => Wadaq.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { file_url } = await Wadaq.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("حدث خطأ أثناء رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    const payload = {
      company_logo: logoUrl,
      company_name: companyName,
      company_address: companyAddress,
      company_phone: companyPhone,
      company_email: companyEmail,
      company_vat_number: companyVatNumber,
    };
    if (user?.role === "admin") {
      payload.organization_name = organizationName;
      payload.app_name = appName;
    }
    updateUserMutation.mutate(payload);
  };

  const generateApiKey = async () => {
    try {
      setGeneratingKey(true);
      const apiKey =
        "sk_" +
        Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      await Wadaq.auth.updateMe({ api_key: apiKey });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    } catch (error) {
      console.error("Error generating API key:", error);
      alert(language === "ar" ? "حدث خطأ أثناء إنشاء المفتاح" : "Error generating API key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(language === "ar" ? "تم النسخ!" : "Copied!");
  };

  const hasApiAccess =
    user?.subscription_status === "active" &&
    (user?.subscription_plan === "smart" ||
      user?.subscription_plan === "golden" ||
      user?.has_api_access === true);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
          {language === "ar" ? "إعدادات الحساب" : "Account settings"}
        </h1>
        <p className="text-slate-500 mt-1">
          {language === "ar"
            ? "بيانات منشأتك المحاسبية، الشعار، ونماذج الفواتير والطباعة"
            : "Your business profile, logo, invoice look, and printers"}
        </p>
      </div>

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-800">
            {language === "ar" ? "معلومات المنشأة" : "Organization information"}
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            {language === "ar"
              ? "تظهر في الفواتير والتقارير الصادرة عن حسابك"
              : "Shown on invoices and reports for your account"}
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {user?.role === "admin" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="organizationName" className="text-slate-700">
                  {language === "ar" ? "اسم المؤسسة (Organization) *" : "Organization name *"}
                </Label>
                <Input
                  id="organizationName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className={language === "ar" ? "text-right" : "text-left"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appName" className="text-slate-700">
                  {language === "ar" ? "اسم التطبيق (App) *" : "App name *"}
                </Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className={language === "ar" ? "text-right" : "text-left"}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-slate-700">
              {language === "ar" ? "اسم المنشأة في الفواتير *" : "Trading name on invoices *"}
            </Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={
                language === "ar" ? "مثال: شركة المحاسب الذكي للتقنية" : "e.g., Your company legal name"
              }
              className={language === "ar" ? "text-right" : "text-left"}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">{language === "ar" ? "شعار المنشأة" : "Company logo"}</Label>
            <div className="flex flex-col gap-4">
              {logoUrl && (
                <div className="flex items-center justify-center p-6 bg-white rounded-xl border-2 border-slate-200">
                  <img src={logoUrl} alt="Company Logo" className="max-h-32 object-contain" />
                </div>
              )}

              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id="logoUpload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("logoUpload")?.click()}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      {language === "ar" ? "جاري الرفع..." : "Uploading..."}
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 ml-2" />
                      {logoUrl
                        ? language === "ar"
                          ? "تغيير الشعار"
                          : "Change logo"
                        : language === "ar"
                          ? "رفع الشعار"
                          : "Upload logo"}
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-slate-500">
                {language === "ar"
                  ? "يُفضّل PNG بخلفية شفافة — يظهر في الفواتير والواجهات"
                  : "PNG with transparent background works best"}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyAddress">{language === "ar" ? "العنوان" : "Address"}</Label>
              <Input
                id="companyAddress"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className={language === "ar" ? "text-right" : "text-left"}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">{language === "ar" ? "الهاتف" : "Phone"}</Label>
                <Input
                  id="companyPhone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">{language === "ar" ? "البريد" : "Email"}</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  dir="ltr"
                  className="text-left"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyVatNumber">{language === "ar" ? "الرقم الضريبي" : "VAT number"}</Label>
              <Input
                id="companyVatNumber"
                value={companyVatNumber}
                onChange={(e) => setCompanyVatNumber(e.target.value)}
                dir="ltr"
                className="text-left"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <Button onClick={handleSave} disabled={updateUserMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 ml-2" />
                  {language === "ar" ? "حفظ التغييرات" : "Save"}
                </>
              )}
            </Button>
          </div>

          {updateUserMutation.isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-700 text-sm text-center">
                {language === "ar" ? "✓ تم حفظ التغييرات بنجاح" : "✓ Saved"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">
                {language === "ar" ? "نماذج ومظهر الفاتورة" : "Invoice templates & style"}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {language === "ar"
                  ? "القوالب، الألوان، موضع الشعار، والنصوص الثابتة في الفاتورة"
                  : "Templates, colors, logo placement, and default invoice texts"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <InvoiceCustomizer
            embeddedInSettings
            onClose={() => {}}
            onStyleChange={() => queryClient.invalidateQueries({ queryKey: ["currentUser"] })}
          />
        </CardContent>
      </Card>

      {hasApiAccess && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  {language === "ar" ? "واجهة المطورين (API)" : "Developer API"}
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  {language === "ar" ? "مفتاح للتكامل مع أنظمة خارجية" : "Key for external integrations"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {user?.api_key ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">{language === "ar" ? "مفتاح API" : "API key"}</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={user.api_key}
                        readOnly
                        dir="ltr"
                        className="text-left font-mono pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button variant="outline" onClick={() => copyToClipboard(user.api_key)}>
                      <Copy className="w-4 h-4 ml-2" />
                      {language === "ar" ? "نسخ" : "Copy"}
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={generateApiKey}
                  disabled={generatingKey}
                  className="border-rose-500 text-rose-600 hover:bg-rose-50"
                >
                  {generatingKey ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4 ml-2" />
                  )}
                  {language === "ar" ? "تجديد المفتاح" : "Regenerate"}
                </Button>
              </div>
            ) : (
              <Button onClick={generateApiKey} disabled={generatingKey} className="bg-blue-600 hover:bg-blue-700">
                {generatingKey ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Key className="w-4 h-4 ml-2" />}
                {language === "ar" ? "إنشاء مفتاح API" : "Generate API key"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!hasApiAccess && (
        <Card className="bg-slate-50 border border-slate-200">
          <CardContent className="p-6 flex gap-3 items-start">
            <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-600">
                {language === "ar"
                  ? "مفتاح API متاح ضمن الباقات المؤهّلة. رقِّ باقتك من صفحة الأسعار."
                  : "API keys are available on qualifying plans."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-purple-600" />
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">
                {language === "ar" ? "إدارة الطابعات" : "Printers"}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {language === "ar" ? "طابعات حرارية وربط الجهاز" : "Thermal printers and device pairing"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <PrinterManager />
        </CardContent>
      </Card>
    </div>
  );
}
