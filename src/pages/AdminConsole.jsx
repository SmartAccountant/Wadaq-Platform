import React from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AdminConsole() {
  return (
    <div className="p-8 text-right" dir="rtl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-[#1a3a5c] text-[#c9a227] rounded-2xl">
          <Shield size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم المسؤول</h1>
          <p className="text-slate-600">إذا ظهرت لك هذه الصفحة، فالنظام يعمل بنجاح.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 border rounded-xl bg-white shadow-sm">
          <h2 className="font-bold mb-2">حالة الاتصال</h2>
          <p className="text-green-600">✓ تم تحميل واجهة المسؤول بنجاح</p>
        </div>
      </div>

      <Button asChild className="mt-8">
        <Link to="/dashboard"> <ArrowLeft className="ml-2" /> العودة للرئيسية</Link>
      </Button>
    </div>
  );
}