import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Save, X, Plus, Trash2 } from "lucide-react";
import LocalizedField from "@/components/LocalizedField";
import ImageUpload from "@/components/ImageUpload";
import { useLanguage } from "@/components/LanguageContext";

export default function ProductForm({ product, onSave, onCancel, isLoading }) {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    code: "",
    barcode: "",
    category: "",
    category_en: "",
    brand: "",
    cost_price: "",
    selling_price: "",
    quantity: 0,
    min_stock_level: 5,
    unit: "قطعة",
    unit_en: "",
    description: "",
    description_en: "",
    images: [],
    has_variants: false,
    custom_fields: [],
    is_active: true,
    ...product,
  });

  const [newCustomField, setNewCustomField] = useState({ name: "", value: "" });

  const addCustomField = () => {
    if (newCustomField.name && newCustomField.value) {
      setFormData(prev => ({
        ...prev,
        custom_fields: [...(prev.custom_fields || []), { ...newCustomField }]
      }));
      setNewCustomField({ name: "", value: "" });
    }
  };

  const removeCustomField = (index) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name?.trim()) {
      alert(language === 'ar' ? 'يجب إدخال اسم المنتج' : 'Product name is required');
      return;
    }
    
    if (!formData.has_variants && (!formData.selling_price || formData.selling_price <= 0)) {
      alert(language === 'ar' ? 'يجب إدخال سعر البيع' : 'Selling price is required');
      return;
    }
    
    onSave({
      ...formData,
      selling_price: Number(formData.selling_price),
      cost_price: Number(formData.cost_price) || 0,
      quantity: Number(formData.quantity) || 0,
      min_stock_level: Number(formData.min_stock_level) || 5,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">{language === 'ar' ? t('product_information') : t('product_information')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <LocalizedField
            label="اسم المنتج *"
            labelEn="Product Name *"
            value={formData.name}
            valueEn={formData.name_en}
            onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
            onChangeEn={(val) => setFormData(prev => ({ ...prev, name_en: val }))}
            placeholder={language === 'ar' ? 'أدخل اسم المنتج' : 'Enter product name'}
            placeholderEn={language === 'ar' ? 'أدخل اسم المنتج' : 'Enter product name'}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? t('product_code') : t('product_code')}</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="SKU-001"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? t('barcode') : t('barcode')}</Label>
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="1234567890123"
                dir="ltr"
              />
            </div>
          </div>

          <LocalizedField
            label="التصنيف"
            labelEn="Category"
            value={formData.category}
            valueEn={formData.category_en}
            onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
            onChangeEn={(val) => setFormData(prev => ({ ...prev, category_en: val }))}
            placeholder={language === 'ar' ? 'مثال: إلكترونيات' : 'e.g., Electronics'}
            placeholderEn={language === 'ar' ? 'مثال: إلكترونيات' : 'e.g., Electronics'}
          />

          <div className="space-y-2">
            <Label>{language === 'ar' ? t('brand') : t('brand')}</Label>
            <Input
              value={formData.brand}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              placeholder="Apple, Samsung, etc."
            />
          </div>

          <LocalizedField
            label="الوحدة"
            labelEn="Unit"
            value={formData.unit}
            valueEn={formData.unit_en}
            onChange={(val) => setFormData(prev => ({ ...prev, unit: val }))}
            onChangeEn={(val) => setFormData(prev => ({ ...prev, unit_en: val }))}
            placeholder={language === 'ar' ? 'مثال: قطعة' : 'e.g., Piece'}
            placeholderEn={language === 'ar' ? 'مثال: قطعة' : 'e.g., Piece'}
          />

          <LocalizedField
            label="وصف المنتج"
            labelEn="Product Description"
            value={formData.description}
            valueEn={formData.description_en}
            onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
            onChangeEn={(val) => setFormData(prev => ({ ...prev, description_en: val }))}
            placeholder={language === 'ar' ? 'وصف تفصيلي للمنتج...' : 'Detailed product description...'}
            placeholderEn={language === 'ar' ? 'وصف تفصيلي للمنتج...' : 'Detailed product description...'}
            multiline={true}
          />
        </CardContent>
      </Card>

      {/* Product Images */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">{language === 'ar' ? t('product_images') : t('product_images')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ImageUpload
            images={formData.images || []}
            onChange={(images) => setFormData(prev => ({ ...prev, images }))}
            maxImages={5}
            maxSizeMB={2}
            compressQuality={0.8}
          />
        </CardContent>
      </Card>

      {/* Pricing & Stock */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">{language === 'ar' ? t('pricing_stock') : t('pricing_stock')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg mb-4 border border-amber-200">
            <div>
              <Label className="font-semibold text-amber-900">{language === 'ar' ? t('product_has_variants') : t('product_has_variants')}</Label>
              <p className="text-sm text-amber-700">
                {language === 'ar' ? t('variants_description') : t('variants_description')}
              </p>
            </div>
            <Switch
              checked={formData.has_variants}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_variants: checked }))}
            />
          </div>

          {!formData.has_variants && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? t('cost_price') : t('cost_price')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? t('selling_price') + ' *' : t('selling_price') + ' *'}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, selling_price: e.target.value }))}
                  required
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? t('stock_quantity') : t('stock_quantity')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? t('min_stock_level') : t('min_stock_level')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: e.target.value }))}
                  placeholder="5"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {formData.has_variants && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                {language === 'ar' 
                  ? t('variants_management')
                  : t('variants_management')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">{language === 'ar' ? t('custom_fields') : t('custom_fields')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {formData.custom_fields?.length > 0 && (
            <div className="space-y-2 mb-4">
              {formData.custom_fields.map((field, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <span className="text-sm font-medium text-slate-700">{field.name}</span>
                    <span className="text-sm text-slate-600">{field.value}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomField(index)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              value={newCustomField.name}
              onChange={(e) => setNewCustomField(prev => ({ ...prev, name: e.target.value }))}
              placeholder={language === 'ar' ? t('field_name') : t('field_name')}
            />
            <div className="flex gap-2">
              <Input
                value={newCustomField.value}
                onChange={(e) => setNewCustomField(prev => ({ ...prev, value: e.target.value }))}
                placeholder={language === 'ar' ? t('field_value') : t('field_value')}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addCustomField}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <Label>{language === 'ar' ? t('product_active') : t('product_active')}</Label>
              <p className="text-sm text-slate-500">{language === 'ar' ? t('visible_in_list') : t('visible_in_list')}</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 ml-2" />
          {language === 'ar' ? t('cancel') : t('cancel')}
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 ml-2" />
          {isLoading ? t('saving') : t('save_product')}
        </Button>
      </div>
    </form>
  );
}