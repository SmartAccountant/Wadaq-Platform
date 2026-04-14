import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, TrendingDown, AlertCircle, Download, Calendar } from "lucide-react";
import { Wadaq } from "@/api/WadaqCore";
import { useLanguage } from "@/components/LanguageContext";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function InventoryMovementReport() {
  const { language } = useLanguage();
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['inventoryMovement', startDate, endDate],
    queryFn: async () => {
      const [movements, products] = await Promise.all([
        Wadaq.entities.StockMovement.filter({
          date: { $gte: startDate, $lte: endDate }
        }),
        Wadaq.entities.Product.list()
      ]);

      // Group movements by product
      const productMovements = {};
      movements.forEach(movement => {
        if (!productMovements[movement.product_id]) {
          productMovements[movement.product_id] = {
            product_id: movement.product_id,
            product_name: movement.product_name,
            movements: [],
            total_in: 0,
            total_out: 0,
            net_change: 0
          };
        }
        
        productMovements[movement.product_id].movements.push(movement);
        
        if (movement.type === 'in') {
          productMovements[movement.product_id].total_in += Math.abs(movement.quantity);
        } else if (movement.type === 'out') {
          productMovements[movement.product_id].total_out += Math.abs(movement.quantity);
        }
        
        productMovements[movement.product_id].net_change += movement.quantity;
      });

      // Add current stock levels
      Object.keys(productMovements).forEach(productId => {
        const product = products.find(p => p.id === productId);
        if (product) {
          productMovements[productId].current_stock = product.quantity;
          productMovements[productId].min_stock = product.min_stock_level || 5;
        }
      });

      // Calculate summary
      const totalIn = movements.filter(m => m.type === 'in').reduce((sum, m) => sum + Math.abs(m.quantity), 0);
      const totalOut = movements.filter(m => m.type === 'out').reduce((sum, m) => sum + Math.abs(m.quantity), 0);
      const totalAdjustments = movements.filter(m => m.type === 'adjustment').length;

      return {
        movements: Object.values(productMovements),
        totalIn,
        totalOut,
        totalAdjustments,
        movementCount: movements.length
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'تقرير حركة المخزون' : 'Inventory Movement Report'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-t-4 border-t-blue-600">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {language === 'ar' ? 'تقرير حركة المخزون' : 'Inventory Movement Report'}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'ar' ? 'تتبع حركات الدخول والخروج' : 'Track inbound and outbound movements'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'من تاريخ' : 'From Date'}</Label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'إلى تاريخ' : 'To Date'}</Label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-slate-600">{language === 'ar' ? 'إجمالي الدخول' : 'Total In'}</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{reportData?.totalIn || 0}</p>
          </div>
          
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              <span className="text-sm text-slate-600">{language === 'ar' ? 'إجمالي الخروج' : 'Total Out'}</span>
            </div>
            <p className="text-2xl font-bold text-rose-700">{reportData?.totalOut || 0}</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-600">{language === 'ar' ? 'عدد الحركات' : 'Movements'}</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{reportData?.movementCount || 0}</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-slate-800">
            {language === 'ar' ? 'حركة المنتجات' : 'Product Movements'}
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-right p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'المنتج' : 'Product'}
                  </th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'دخول' : 'In'}
                  </th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'خروج' : 'Out'}
                  </th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'صافي التغير' : 'Net Change'}
                  </th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'المخزون الحالي' : 'Current Stock'}
                  </th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-600">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.movements.map((item) => (
                  <tr key={item.product_id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-slate-800">{item.product_name}</p>
                        <p className="text-xs text-slate-500">{item.movements.length} {language === 'ar' ? 'حركة' : 'movements'}</p>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className="bg-emerald-100 text-emerald-700">
                        +{item.total_in}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className="bg-rose-100 text-rose-700">
                        -{item.total_out}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-semibold ${
                        item.net_change > 0 ? 'text-emerald-600' : 
                        item.net_change < 0 ? 'text-rose-600' : 'text-slate-600'
                      }`}>
                        {item.net_change > 0 ? '+' : ''}{item.net_change}
                      </span>
                    </td>
                    <td className="p-3 text-center font-medium">
                      {item.current_stock || 0}
                    </td>
                    <td className="p-3 text-center">
                      {(item.current_stock || 0) <= (item.min_stock || 5) ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit mx-auto">
                          <AlertCircle className="w-3 h-3" />
                          {language === 'ar' ? 'منخفض' : 'Low'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                          {language === 'ar' ? 'جيد' : 'Good'}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}