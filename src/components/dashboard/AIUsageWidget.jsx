import React from "react";
import { Sparkles, TrendingUp, AlertCircle } from "lucide-react";

export default function AIUsageWidget({ user }) {
  // استخدام قيم افتراضية في حال عدم وجود بيانات المستخدم
  const creditUsed = user?.ai_credit_used || 45;
  const creditLimit = user?.ai_credit_limit || 100;
  const percentage = (creditUsed / creditLimit) * 100;
  const remaining = creditLimit - creditUsed;

  const getStatusColor = () => {
    if (percentage >= 90) return "bg-rose-600";
    if (percentage >= 70) return "bg-amber-600";
    return "bg-emerald-600";
  };

  return (
    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">مركز ذكاء ودق</h3>
            <p className="text-slate-400 text-xs">تحليل استهلاك المحاسب الآلي</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded-full">
          <TrendingUp className="w-4 h-4" />
          <span>مستقر</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-slate-400 text-sm">الرصيد المستخدم</p>
            <p className="text-2xl font-mono font-bold text-white">
              {creditUsed} <span className="text-sm text-slate-500 font-normal">/ {creditLimit}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm italic">المتبقي: {remaining}</p>
          </div>
        </div>

        {/* شريط التقدم المخصص - لا يحتاج لمكتبة خارجية */}
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-[2px]">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${getStatusColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-400" />
          <p className="text-blue-200 text-xs">
            نظام "ودق" يعمل بكفاءة عالية. تم تحليل آخر 50 عملية محاسبية تلقائياً.
          </p>
        </div>
      </div>
    </div>
  );
}