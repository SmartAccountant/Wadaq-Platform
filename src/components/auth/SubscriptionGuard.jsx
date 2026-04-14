import React, { useState, useEffect } from "react";
import { Wadaq } from "@/api/WadaqCore";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useLanguage } from "@/components/LanguageContext";

export default function SubscriptionGuard({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await Wadaq.auth.me();

        if (currentUser.subscription_status === "trial" && currentUser.trial_end_date) {
          const daysLeft = Math.floor((new Date(currentUser.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) {
            await Wadaq.auth.updateMe({ subscription_status: "expired" });
            currentUser.subscription_status = "expired";
          }
        }
        if (currentUser.subscription_status !== "unlimited" && currentUser.subscription_end_date) {
          const daysLeft = Math.floor((new Date(currentUser.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) {
            await Wadaq.auth.updateMe({ subscription_status: "expired" });
            currentUser.subscription_status = "expired";
          }
        }

        setUser(currentUser);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
      </div>
    );
  }

  if (user?.role === 'admin') return <>{children}</>;

  const hasAccess = user?.subscription_status && user.subscription_status !== 'expired';

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-slate-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              {language === 'ar' ? 'هذه الميزة تتطلب اشتراكاً' : 'Subscription Required'}
            </h2>
            <p className="text-slate-500 text-sm">
              {language === 'ar'
                ? 'قم بالاشتراك للوصول إلى هذه الأداة'
                : 'Subscribe to access this tool'}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to={createPageUrl("Subscription")}>
              <Button className="w-full bg-slate-900 hover:bg-slate-700 text-white">
                {language === 'ar' ? 'عرض الباقات' : 'View Plans'}
              </Button>
            </Link>
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" className="w-full">
                {language === 'ar' ? 'رجوع للرئيسية' : 'Back to Dashboard'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}