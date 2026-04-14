import React from "react";
import { Wadaq } from "@/api/WadaqCore";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

function computeTopProducts(invoices) {
  const productSales = {};
  invoices.forEach((invoice) => {
    if (invoice.status === "paid" && invoice.items) {
      invoice.items.forEach((item) => {
        if (item.product_id) {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = {
              id: item.product_id,
              name: item.product_name,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[item.product_id].quantity += item.quantity || 0;
          productSales[item.product_id].revenue += item.total || 0;
        }
      });
    }
  });
  return Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

export default function TopSellingProducts({ invoices: invoicesProp, compact }) {
  const { language } = useLanguage();
  const useExternal = Array.isArray(invoicesProp);

  const { data: fetchedInvoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => Wadaq.entities.Invoice.list(),
    enabled: !useExternal,
  });

  const invoices = useExternal ? invoicesProp : fetchedInvoices;

  const topProducts = React.useMemo(() => computeTopProducts(invoices), [invoices]);

  const emptyMsg = (
    <div className="text-center py-8 text-slate-400">
      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>{language === "ar" ? "لا توجد مبيعات في هذه الفترة" : "No sales in this period"}</p>
    </div>
  );

  if (topProducts.length === 0) {
    if (compact) return <div className="p-4 text-sm">{emptyMsg}</div>;
    return (
      <Card className="shadow-xl border border-gray-100">
        <CardHeader className="border-b border-gray-100 px-7 py-5">
          <CardTitle className="flex items-center gap-2 text-gray-900 text-xl font-medium">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            {language === "ar" ? "المنتجات الأكثر مبيعاً" : "Top Selling Products"}
          </CardTitle>
        </CardHeader>
        <CardContent>{emptyMsg}</CardContent>
      </Card>
    );
  }

  const colors = [
    { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    { bg: "bg-violet-500", light: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
    { bg: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    { bg: "bg-rose-500", light: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  ];

  const list = (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {topProducts.map((product, index) => {
        const color = colors[index % colors.length];
        const maxRevenue = topProducts[0]?.revenue || 1;
        const percentage = Math.round((product.revenue / maxRevenue) * 100);
        return (
          <div
            key={product.id}
            className={`flex items-center justify-between ${compact ? "p-3" : "p-4"} rounded-xl border ${color.light} ${color.border} hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${color.bg} text-white font-bold text-xs shadow-sm flex-shrink-0`}
              >
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className={`font-semibold text-gray-800 truncate ${compact ? "text-sm" : ""}`}>{product.name}</p>
                {!compact && (
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-500">
                      {language === "ar" ? "الكمية" : "Sold"}:{" "}
                      <span className="font-medium text-gray-700">{product.quantity}</span>
                    </p>
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${color.bg} rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={language === "ar" ? "text-right flex-shrink-0" : "text-left flex-shrink-0"}>
              <p className={`font-bold ${compact ? "text-sm" : "text-lg"} ${color.text}`}>{product.revenue.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{language === "ar" ? "ر.س" : "SAR"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (compact) return list;

  return (
    <Card className="shadow-xl border border-gray-100">
      <CardHeader className="border-b border-gray-100 px-7 py-5">
        <CardTitle className="flex items-center gap-2 text-gray-900 text-xl font-medium">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          {language === "ar" ? "المنتجات الأكثر مبيعاً" : "Top Selling Products"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">{list}</CardContent>
    </Card>
  );
}
