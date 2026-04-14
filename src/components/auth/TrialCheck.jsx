import React, { useEffect, useState } from "react";
import { Wadaq } from "@/api/WadaqCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function TrialCheck({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkTrialStatus();
  }, []);

  const checkTrialStatus = async () => {
    try {
      const currentUser = await Wadaq.auth.me();
      
      // Admin users bypass all trial checks
      if (currentUser.role === "admin") {
        setUser(currentUser);
        setLoading(false);
        return;
      }
      
      // إذا لم يكن لديه trial_end_date، نضيف 7 أيام من الآن
      if (!currentUser.trial_end_date) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 10);
        
        await Wadaq.auth.updateMe({
          trial_end_date: trialEnd.toISOString(),
          subscription_status: "trial",
          is_new_user: true,
          ai_daily_limit: 10,
          ai_daily_uses: 0
        });
        
        currentUser.trial_end_date = trialEnd.toISOString();
        currentUser.subscription_status = "trial";
        currentUser.is_new_user = true;
        
        // إرسال إيميل ترحيبي
        try {
          await Wadaq.functions.invoke('sendWelcomeEmail', {});
        } catch (error) {
          console.error("Error sending welcome email:", error);
        }
      }
      
      // توجيه المستخدمين الجدد إلى صفحة الترحيب
      if (currentUser.is_new_user && !currentUser.onboarding_completed) {
        setUser(currentUser);
        setLoading(false);
        navigate(createPageUrl("Welcome"));
        return;
      }

      const daysLeft = differenceInDays(parseISO(currentUser.trial_end_date), new Date());
      setTrialDaysLeft(daysLeft);
      
      // تحديث حالة الاشتراك إذا انتهت التجربة
      if (daysLeft < 0 && (currentUser.subscription_status === "trial" || !currentUser.subscription_status)) {
        await Wadaq.auth.updateMe({ subscription_status: "expired" });
        currentUser.subscription_status = "expired";
      }
      
      // التحقق من صلاحية الاشتراك — فقط إذا كان هناك تاريخ انتهاء محدد (غير unlimited)
      if (currentUser.subscription_end_date && currentUser.subscription_status !== "unlimited") {
        const subDaysLeft = differenceInDays(parseISO(currentUser.subscription_end_date), new Date());
        if (subDaysLeft < 0) {
          await Wadaq.auth.updateMe({ subscription_status: "expired" });
          currentUser.subscription_status = "expired";
        }
      }

      setUser(currentUser);
    } catch (error) {
      console.error("Error checking trial:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // السماح بالدخول للجميع - حتى المنتهي اشتراكهم

  // عرض تنبيه التجربة إذا كانت أقل من 3 أيام (لكن ليس للـ Admin)
  return (
    <>
      {user?.subscription_status === "trial" && user?.role !== "admin" && trialDaysLeft !== null && trialDaysLeft <= 3 && trialDaysLeft >= 0 && (
        <div className="bg-amber-50 border-b-2 border-amber-200 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <p className="text-amber-800 font-medium">
                باقي {trialDaysLeft} {trialDaysLeft === 1 ? "يوم" : "أيام"} على انتهاء الفترة التجريبية
              </p>
            </div>
            <Link to={createPageUrl("Subscription")}>
              <Button 
                size="sm" 
                className="bg-amber-600 hover:bg-amber-700"
              >
                اشترك الآن
              </Button>
            </Link>
          </div>
        </div>
      )}
      {children}
    </>
  );
}