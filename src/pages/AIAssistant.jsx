import React, { useState } from 'react';
import { Wadaq } from '../api/WadaqClient';

export default function AIAssistant() {
  const [response, setResponse] = useState("");

  const askAI = async (text) => {
    const result = await Wadaq.api.InvokeLLM(text);
    setResponse(result.text);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen rtl text-right" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl text-white shadow-xl">
          <h1 className="text-2xl font-bold mb-2">مساعد ودق المحاسبي الذكي 🤖</h1>
          <p className="text-slate-300">متخصص في تحليل الأداء المالي لمؤسسة ثروة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "أعطني تقرير شامل عن أداء عملي",
            "حلل ربحية منتجاتي بالتفصيل",
            "لماذا نفذت بعض المنتجات؟",
            "كيف أحسّن التدفق النقدي؟"
          ].map((quest) => (
            <button 
              key={quest}
              onClick={() => askAI(quest)}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition text-right shadow-sm"
            >
              {quest}
            </button>
          ))}
        </div>

        {response && (
          <div className="p-6 bg-white border-r-8 border-slate-900 rounded-xl shadow-lg animate-in fade-in duration-500">
            <h3 className="font-bold text-slate-900 mb-2">تحليل المساعد الذكي:</h3>
            <p className="text-slate-700 leading-relaxed">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}