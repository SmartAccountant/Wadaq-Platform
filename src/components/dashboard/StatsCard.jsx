import React from "react";

export default function StatsCard({ title, value, icon: Icon, trend, trendValue }) {
  return (
    <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(99, 102, 241, 0.85)', backdropFilter: 'blur(10px)' }}>
      <div>
        <p className="text-xs text-white/70 mb-1">{title}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-1 text-xs font-medium text-white/80">
            <span>{trend === "up" ? "↑" : "↓"}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      {Icon && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}