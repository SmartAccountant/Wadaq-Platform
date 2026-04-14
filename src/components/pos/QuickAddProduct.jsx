import React, { useState } from "react";
import { Wadaq } from "@/api/WadaqClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Upload, Image as ImageIcon, Loader2, Camera, Check } from "lucide-react";
import Swal from "sweetalert2";

export default function QuickAddProduct({ onClose, onSuccess, language }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    selling_price: "",
    cost_price: "",
    quantity: "",
    category: "",
    unit: "قطعة",
    images: []
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      return await Wadaq.entities.Product.create({
        ...data,
        selling_price: parseFloat(data.selling_price),
        cost_price: parseFloat(data.cost_price) || 0,
        quantity: parseFloat(data.quantity) || 0,
        is_active: true
      });
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries(['products']);
      Swal.fire({
        icon: 'success',
        title: language === 'ar' ? 'تم إضافة المنتج بنجاح' : 'Product added successfully',
        timer: 1500,
        showConfirmButton: false
      });
      onSuccess(product);
    },
    onError: (error) => {
      Swal.fire({
        icon: 'error',
        title: language === 'ar' ? 'خطأ' : 'Error',
        text: error.message,
        confirmButtonText: language === 'ar' ? 'حسناً' : 'OK'
      });
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: language === 'ar' ? 'الصورة كبيرة جداً' : 'Image too large',
        text: language === 'ar' ? 'الحد الأقصى 5MB' : 'Max size 5MB',
        timer: 2000
      });
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await Wadaq.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, images: [file_url] });
      setImagePreview(file_url);
      
      Swal.fire({
        icon: 'success',
        title: language === 'ar' ? 'تم رفع الصورة' : 'Image uploaded',
        timer: 1000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: language === 'ar' ? 'فشل رفع الصورة' : 'Upload failed',
        text: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.selling_price) {
      Swal.fire({
        icon: 'warning',
        title: language === 'ar' ? 'بيانات ناقصة' : 'Missing data',
        text: language === 'ar' ? 'الرجاء إدخال الاسم والسعر' : 'Please enter name and price',
        timer: 2000
      });
      return;
    }

    createProductMutation.mutate(formData);
  };

  const categories = [
    { value: 'خضروات', label: language === 'ar' ? '🥬 خضروات' : '🥬 Vegetables' },
    { value: 'فواكه', label: language === 'ar' ? '🍎 فواكه' : '🍎 Fruits' },
    { value: 'لحوم', label: language === 'ar' ? '🥩 لحوم' : '🥩 Meat' },
    { value: 'ألبان', label: language === 'ar' ? '🥛 ألبان' : '🥛 Dairy' },
    { value: 'معلبات', label: language === 'ar' ? '🥫 معلبات' : '🥫 Canned' },
    { value: 'مخبوزات', label: language === 'ar' ? '🍞 مخبوزات' : '🍞 Bakery' },
    { value: 'مشروبات', label: language === 'ar' ? '🥤 مشروبات' : '🥤 Drinks' },
    { value: 'تنظيف', label: language === 'ar' ? '🧴 تنظيف' : '🧴 Cleaning' }
  ];

  const units = [
    { value: 'قطعة', label: language === 'ar' ? 'قطعة' : 'Piece' },
    { value: 'كيلو', label: language === 'ar' ? 'كيلو' : 'Kg' },
    { value: 'علبة', label: language === 'ar' ? 'علبة' : 'Box' },
    { value: 'كرتون', label: language === 'ar' ? 'كرتون' : 'Carton' }
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-white">
              ➕ {language === 'ar' ? 'إضافة منتج سريع' : 'Quick Add Product'}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-4">
            {/* رفع الصورة */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-lg font-medium">
                📸 {language === 'ar' ? 'صورة المنتج' : 'Product Image'}
              </Label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border-2 border-emerald-500">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, images: [] });
                      }}
                      className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="absolute top-2 left-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {language === 'ar' ? 'تم الرفع' : 'Uploaded'}
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video rounded-xl bg-slate-900/50 border-2 border-dashed border-slate-600 hover:border-purple-500 cursor-pointer transition-all group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    {uploading ? (
                      <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-slate-500 group-hover:text-purple-400 mb-2" />
                        <p className="text-slate-400 group-hover:text-purple-400 font-medium">
                          {language === 'ar' ? 'اضغط لرفع صورة' : 'Click to upload image'}
                        </p>
                        <p className="text-slate-600 text-sm mt-1">
                          {language === 'ar' ? 'PNG, JPG حتى 5MB' : 'PNG, JPG up to 5MB'}
                        </p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* الاسم */}
              <div className="col-span-2 space-y-2">
                <Label className="text-slate-300 font-medium">
                  {language === 'ar' ? 'اسم المنتج *' : 'Product Name *'}
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'ar' ? 'مثال: تفاح أحمر' : 'Example: Red Apple'}
                  className="bg-slate-900/50 border-slate-700 text-white h-12"
                  required
                />
              </div>

              {/* الباركود */}
              <div className="space-y-2">
                <Label className="text-slate-300 font-medium">
                  {language === 'ar' ? 'الباركود' : 'Barcode'}
                </Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="123456789"
                  className="bg-slate-900/50 border-slate-700 text-white h-12 font-mono"
                />
              </div>

              {/* التصنيف */}
              <div className="space-y-2">
                <Label className="text-slate-300 font-medium">
                  {language === 'ar' ? 'التصنيف' : 'Category'}
                </Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white h-12">
                    <SelectValue placeholder={language === 'ar' ? 'اختر التصنيف' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* السعر */}
              <div className="space-y-2">
                <Label className="text-slate-300 font-medium">
                  {language === 'ar' ? 'سعر البيع * (ر.س)' : 'Selling Price * (SAR)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  placeholder="10.00"
                  className="bg-slate-900/50 border-slate-700 text-white h-12 text-lg"
                  required
                />
              </div>

              {/* التكلفة */}
              <div className="space-y-2">
                <Label className="text-slate-300 font-medium">
                  {language === 'ar' ? 'سعر التكلفة (ر.س)' : 'Cost Price (SAR)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="5.00"
                  className="bg-slate-900/50 border-slate-700 text-white h-12 text-lg"
                />
              </div>

              {/* الكمية */}
              <div className="space-y-2">
                <Label className="text-slate-300 font-medium">
                  {language === 'ar' ? 'الكمية' : 'Quantity'}
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="100"
                  className="bg-slate-900/50 border-slate-700 text-white h-12 text-lg"
                />
              </div>

              {/* الوحدة */}
              <div className="space-y-2">
                <Label className="text-slate-300 font-medium">
                  {language === 'ar' ? 'الوحدة' : 'Unit'}
                </Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* أزرار الحفظ */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 h-14 text-lg border-slate-600 text-slate-300"
                disabled={createProductMutation.isPending}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                disabled={createProductMutation.isPending || uploading}
              >
                {createProductMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {language === 'ar' ? 'حفظ المنتج' : 'Save Product'} ✓
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}