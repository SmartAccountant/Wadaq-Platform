import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const statusMap = {
  draft: { label: "مسودة", color: "bg-slate-100 text-slate-700" },
  sent: { label: "مرسلة", color: "bg-blue-100 text-blue-700" },
  paid: { label: "مدفوعة", color: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "متأخرة", color: "bg-rose-100 text-rose-700" },
  cancelled: { label: "ملغية", color: "bg-slate-100 text-slate-500" },
};

export default function RecentInvoices({ invoices = [] }) {
  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-lg font-semibold text-slate-800">آخر الفواتير</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            لا توجد فواتير بعد
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {invoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{invoice.customer_name}</p>
                    <p className="text-sm text-slate-500">
                      {invoice.invoice_number} • {invoice.date && format(new Date(invoice.date), "d MMM yyyy", { locale: ar })}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">{invoice.total?.toLocaleString()} ر.س</p>
                    <Badge className={`${statusMap[invoice.status]?.color} border-0 font-normal`}>
                      {statusMap[invoice.status]?.label}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}