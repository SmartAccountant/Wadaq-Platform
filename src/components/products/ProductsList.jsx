import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Package, AlertTriangle, Barcode, Image as ImageIcon, Grid3x3, QrCode } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import BarcodeGenerator from "./BarcodeGenerator";

export default function ProductsList({ products = [], onEdit, onDelete, onManageVariants }) {
  const { language } = useLanguage();
  const [selectedProductBarcode, setSelectedProductBarcode] = React.useState(null);
  
  if (products.length === 0) {
    return (
      <Card className="p-12 text-center bg-white border-0 shadow-sm">
        <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500">{language === 'ar' ? 'لا يوجد منتجات بعد' : 'No products yet'}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => {
        const displayName = language === 'ar' ? product.name : (product.name_en || product.name);
        const displayCategory = language === 'ar' ? product.category : (product.category_en || product.category);
        const displayUnit = language === 'ar' ? product.unit : (product.unit_en || product.unit);
        const mainImage = product.images?.[0];
        
        return (
        <Card key={product.id} className="overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
          {/* Product Image */}
          {mainImage ? (
            <div className="relative h-48 bg-slate-100">
              <img 
                src={mainImage} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
              {product.images.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {product.images.length}
                </div>
              )}
              {product.has_variants && (
                <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Grid3x3 className="w-3 h-3" />
                  {language === 'ar' ? 'متغيرات' : 'Variants'}
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
              <Package className="w-16 h-16 text-white opacity-50" />
            </div>
          )}

          {/* Product Info */}
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-1">{displayName}</h3>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {product.code && (
                    <p className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded">
                      {product.code}
                    </p>
                  )}
                  {product.barcode && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                      <Barcode className="w-3 h-3" />
                      {product.barcode}
                    </div>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(product)}>
                    <Edit className="w-4 h-4 ml-2" />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedProductBarcode(product)}>
                    <QrCode className="w-4 h-4 ml-2" />
                    {language === 'ar' ? 'طباعة الباركود' : 'Print Barcode'}
                  </DropdownMenuItem>
                  {product.has_variants && onManageVariants && (
                    <DropdownMenuItem onClick={() => onManageVariants(product)}>
                      <Grid3x3 className="w-4 h-4 ml-2" />
                      {language === 'ar' ? 'إدارة المتغيرات' : 'Manage Variants'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => onDelete(product)}
                    className="text-rose-600 focus:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {displayCategory && (
                <Badge variant="outline" className="text-xs">
                  {displayCategory}
                </Badge>
              )}
              {product.brand && (
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                  {product.brand}
                </Badge>
              )}
              {!product.is_active && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-xs">
                  {language === 'ar' ? 'غير نشط' : 'Inactive'}
                </Badge>
              )}
            </div>

            {/* Custom Fields Display */}
            {product.custom_fields?.length > 0 && (
              <div className="mb-3 space-y-1">
                {product.custom_fields.slice(0, 2).map((field, idx) => (
                  <div key={idx} className="text-xs text-slate-600">
                    <span className="font-medium">{field.name}:</span> {field.value}
                  </div>
                ))}
              </div>
            )}

            {/* Stock Alert */}
            {!product.has_variants && product.quantity <= (product.min_stock_level || 5) && product.quantity > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg mb-3">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">{language === 'ar' ? 'المخزون منخفض' : 'Low Stock'}</span>
              </div>
            )}
            {!product.has_variants && product.quantity === 0 && (
              <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-2 rounded-lg mb-3">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">{language === 'ar' ? 'نفذ من المخزون' : 'Out of Stock'}</span>
              </div>
            )}

            {/* Pricing */}
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              {!product.has_variants ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{language === 'ar' ? 'سعر التكلفة' : 'Cost'}</span>
                    <span className="text-sm font-medium text-slate-700">
                      {product.cost_price?.toLocaleString() || 0} {language === 'ar' ? 'ر.س' : 'SAR'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{language === 'ar' ? 'سعر البيع' : 'Price'}</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {product.selling_price?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{language === 'ar' ? 'المخزون' : 'Stock'}</span>
                    <span className={`text-lg font-semibold ${
                      product.quantity === 0 
                        ? 'text-rose-600' 
                        : product.quantity <= (product.min_stock_level || 5)
                        ? 'text-amber-600'
                        : 'text-slate-800'
                    }`}>
                      {product.quantity} {displayUnit}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <Badge className="bg-purple-100 text-purple-700">
                    {language === 'ar' ? 'يُدار عبر المتغيرات' : 'Managed via variants'}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </Card>
      )})}
      
      {selectedProductBarcode && (
        <BarcodeGenerator
          product={selectedProductBarcode}
          onClose={() => setSelectedProductBarcode(null)}
        />
      )}
    </div>
  );
}