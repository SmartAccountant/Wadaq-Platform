import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Upload, Image as ImageIcon, MoreVertical, Grid3x3 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/components/LanguageContext";

export default function VariantsManager({ product, onBack }) {
  const { language } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const queryClient = useQueryClient();

  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["variants", product.id],
    queryFn: async () => {
      return Wadaq.entities.ProductVariant.filter({ product_id: product.id });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => Wadaq.entities.ProductVariant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants", product.id] });
      setShowForm(false);
      setEditingVariant(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => Wadaq.entities.ProductVariant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants", product.id] });
      setShowForm(false);
      setEditingVariant(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Wadaq.entities.ProductVariant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants", product.id] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {language === 'ar' ? 'إدارة المتغيرات' : 'Manage Variants'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {language === 'ar' ? product.name : (product.name_en || product.name)}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setEditingVariant(null);
            setShowForm(true);
          }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 ml-2" />
          {language === 'ar' ? 'متغير جديد' : 'New Variant'}
        </Button>
      </div>

      {showForm && (
        <VariantForm
          product={product}
          variant={editingVariant}
          onSave={(data) => {
            if (editingVariant) {
              updateMutation.mutate({ id: editingVariant.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingVariant(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {variants.map((variant) => (
          <Card key={variant.id} className="overflow-hidden">
            {variant.image && (
              <img 
                src={variant.image} 
                alt={variant.variant_name}
                className="w-full h-32 object-cover"
              />
            )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {language === 'ar' ? variant.variant_name : (variant.variant_name_en || variant.variant_name)}
                  </h3>
                  {variant.sku && (
                    <p className="text-xs text-slate-500 font-mono mt-1">{variant.sku}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingVariant(variant);
                      setShowForm(true);
                    }}>
                      <Edit className="w-4 h-4 ml-2" />
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        if (confirm(language === 'ar' ? 'حذف هذا المتغير؟' : 'Delete this variant?')) {
                          deleteMutation.mutate(variant.id);
                        }
                      }}
                      className="text-rose-600"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {variant.attributes?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {variant.attributes.map((attr, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {attr.name}: {attr.value}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{language === 'ar' ? 'السعر' : 'Price'}</span>
                  <span className="font-bold text-emerald-600">
                    {variant.price?.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{language === 'ar' ? 'المخزون' : 'Stock'}</span>
                  <span className={`font-semibold ${
                    variant.quantity === 0 ? 'text-rose-600' : 'text-slate-800'
                  }`}>
                    {variant.quantity || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {variants.length === 0 && !showForm && (
        <Card className="p-12 text-center">
          <Grid3x3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-4">
            {language === 'ar' ? 'لم يتم إضافة متغيرات بعد' : 'No variants added yet'}
          </p>
        </Card>
      )}
    </div>
  );
}

function VariantForm({ product, variant, onSave, onCancel, isLoading }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    product_id: product.id,
    product_name: product.name,
    variant_name: "",
    variant_name_en: "",
    sku: "",
    attributes: [],
    price: "",
    cost_price: "",
    quantity: 0,
    image: "",
    is_active: true,
    ...variant,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [newAttribute, setNewAttribute] = useState({ name: "", value: "" });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await Wadaq.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image: file_url }));
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const addAttribute = () => {
    if (newAttribute.name && newAttribute.value) {
      setFormData(prev => ({
        ...prev,
        attributes: [...(prev.attributes || []), { ...newAttribute }]
      }));
      setNewAttribute({ name: "", value: "" });
    }
  };

  const removeAttribute = (index) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: Number(formData.price),
      cost_price: Number(formData.cost_price) || 0,
      quantity: Number(formData.quantity) || 0,
    });
  };

  return (
    <Card className="border-2 border-purple-200 bg-purple-50">
      <CardHeader className="border-b border-purple-200">
        <CardTitle className="text-lg">
          {variant ? (language === 'ar' ? 'تعديل المتغير' : 'Edit Variant') : (language === 'ar' ? 'متغير جديد' : 'New Variant')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'اسم المتغير (عربي) *' : 'Variant Name (Arabic) *'}</Label>
              <Input
                value={formData.variant_name}
                onChange={(e) => setFormData(prev => ({ ...prev, variant_name: e.target.value }))}
                placeholder={language === 'ar' ? 'مثال: أحمر - كبير' : 'e.g., Red - Large'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'اسم المتغير (إنجليزي)' : 'Variant Name (English)'}</Label>
              <Input
                value={formData.variant_name_en}
                onChange={(e) => setFormData(prev => ({ ...prev, variant_name_en: e.target.value }))}
                placeholder="e.g., Red - Large"
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'رمز SKU' : 'SKU Code'}</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="SKU-VAR-001"
                dir="ltr"
              />
            </div>
          </div>

          {/* Attributes */}
          <div className="space-y-3 p-4 bg-white rounded-lg">
            <Label>{language === 'ar' ? 'الخصائص (اللون، الحجم، إلخ)' : 'Attributes (Color, Size, etc.)'}</Label>
            
            {formData.attributes?.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.attributes.map((attr, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <Badge variant="outline" className="flex-1">
                      {attr.name}: {attr.value}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeAttribute(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={newAttribute.name}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, name: e.target.value }))}
                placeholder={language === 'ar' ? 'الخاصية (مثل: اللون)' : 'Property (e.g., Color)'}
                className="flex-1"
              />
              <Input
                value={newAttribute.value}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
                placeholder={language === 'ar' ? 'القيمة (مثل: أحمر)' : 'Value (e.g., Red)'}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addAttribute}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <Label>{language === 'ar' ? 'صورة المتغير' : 'Variant Image'}</Label>
            {formData.image ? (
              <div className="relative inline-block">
                <img 
                  src={formData.image} 
                  alt="Variant"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -left-2 h-6 w-6"
                  onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <Button type="button" variant="outline" asChild disabled={uploadingImage}>
                  <span>
                    {uploadingImage ? (
                      <>{language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 ml-2" />
                        {language === 'ar' ? 'رفع صورة' : 'Upload Image'}
                      </>
                    )}
                  </span>
                </Button>
              </label>
            )}
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'سعر التكلفة' : 'Cost Price'}</Label>
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
              <Label>{language === 'ar' ? 'سعر البيع *' : 'Selling Price *'}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
                placeholder="0.00"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الكمية' : 'Quantity'}</Label>
              <Input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              <X className="w-4 h-4 ml-2" />
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 ml-2" />
              {isLoading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}