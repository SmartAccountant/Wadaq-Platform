import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function BulkUpdateModal({ selectedProducts, onUpdate, onClose }) {
  const { language } = useLanguage();
  const [updateType, setUpdateType] = useState("price");
  const [priceValue, setPriceValue] = useState("");
  const [priceType, setPriceType] = useState("increase"); // increase, decrease, set
  const [categoryValue, setCategoryValue] = useState("");
  const [isActive, setIsActive] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const updates = {};
      
      if (updateType === "price" && priceValue) {
        const value = parseFloat(priceValue);
        if (priceType === "set") {
          updates.selling_price = value;
        } else {
          // Will be calculated per product
          updates.price_adjustment = { type: priceType, value };
        }
      } else if (updateType === "category" && categoryValue) {
        updates.category = categoryValue;
      } else if (updateType === "status" && isActive !== "") {
        updates.is_active = isActive === "true";
      }
      
      await onUpdate(updates);
    } catch (error) {
      console.error('Bulk update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle>
            {language === 'ar' ? 'تحديث جماعي' : 'Bulk Update'}
            <span className="text-sm text-slate-500 font-normal mr-2">
              ({selectedProducts.length} {language === 'ar' ? 'منتج' : 'products'})
            </span>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'نوع التحديث' : 'Update Type'}</Label>
            <Select value={updateType} onValueChange={setUpdateType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">{language === 'ar' ? 'السعر' : 'Price'}</SelectItem>
                <SelectItem value="category">{language === 'ar' ? 'التصنيف' : 'Category'}</SelectItem>
                <SelectItem value="status">{language === 'ar' ? 'الحالة' : 'Status'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {updateType === "price" && (
            <>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'نوع التعديل' : 'Adjustment Type'}</Label>
                <Select value={priceType} onValueChange={setPriceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">{language === 'ar' ? 'زيادة' : 'Increase'}</SelectItem>
                    <SelectItem value="decrease">{language === 'ar' ? 'تخفيض' : 'Decrease'}</SelectItem>
                    <SelectItem value="set">{language === 'ar' ? 'تحديد' : 'Set'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>
                  {priceType === "set" 
                    ? (language === 'ar' ? 'السعر الجديد' : 'New Price')
                    : (language === 'ar' ? 'القيمة' : 'Value')}
                </Label>
                <Input
                  type="number"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder={priceType === "set" ? "500" : "50"}
                />
                {priceType !== "set" && (
                  <p className="text-xs text-slate-500">
                    {language === 'ar' 
                      ? `سيتم ${priceType === 'increase' ? 'زيادة' : 'تخفيض'} السعر بمقدار ${priceValue || '0'} ر.س`
                      : `Will ${priceType} price by ${priceValue || '0'} SAR`}
                  </p>
                )}
              </div>
            </>
          )}

          {updateType === "category" && (
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'التصنيف الجديد' : 'New Category'}</Label>
              <Input
                value={categoryValue}
                onChange={(e) => setCategoryValue(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل التصنيف' : 'Enter category'}
              />
            </div>
          )}

          {updateType === "status" && (
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الحالة' : 'Status'}</Label>
              <Select value={isActive} onValueChange={setIsActive}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر الحالة' : 'Select status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="false">{language === 'ar' ? 'غير نشط' : 'Inactive'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={updating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  {language === 'ar' ? 'تحديث' : 'Update'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}