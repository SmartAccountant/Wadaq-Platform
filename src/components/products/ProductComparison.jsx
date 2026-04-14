import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, Minus, Star } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function ProductComparison({ products, reviews, onClose, onRemove }) {
  const { language } = useLanguage();

  const getProductReviews = (productId) => {
    return reviews?.filter(r => r.product_id === productId) || [];
  };

  const getAverageRating = (productId) => {
    const productReviews = getProductReviews(productId);
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / productReviews.length).toFixed(1);
  };

  if (products.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">
              {language === 'ar' ? 'لا توجد منتجات للمقارنة' : 'No products to compare'}
            </p>
            <Button onClick={onClose} className="mt-4">
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const attributes = [
    { key: 'selling_price', label: language === 'ar' ? 'السعر' : 'Price', format: (v) => `${v?.toLocaleString() || 0} ${language === 'ar' ? 'ر.س' : 'SAR'}` },
    { key: 'cost_price', label: language === 'ar' ? 'سعر التكلفة' : 'Cost Price', format: (v) => v ? `${v.toLocaleString()} ${language === 'ar' ? 'ر.س' : 'SAR'}` : '-' },
    { key: 'category', label: language === 'ar' ? 'التصنيف' : 'Category' },
    { key: 'brand', label: language === 'ar' ? 'العلامة التجارية' : 'Brand' },
    { key: 'quantity', label: language === 'ar' ? 'المخزون' : 'Stock' },
    { key: 'unit', label: language === 'ar' ? 'الوحدة' : 'Unit' },
    { key: 'has_variants', label: language === 'ar' ? 'المتغيرات' : 'Variants', format: (v) => v ? <Check className="w-4 h-4 text-emerald-600" /> : <Minus className="w-4 h-4 text-slate-400" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto">
        <CardHeader className="border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <CardTitle>{language === 'ar' ? 'مقارنة المنتجات' : 'Product Comparison'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th className="p-4 text-right font-semibold text-slate-700 w-48">
                    {language === 'ar' ? 'الخاصية' : 'Attribute'}
                  </th>
                  {products.map((product) => (
                    <th key={product.id} className="p-4 text-center w-64 relative">
                      <div className="space-y-2">
                        {product.images?.[0] && (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-24 h-24 object-cover rounded-lg mx-auto"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">
                            {language === 'ar' ? product.name : (product.name_en || product.name)}
                          </p>
                          <p className="text-xs text-slate-500">{product.code}</p>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">{getAverageRating(product.id)}</span>
                          <span className="text-xs text-slate-500">
                            ({getProductReviews(product.id).length})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(product.id)}
                          className="text-rose-600 hover:text-rose-700"
                        >
                          <X className="w-4 h-4 ml-1" />
                          {language === 'ar' ? 'إزالة' : 'Remove'}
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attributes.map((attr) => (
                  <tr key={attr.key} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-700">
                      {attr.label}
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {attr.format 
                          ? attr.format(product[attr.key])
                          : (product[attr.key] || '-')}
                      </td>
                    ))}
                  </tr>
                ))}
                
                <tr className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-700">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4 text-center">
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active 
                          ? (language === 'ar' ? 'نشط' : 'Active')
                          : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </Badge>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}