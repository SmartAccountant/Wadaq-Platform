import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Real screenshots from the app
const SCREENS = [
  {
    id: "dashboard",
    label: "لوحة التحكم",
    emoji: "📊",
    description: "نظرة شاملة على أداء عملك",
    // We'll use a CSS recreation since we have the actual screenshots
    screenshot: "dashboard"
  },
  {
    id: "invoices",
    label: "الفواتير",
    emoji: "🧾",
    description: "إدارة الفواتير والمبيعات",
    screenshot: "invoices"
  },
  {
    id: "reports",
    label: "التقارير المتقدمة",
    emoji: "📈",
    description: "تحليل مفصل لأداء الأعمال",
    screenshot: "reports"
  },
];

// Faithful recreations of the real app screens
function DashboardMockup() {
  return (
    <div dir="rtl" className="w-full h-full text-white overflow-hidden" style={{
      background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0d0d2b 100%)",
      fontFamily: "'Tajawal', sans-serif"
    }}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/5">
        <div className="text-right">
          <h1 className="text-lg font-black text-white">لوحة التحكم</h1>
          <p className="text-xs text-slate-400">نظرة عامة على أعمالك</p>
        </div>
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-xs font-bold">W</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {[
          { label: "صافي الربح", value: "674,870", sub: "ريال", badge: "إجمالي", color: "#7c3aed", icon: "📈" },
          { label: "المبيعات الشهرية", value: "216,430", sub: "ريال", badge: "مارس 2026", color: "#0891b2", icon: "💰" },
          { label: "الضرائب", value: "28,230", sub: "ريال", badge: "VAT 15%", color: "#dc2626", icon: "📋" },
          { label: "إجمالي المبيعات", value: "786,197", sub: "ريال", badge: "28 فاتورة", color: "#7c3aed", icon: "🛒" },
          { label: "إجمالي المصروفات", value: "8,500", sub: "ريال", badge: "2 قيد", color: "#059669", icon: "💳" },
          { label: "فواتير معلقة", value: "244,658", sub: "ريال", badge: "50 فاتورة", color: "#d97706", icon: "⏳" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl p-2.5 relative overflow-hidden"
            style={{ background: `${stat.color}22`, border: `1px solid ${stat.color}44` }}
          >
            <div className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded-full text-white/70"
              style={{ background: `${stat.color}44` }}>
              {stat.badge}
            </div>
            <div className="mt-4 text-right">
              <div className="text-base font-black text-white leading-tight">{stat.value}</div>
              <div className="text-[9px] text-slate-400">{stat.sub}</div>
              <div className="text-[9px] text-slate-300 mt-0.5">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mx-3 rounded-xl p-3"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="text-right mb-2 text-xs font-bold text-white">اتجاه المبيعات - آخر 7 أيام</div>
        <div className="flex items-end gap-1 h-16">
          {[20, 45, 30, 70, 40, 85, 60].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.5 + i * 0.06, duration: 0.5, ease: "easeOut" }}
              className="flex-1 rounded-t-sm"
              style={{ background: i === 5 ? "linear-gradient(180deg,#7c3aed,#a855f7)" : "rgba(124,58,237,0.3)" }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function InvoicesMockup() {
  const invoices = [
    { num: "INV-1773506663794", name: "عميل نقدي", date: "14 مارس 2026", amount: "36,455", status: "مدفوعة", sc: "#10b981" },
    { num: "INV-1773057439161", name: "ahmad", date: "11 مارس 2026", amount: "575", status: "مرسلة", sc: "#3b82f6" },
    { num: "INV-1773057439160", name: "عميل", date: "9 مارس 2026", amount: "575", status: "مدفوعة", sc: "#10b981" },
    { num: "INV-1772813936780", name: "ahmad", date: "9 مارس 2026", amount: "34,500", status: "مرسلة", sc: "#3b82f6" },
    { num: "INV-1772813936779", name: "ahmad", date: "9 مارس 2026", amount: "34,500", status: "مرسلة", sc: "#3b82f6" },
  ];

  return (
    <div dir="rtl" className="w-full h-full overflow-hidden" style={{
      background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0d0d2b 100%)",
      fontFamily: "'Tajawal', sans-serif"
    }}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/5">
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
          <span>+</span> فاتورة جديدة
        </button>
        <div className="text-right">
          <h1 className="text-lg font-black text-white">الفواتير</h1>
          <p className="text-xs text-slate-400">إدارة الفواتير والمبيعات</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span>🔍</span>
          <span>بحث برقم الفاتورة أو اسم العميل...</span>
        </div>
      </div>

      {/* Invoices List */}
      <div className="overflow-y-auto px-3 space-y-1.5" style={{ maxHeight: "260px" }}>
        {invoices.map((inv, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="text-right flex-1 min-w-0">
              <div className="text-white font-bold text-xs truncate">{inv.name}</div>
              <div className="text-slate-500 text-[10px]">{inv.num}</div>
              <div className="text-slate-500 text-[10px]">{inv.date}</div>
            </div>
            <div className="text-left flex flex-col items-end gap-1 mr-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${inv.sc}20`, color: inv.sc }}>
                {inv.status}
              </span>
              <span className="text-white font-black text-sm">{inv.amount}</span>
              <span className="text-slate-500 text-[9px]">ر.س</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ReportsMockup() {
  return (
    <div dir="rtl" className="w-full h-full overflow-hidden" style={{
      background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0d0d2b 100%)",
      fontFamily: "'Tajawal', sans-serif"
    }}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-white/5 text-right">
        <h1 className="text-lg font-black text-white">التقارير المتقدمة</h1>
        <p className="text-xs text-slate-400">تحليل مفصل لأداء الأعمال مع فلاتر متقدمة</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-3 pt-2">
        {["نظرة عامة", "تقرير الفواتير"].map((tab, i) => (
          <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${i === 0 ? "text-white" : "text-slate-500"}`}
            style={i === 0 ? { background: "rgba(124,58,237,0.3)", border: "1px solid rgba(124,58,237,0.5)" } : {}}>
            {tab}
          </div>
        ))}
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="mx-3 mt-2 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-right text-xs font-bold text-white mb-2">فلاتر مخصصة</div>
        <div className="grid grid-cols-2 gap-2">
          {["الفترة الزمنية", "العميل", "المنتج", "تصنيف المصروفات"].map((f, i) => (
            <div key={i} className="rounded-lg px-2 py-1.5 flex justify-between items-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-slate-400 text-[9px]">▼</span>
              <span className="text-slate-300 text-[9px]">{f}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mx-3 mt-2">
        {[
          { label: "إجمالي المبيعات", value: "216,430", color: "#7c3aed", icon: "📈" },
          { label: "إجمالي المصروفات", value: "0", color: "#ef4444", icon: "📉" },
          { label: "صافي الربح", value: "216,430", color: "#10b981", icon: "💰" },
          { label: "المستحقات", value: "222,783", color: "#f59e0b", icon: "💳" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
            className="rounded-xl p-2.5" style={{ background: `${s.color}15`, border: `1px solid ${s.color}35` }}>
            <div className="flex justify-between items-center">
              <span className="text-base">{s.icon}</span>
              <span className="text-right text-white font-black text-sm">{s.value}</span>
            </div>
            <div className="text-right text-[9px] text-slate-400 mt-0.5">ر.س — {s.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const SCREEN_COMPONENTS = {
  dashboard: DashboardMockup,
  invoices: InvoicesMockup,
  reports: ReportsMockup,
};

export default function AppDemoAnimation() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [key, setKey] = useState(0);
  const [progress, setProgress] = useState(0);

  const DURATION = 7000;

  useEffect(() => {
    setProgress(0);
    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / DURATION) * 100, 100));
    }, 50);

    const switchTimer = setTimeout(() => {
      const next = (activeIdx + 1) % SCREENS.length;
      setActiveIdx(next);
      setKey(k => k + 1);
    }, DURATION);

    return () => { clearInterval(progressTimer); clearTimeout(switchTimer); };
  }, [activeIdx]);

  const handleTab = (i) => { setActiveIdx(i); setKey(k => k + 1); };

  const ActiveComponent = SCREEN_COMPONENTS[SCREENS[activeIdx].id];
  const current = SCREENS[activeIdx];

  return (
    <section className="py-20 px-4 relative overflow-hidden" style={{
      background: "linear-gradient(135deg, #1e1b4b 0%, #2d1b69 40%, #1e1b4b 100%)"
    }}>
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-20"
          style={{ background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)" }} />
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full filter blur-3xl opacity-10"
          style={{ background: "#a855f7" }} />
        <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full filter blur-3xl opacity-10"
          style={{ background: "#6d28d9" }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#a855f7" }}>شاهد ودق من الداخل</h2>
          <p className="max-w-xl mx-auto text-sm" style={{ color: "#c4b5fd" }}>واجهة احترافية مصممة للسوق السعودي — جربها الآن</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
          {/* Screen tabs - left */}
          <div className="flex lg:flex-col gap-3 lg:w-48 flex-shrink-0">
            {SCREENS.map((screen, i) => (
              <motion.button
                key={screen.id}
                onClick={() => handleTab(i)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex lg:flex-row items-center gap-2 px-3 py-2.5 rounded-xl text-right transition-all duration-300 w-full ${
                  activeIdx === i ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
                style={activeIdx === i
                  ? { background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.45)" }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }
                }
              >
                <span className="text-lg flex-shrink-0">{screen.emoji}</span>
                <div className="text-right hidden lg:block">
                  <div className={`text-xs font-bold ${activeIdx === i ? "text-white" : "text-slate-400"}`}>{screen.label}</div>
                  <div className="text-[9px] text-slate-500">{screen.description}</div>
                </div>
                {/* Progress bar for active */}
                {activeIdx === i && (
                  <div className="hidden lg:block absolute bottom-0 left-0 h-0.5 rounded-full bg-purple-400 transition-all"
                    style={{ width: `${progress}%` }} />
                )}
              </motion.button>
            ))}
          </div>

          {/* Laptop Mockup */}
          <div className="flex-1 w-full max-w-2xl mx-auto">
            {/* Laptop top (screen) */}
            <div className="relative">
              {/* Screen bezel */}
              <div className="rounded-2xl p-2 shadow-2xl"
                style={{
                  background: "linear-gradient(180deg, #1e1e2e, #0d0d1a)",
                  border: "2px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)"
                }}>
                {/* Camera dot */}
                <div className="flex justify-center mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>

                {/* Screen content */}
                <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", background: "#08080f" }}>
                  {/* Browser bar */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5" style={{ background: "rgba(0,0,0,0.6)" }}>
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 mx-2 py-1 px-2 rounded-md text-[10px] text-slate-500 flex items-center gap-1.5"
                      style={{ background: "rgba(255,255,255,0.05)" }}>
                      <span className="text-emerald-600">🔒</span>
                      <span>app.wadq.sa</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] text-slate-600 hidden sm:block">مباشر</span>
                    </div>
                  </div>

                  {/* App sidebar + content */}
                  <div className="flex h-full">
                    {/* Mini sidebar */}
                    <div className="w-24 sm:w-28 border-l border-white/5 py-3 px-2 flex flex-col gap-1 flex-shrink-0"
                      style={{ background: "rgba(0,0,0,0.4)" }}>
                      <div className="text-center mb-2">
                        <div className="text-white font-black text-xs">ودق</div>
                      </div>
                      {[
                        { label: "الرئيسية", page: "dashboard" },
                        { label: "الفواتير", page: "invoices" },
                        { label: "التقارير", page: "reports" },
                        { label: "العملاء", page: "" },
                        { label: "المنتجات", page: "" },
                        { label: "المصروفات", page: "" },
                      ].map((item, i) => (
                        <div key={i} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] cursor-pointer transition-all ${
                          item.page === current.id ? "text-white" : "text-slate-500"
                        }`}
                          style={item.page === current.id
                            ? { background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.4)" }
                            : {}
                          }
                          onClick={() => {
                            const idx = SCREENS.findIndex(s => s.id === item.page);
                            if (idx !== -1) handleTab(idx);
                          }}
                        >
                          <div className="w-1 h-1 rounded-full flex-shrink-0"
                            style={{ background: item.page === current.id ? "#a855f7" : "#334155" }} />
                          {item.label}
                        </div>
                      ))}
                    </div>

                    {/* Main screen */}
                    <div className="flex-1 overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 15 }}
                          transition={{ duration: 0.3 }}
                          className="w-full h-full"
                        >
                          <ActiveComponent />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Laptop base */}
            <div className="relative flex justify-center -mt-0.5">
              <div className="w-4/5 h-3 rounded-b-xl"
                style={{
                  background: "linear-gradient(180deg, #1e1e2e, #16162a)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderTop: "none"
                }} />
            </div>
            <div className="flex justify-center">
              <div className="w-3/4 h-1.5 rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-5">
              {SCREENS.map((_, i) => (
                <button key={i} onClick={() => handleTab(i)} className="relative overflow-hidden rounded-full transition-all duration-300"
                  style={{ width: activeIdx === i ? "28px" : "8px", height: "8px", background: activeIdx === i ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.15)" }}>
                  {activeIdx === i && (
                    <motion.div className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: "#a855f7", width: `${progress}%` }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}