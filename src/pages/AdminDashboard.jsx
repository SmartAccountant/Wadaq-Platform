import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Terminal, Search } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function AdminDashboard() {
  const { language } = useLanguage(); 
  const [command, setCommand] = useState("");

  // جلب البيانات بدون شروط Admin ليظهر لك كل شيء الآن
  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => Wadaq.entities.User.list("-created_date"),
  });

  const handleAIAction = async (prompt) => {
    try {
      // محاولة الاتصال بالذكاء الاصطناعي
      const res = await Wadaq.api.InvokeLLM(prompt);
      alert(res.text || "Success");
    } catch (error) {
      alert(language === 'ar' ? "خطأ: تأكد من ربط API الذكاء الاصطناعي" : "Error: Check AI API link");
    }
  };

  return (
    <div className="p-6 space-y-6" dir={language === 'ar' ? "rtl" : "ltr"}>
      
      {/* قسم الذكاء الاصطناعي - سيظهر إجباري الآن */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl border-2 border-blue-500">
        <div className="flex items-center gap-4 mb-6">
          <Bot className="w-10 h-10 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold">
              {language === 'ar' ? "مساعد ودق الذكي" : "Wadaq AI Assistant"}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={() => handleAIAction("تقرير الأداء")} className="bg-blue-600 hover:bg-blue-700 h-14">
            {language === 'ar' ? "📊 طلب تقرير الأداء" : "📊 Request Performance Report"}
          </Button>
          <Button onClick={() => handleAIAction("تحليل الربحية")} className="bg-slate-700 hover:bg-slate-600 h-14">
            {language === 'ar' ? "💰 تحليل الربحية" : "💰 Profit Analysis"}
          </Button>
        </div>
      </div>

      {/* منصة الأوامر */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            {language === 'ar' ? "منصة الأوامر" : "Command Terminal"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input 
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={language === 'ar' ? "اكتب هنا..." : "Type here..."}
            className="text-right"
          />
          <Button onClick={() => handleAIAction(command)}>
             {language === 'ar' ? "إرسال" : "Send"}
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}