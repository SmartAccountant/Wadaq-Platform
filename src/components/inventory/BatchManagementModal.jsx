import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, AlertTriangle, Calendar, Package } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { differenceInDays, parseISO } from "date-fns";

export default function BatchManagementModal({ product, batches, onClose }) {
  const { language } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    batch_number: "",
    quantity: "",
    manufacturing_date: "",
    expiry_date: "",
    cost_price: product.cost_price || "",
    supplier: "",
    notes: ""
  });
  const queryClient = useQueryClient();

  const createBatchMutation = useMutation({
    mutationFn: (data) => Wadaq.entities.ProductBatch.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productBatches"] });
      setShowAddForm(false);
      setFormData({
        batch_number: "",
        quantity: "",
        manufacturing_date: "",
        expiry_date: "",
        cost_price: product.cost_price || "",
        supplier: "",
        notes: ""
      });
    }
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ id, data }) => Wadaq.entities.ProductBatch.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productBatches"] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createBatchMutation.mutate({
      product_id: product.id,
      product_name: product.name,
      ...formData,
      initial_quantity: parseFloat(formData.quantity),
      quantity: parseFloat(formData.quantity),
      cost_price: parseFloat(formData.cost_price) || product.cost_price || 0,
      status: "active"
    });
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const daysUntilExpiry = differenceInDays(parseISO(expiryDate), new Date());
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'bg-rose-600 text-white', label: language === 'ar' ? 'منتهي' : 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { 
        status: 'expiring', 
        color: 'bg-amber-500 text-white', 
        label: language === 'ar' ? `${daysUntilExpiry} يوم` : `${daysUntilExpiry}d` 
      };
    }
    return { status: 'good', color: 'bg-emerald-500 text-white', label: language === 'ar' ? 'جيد' : 'Good' };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              {language === 'ar' ? 'إدارة الدفعات' : 'Batch Management'}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              {language === 'ar' ? product.name : (product.name_en || product.name)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Add Batch Button */}
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="mb-4 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 ml-2" />
              {language === 'ar' ? 'إضافة دفعة جديدة' : 'Add New Batch'}
            </Button>
          )}

          {/* Add Batch Form */}
          {showAddForm && (
            <Card className="mb-6 border-2 border-purple-200 bg-purple-50/30">
              <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'ar' ? 'رقم الدفعة *' : 'Batch Number *'}</Label>
                      <Input
                        required
                        value={formData.batch_number}
                        onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                        placeholder="B-001"
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'الكمية *' : 'Quantity *'}</Label>
                      <Input
                        type="number"
                        required
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'تاريخ الإنتاج' : 'Manufacturing Date'}</Label>
                      <Input
                        type="date"
                        value={formData.manufacturing_date}
                        onChange={(e) => setFormData({...formData, manufacturing_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'تاريخ انتهاء الصلاحية *' : 'Expiry Date *'}</Label>
                      <Input
                        type="date"
                        required
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'سعر التكلفة' : 'Cost Price'}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'المورد' : 'Supplier'}</Label>
                      <Input
                        value={formData.supplier}
                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createBatchMutation.isPending}>
                      {createBatchMutation.isPending 
                        ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                        : (language === 'ar' ? 'حفظ' : 'Save')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Batches List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 mb-3">
              {language === 'ar' ? 'الدفعات الحالية' : 'Current Batches'}
            </h3>
            {batches.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {language === 'ar' ? 'لا توجد دفعات مسجلة' : 'No batches registered'}
              </div>
            ) : (
              batches.map((batch) => {
                const expiryInfo = getExpiryStatus(batch.expiry_date);
                return (
                  <Card key={batch.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-slate-800">{batch.batch_number}</h4>
                            {expiryInfo && (
                              <Badge className={expiryInfo.color}>
                                {expiryInfo.label}
                              </Badge>
                            )}
                            {batch.status === 'expired' && (
                              <Badge className="bg-rose-600 text-white">
                                {language === 'ar' ? 'منتهي' : 'Expired'}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-slate-500">{language === 'ar' ? 'الكمية' : 'Quantity'}</p>
                              <p className="font-semibold text-slate-800">
                                {batch.quantity} / {batch.initial_quantity}
                              </p>
                            </div>
                            {batch.manufacturing_date && (
                              <div>
                                <p className="text-slate-500">{language === 'ar' ? 'تاريخ الإنتاج' : 'Mfg Date'}</p>
                                <p className="font-medium text-slate-700">
                                  {new Date(batch.manufacturing_date).toLocaleDateString('ar-SA')}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-slate-500">{language === 'ar' ? 'تاريخ الانتهاء' : 'Exp Date'}</p>
                              <p className="font-medium text-slate-700">
                                {new Date(batch.expiry_date).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                            {batch.supplier && (
                              <div>
                                <p className="text-slate-500">{language === 'ar' ? 'المورد' : 'Supplier'}</p>
                                <p className="font-medium text-slate-700">{batch.supplier}</p>
                              </div>
                            )}
                          </div>
                          {batch.notes && (
                            <p className="text-sm text-slate-600 mt-2 italic">{batch.notes}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}