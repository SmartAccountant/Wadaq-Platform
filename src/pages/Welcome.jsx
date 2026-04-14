import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wadaq } from "@/api/WadaqCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, FileText, Users, Package, BarChart3, Sparkles, ArrowRight, ArrowLeft, Play, ChevronRight, Keyboard, CheckCircle2 } from "lucide-react";
import { createPageUrl } from "../utils";
import confetti from "canvas-confetti";

export default function Welcome() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const quickSteps = [
    {
      title: "إعداد معلومات الشركة",
      description: "ابدأ بإضافة معلومات شركتك والشعار من الإعدادات",
      details: "أضف اسم الشركة، الرقم الضريبي، السجل التجاري، والشعار لتظهر في الفواتير",
      icon: Sparkles,
      action: () => navigate("/Settings"),
      color: "from-purple-500 to-pink-500",
      time: "دقيقتان"
    },
    {
      title: "إضافة المنتجات",
      description: "أضف منتجاتك أو خدماتك مع الأسعار والصور",
      details: "يمكنك إضافة الباركود، التصنيفات، والكميات المتوفرة لكل منتج",
      icon: Package,
      action: () => navigate("/Products"),
      color: "from-blue-500 to-cyan-500",
      time: "3 دقائق"
    },
    {
      title: "إضافة العملاء",
      description: "أضف بيانات عملائك لسهولة إصدار الفواتير",
      details: "احفظ أسماء العملاء وأرقام الهواتف لاستخدامها في الفواتير بسرعة",
      icon: Users,
      action: () => navigate("/Customers"),
      color: "from-indigo-500 to-purple-500",
      time: "دقيقة واحدة"
    },
    {
      title: "إنشاء فاتورة",
      description: "أنشئ أول فاتورة لك بسهولة",
      details: "اختر العميل، أضف المنتجات، واطبع الفاتورة بصيغة A4 أو حرارية",
      icon: FileText,
      action: () => navigate("/Invoices"),
      color: "from-emerald-500 to-teal-500",
      time: "دقيقة واحدة"
    },
    {
      title: "تابع الأداء",
      description: "عرض التقارير والإحصائيات",
      details: "شاهد المبيعات، الأرباح، وأهم المنتجات في لوحة التحكم",
      icon: BarChart3,
      action: () => navigate("/Dashboard"),
      color: "from-orange-500 to-red-500",
      time: "متاح دائماً"
    }
  ];

  const handleSkip = async () => {
    setLoading(true);
    try {
      await Wadaq.auth.updateMe({ onboarding_completed: true });
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error:", error);
      navigate(createPageUrl("Dashboard"));
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8 py-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-sm font-semibold animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            حسابك نشط ✨
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-l from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            مرحباً بك في برنامج ودق المحاسبي
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            ابدأ رحلتك مع Wadq في 5 خطوات بسيطة
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Play className="w-4 h-4" />
            <span>اتبع الخطوات أدناه للبدء في أقل من 10 دقائق</span>
          </div>
        </div>

        {/* Interactive Guide */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              دليل البدء السريع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center gap-2 mb-6">
              {quickSteps.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    idx <= currentStep ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Current Step Detail */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-start gap-4">
                {React.createElement(() => {
                  const StepIcon = quickSteps[currentStep].icon;
                  return (
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${quickSteps[currentStep].color} flex items-center justify-center flex-shrink-0`}>
                      <StepIcon className="w-6 h-6 text-white" />
                    </div>
                  );
                })}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{quickSteps[currentStep].title}</h3>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                      {quickSteps[currentStep].time}
                    </span>
                  </div>
                  <p className="text-slate-300 mb-2">{quickSteps[currentStep].description}</p>
                  <p className="text-slate-400 text-sm">{quickSteps[currentStep].details}</p>
                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={quickSteps[currentStep].action}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      ابدأ الآن
                      <ChevronRight className="w-4 h-4 mr-2" />
                    </Button>
                    {currentStep < quickSteps.length - 1 && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        التالي
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* All Steps Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
              {quickSteps.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`p-3 rounded-lg border transition-all text-right ${
                      idx === currentStep 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center mb-2`}>
                      <StepIcon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{step.time}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                اختصارات لوحة المفاتيح
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-200 text-sm space-y-2">
              <p>• <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl + K</kbd> بحث سريع</p>
              <p>• <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl + N</kbd> فاتورة جديدة</p>
              <p>• <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl + P</kbd> منتج جديد</p>
              <p>• <kbd className="px-2 py-1 bg-white/10 rounded">Shift + ?</kbd> عرض المساعدة</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                🔒 أمان بياناتك
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-200 text-sm space-y-2">
              <p>✓ تشفير متقدم لجميع البيانات</p>
              <p>✓ نسخ احتياطي تلقائي كل 24 ساعة</p>
              <p>✓ حماية بمستوى البنوك المعتمدة</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl border-emerald-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                📱 الدعم الفني
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-200 text-sm space-y-2">
              <p>📞 واتساب: 0500070065</p>
              <p>📧 بريد: support@rikazai.com</p>
              <p>🤖 مساعد ذكي متاح 24/7</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={loading}
            className="border-white/20 text-white hover:bg-white/10"
          >
            تخطي والذهاب للوحة التحكم
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </div>

        {/* Footer Note */}
        <div className="text-center text-slate-400 text-sm">
          <p>💡 يمكنك العودة لهذا الدليل في أي وقت من الإعدادات</p>
        </div>
      </div>
    </div>
  );
}