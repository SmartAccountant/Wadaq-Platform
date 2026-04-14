import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, ExternalLink, FileCode, FolderTree } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function SourceCodeExport() {
  const { language } = useLanguage();

  const handleOpenDashboard = () => {
    window.open('https://Wadaq.app/dashboard', '_blank');
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border-indigo-400/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          {language === 'ar' ? 'تحميل الكود المصدري للمنصة' : 'Export Source Code'}
        </CardTitle>
        <CardDescription className="text-slate-300">
          {language === 'ar' 
            ? 'احصل على نسخة كاملة من ملفات المشروع البرمجية (JSX, CSS, JS, JSON)'
            : 'Get a complete copy of project files (JSX, CSS, JS, JSON)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-indigo-500/10 border border-indigo-400/20 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <FolderTree className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-2">
                {language === 'ar' ? 'ماذا يحتوي الملف:' : 'What\'s included:'}
              </h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• {language === 'ar' ? 'جميع ملفات الواجهات (Pages & Components)' : 'All interface files (Pages & Components)'}</li>
                <li>• {language === 'ar' ? 'ملفات التصميم (CSS & Styling)' : 'Design files (CSS & Styling)'}</li>
                <li>• {language === 'ar' ? 'منطق البرمجة والذكاء الاصطناعي (Functions)' : 'Logic & AI functions'}</li>
                <li>• {language === 'ar' ? 'ملفات الترجمة والبيانات (JSON)' : 'Translation & data files (JSON)'}</li>
                <li>• {language === 'ar' ? 'الهيكل الكامل للمشروع' : 'Complete project structure'}</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={handleOpenDashboard}
          className="w-full h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <FileCode className="w-5 h-5 mr-3" />
          <span className="text-lg font-bold">
            {language === 'ar' ? 'تحميل الكود المصدري (Rikaz-System-Core)' : 'Download Source Code (Rikaz-System-Core)'}
          </span>
          <ExternalLink className="w-4 h-4 mr-2 ml-auto" />
        </Button>

        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <p className="text-xs text-slate-400 mb-2">
            {language === 'ar' ? '📍 الخطوات:' : '📍 Steps:'}
          </p>
          <ol className="text-xs text-slate-300 space-y-1 mr-4">
            <li>1. {language === 'ar' ? 'سيتم فتح لوحة التحكم Wadaq Dashboard' : 'Wadaq Dashboard will open'}</li>
            <li>2. {language === 'ar' ? 'اذهب إلى قسم "Code"' : 'Go to "Code" section'}</li>
            <li>3. {language === 'ar' ? 'اضغط على "Download Files" أو "Export Project"' : 'Click "Download Files" or "Export Project"'}</li>
            <li>4. {language === 'ar' ? 'سيتم تحميل ملف ZIP يحتوي على كافة الملفات' : 'A ZIP file containing all files will download'}</li>
          </ol>
        </div>

        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-400/20 rounded-lg">
          <span className="text-2xl">💡</span>
          <p className="text-xs text-slate-300">
            {language === 'ar' 
              ? 'يمكن لأي مبرمج استخدام هذه الملفات لفهم بنية النظام والتعديل عليه'
              : 'Any developer can use these files to understand the system structure and modify it'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}