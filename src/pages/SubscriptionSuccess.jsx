import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import confetti from "canvas-confetti";

export default function SubscriptionSuccess() {
  useEffect(() => {
    // Fire confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50/10 to-white/5">
        <CardContent className="text-center py-12 px-6">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/50 animate-pulse">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          
          <div className="mb-6">
            <Sparkles className="w-8 h-8 text-yellow-400 mx-auto animate-bounce" />
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            مبروك! 🎉
          </h1>
          
          <p className="text-xl text-slate-800 mb-3 font-semibold">
            تم تفعيل اشتراكك بنجاح
          </p>
          
          <p className="text-slate-600 mb-8">
            يمكنك الآن الاستمتاع بجميع مزايا نظام ودق بدون قيود
          </p>

          <div className="space-y-3">
            <Link to={createPageUrl("Dashboard")}>
              <Button 
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-lg py-6 shadow-lg"
              >
                ابدأ العمل الآن
              </Button>
            </Link>
            
            <Link to={createPageUrl("Settings")}>
              <Button 
                variant="outline"
                className="w-full border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                الذهاب إلى الإعدادات
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}