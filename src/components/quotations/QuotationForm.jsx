import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, X, UserPlus, Package, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import QuickCustomerAdd from "../invoices/QuickCustomerAdd";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/LanguageContext";

export default function QuotationForm({ quotation, customers = [], products = [], onSave, onCancel, isLoading, onAddCustomer }) {
  const { language } = useLanguage();
  const isEditMode = !!quotation;
  
  const [formData, setFormData] = useState({
    quote_number: "",
    customer_id: "",
    customer_name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    valid_until: "",
    items: [],
    subtotal: 0,
    tax_rate: 15,
    tax_amount: 0,
    discount: 0,
    total: 0,
    status: "draft",
    notes: "",
    apply_vat: true,
    ...quotation,
  });

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchProducts, setSearchProducts] = useState({});
  
  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.phone?.includes(searchCustomer)
  );

  const getAvailableProducts = (itemIndex) => {
    const search = searchProducts[itemIndex] || "";
    return products.filter(p => 
      p.is_active !== false && 
      (p.name?.toLowerCase().includes(search.toLowerCase()) ||
       p.name_en?.toLowerCase().includes(search.toLowerCase()) ||
       p.code?.toLowerCase().includes(search.toLowerCase()) ||
       p.barcode?.toLowerCase().includes(search.toLowerCase()))
    );
  };

  const generateQuoteNumber = async () => {
    try {
      const allQuotes = await import("@/api/WadaqClient").then(({ Wadaq }) => 
        Wadaq.entities.Quotation.list("-created_date", 1)
      );
      
      const lastQuote = allQuotes[0];
      let nextNumber = 1;
      
      if (lastQuote?.quote_number) {
        const match = lastQuote.quote_number.match(/QT-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      return `QT-${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      const timestamp = Date.now().toString().slice(-6);
      return `QT-${timestamp}`;
    }
  };

  useEffect(() => {
    if (!quotation && !formData.quote_number) {
      generateQuoteNumber().then(number => {
        setFormData(prev => ({ ...prev, quote_number: number }));
      });
    }
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax_rate, formData.discount, formData.apply_vat]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax_amount = formData.apply_vat ? (subtotal * formData.tax_rate) / 100 : 0;
    const total = subtotal + tax_amount - (formData.discount || 0);
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount,
      total: Math.max(0, total),
    }));
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    const displayName = language === 'ar' ? customer?.name : (customer?.name_en || customer?.name);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: displayName || "",
    }));
  };

  const addItem = () => {
    const uniqueId = Date.now() + Math.random();
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        id: uniqueId,
        product_id: "", 
        product_name: "", 
        quantity: 1, 
        price: 0, 
        total: 0 
      }],
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        const displayName = language === 'ar' ? product.name : (product.name_en || product.name);
        newItems[index].product_name = displayName;
        newItems[index].price = product.selling_price || product.price;
        newItems[index].available_quantity = product.quantity || 0;
        newItems[index].total = newItems[index].quantity * (product.selling_price || product.price);
      }
    }

    if (field === "quantity" || field === "price") {
      newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].price || 0);
    }

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleAddCustomer = async (customerData) => {
    if (onAddCustomer) {
      const newCustomer = await onAddCustomer(customerData);
      if (newCustomer) {
        setFormData(prev => ({
          ...prev,
          customer_id: newCustomer.id,
          customer_name: newCustomer.name,
        }));
        setShowAddCustomer(false);
      }
    }
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // التحقق من اسم العميل
    if (!formData.customer_name || formData.customer_name.trim() === "") {
      alert(language === 'ar' ? 'يجب إدخال اسم العميل' : 'Customer name is required');
      return;
    }
    
    // التحقق من وجود بند واحد على الأقل
    if (formData.items.length === 0) {
      alert(language === 'ar' ? 'يجب إضافة بند واحد على الأقل' : 'At least one item is required');
      return;
    }
    
    onSave(formData);
  };

  const handleCancel = () => {
    if (formData.items.length > 0 || formData.customer_name) {
      if (confirm(language === 'ar' ? 'هل أنت متأكد من إلغاء عرض السعر؟ سيتم فقدان جميع البيانات المدخلة.' : 'Are you sure you want to cancel? All entered data will be lost.')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">{language === 'ar' ? 'معلومات عرض السعر' : 'Quotation Information'}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'رقم العرض' : 'Quote Number'}</Label>
            <Input
              value={formData.quote_number}
              onChange={(e) => setFormData(prev => ({ ...prev, quote_number: e.target.value }))}
              required
              disabled={isEditMode}
              className={isEditMode ? "bg-slate-100" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'ar' ? 'البحث عن العميل' : 'Search Customer'}</Label>
            <Input
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              placeholder={language === 'ar' ? 'ابحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'ar' ? 'اختر العميل' : 'Select Customer'}</Label>
            <div className="flex gap-2">
              <Select value={formData.customer_id} onValueChange={handleCustomerChange} className="flex-1">
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر من القائمة' : 'Select from list'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCustomers.map(customer => {
                    const displayName = language === 'ar' ? customer.name : (customer.name_en || customer.name);
                    return (
                    <SelectItem key={customer.id} value={customer.id}>
                      {displayName} {customer.phone && `- ${customer.phone}`}
                    </SelectItem>
                  )})}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddCustomer(true)}
                className="shrink-0"
              >
                <UserPlus className="w-4 h-4 ml-2" />
                {language === 'ar' ? 'عميل جديد' : 'New Customer'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{language === 'ar' ? 'أو أدخل اسم مباشرة' : 'Or Enter Name Directly'}</Label>
            <Input
              value={formData.customer_name}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
              placeholder={language === 'ar' ? 'اسم العميل' : 'Customer Name'}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'ar' ? 'تاريخ العرض' : 'Quote Date'}</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'ar' ? 'صالح حتى تاريخ' : 'Valid Until'}</Label>
            <Input
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
              placeholder={language === 'ar' ? 'تاريخ انتهاء العرض' : 'Quote expiry date'}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'ar' ? 'الحالة' : 'Status'}</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
                <SelectItem value="sent">{language === 'ar' ? 'مرسل' : 'Sent'}</SelectItem>
                <SelectItem value="accepted">{language === 'ar' ? 'مقبول' : 'Accepted'}</SelectItem>
                <SelectItem value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</SelectItem>
                <SelectItem value="converted">{language === 'ar' ? 'تم التحويل' : 'Converted'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{language === 'ar' ? 'بنود عرض السعر' : 'Quotation Items'}</CardTitle>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addItem}
          >
            <Plus className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'إضافة بند' : 'Add Item'}
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {formData.items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              {language === 'ar' ? 'لم يتم إضافة بنود بعد' : 'No items added yet'}
            </div>
          ) : (
            <div className="space-y-4">
              {formData.items.map((item, index) => {
                const hasLowStock = item.available_quantity !== undefined && 
                                   item.quantity > item.available_quantity;
                return (
                  <div key={item.id || index} className={`flex flex-wrap gap-4 items-end p-4 rounded-xl border-2 ${
                    hasLowStock ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <Label>{language === 'ar' ? 'بحث عن منتج' : 'Search Product'}</Label>
                    <Input
                      value={searchProducts[index] || ""}
                      onChange={(e) => setSearchProducts(prev => ({
                        ...prev,
                        [index]: e.target.value
                      }))}
                      placeholder={language === 'ar' ? 'ابحث بالاسم، الكود أو الباركود...' : 'Search by name, code or barcode...'}
                      className="mb-2"
                    />
                    <Select 
                      value={item.product_id} 
                      onValueChange={(value) => updateItem(index, "product_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر المنتج' : 'Select Product'} />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableProducts(index).map(product => {
                          const displayName = language === 'ar' ? product.name : (product.name_en || product.name);
                          return (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center justify-between w-full gap-4">
                              <span>{displayName}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {product.quantity || 0} {language === 'ar' ? 'متوفر' : 'available'}
                                </Badge>
                                <span className="text-emerald-600 font-medium">
                                  {product.selling_price || product.price} {language === 'ar' ? 'ر.س' : 'SAR'}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        )})}
                      </SelectContent>
                    </Select>
                    {hasLowStock && (
                      <div className="flex items-center gap-2 text-orange-600 text-sm mt-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          {language === 'ar' 
                            ? `⚠️ الكمية المطلوبة أكبر من المتوفر (${item.available_quantity})`
                            : `⚠️ Quantity exceeds available stock (${item.available_quantity})`
                          }
                        </span>
                      </div>
                    )}
                    </div>

                    <div className="w-24 space-y-2">
                    <Label>{language === 'ar' ? 'الكمية' : 'Quantity'}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      className={hasLowStock ? 'border-orange-500' : ''}
                    />
                    </div>

                  <div className="w-32 space-y-2">
                    <Label>{language === 'ar' ? 'السعر' : 'Price'}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                      dir="ltr"
                    />
                  </div>

                  <div className="w-32 space-y-2">
                    <Label>{language === 'ar' ? 'الإجمالي' : 'Total'}</Label>
                    <Input
                      value={item.total.toLocaleString()}
                      readOnly
                      className="bg-slate-100 font-bold"
                      dir="ltr"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  </div>
                  );
                  })}
            </div>
          )}

          {/* Totals */}
          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="max-w-md mr-auto space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span className="font-medium">{formData.subtotal.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.apply_vat}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, apply_vat: checked }))}
                  />
                  <div>
                    <Label className="text-sm font-semibold text-blue-900">
                      {language === 'ar' ? 'تطبيق ضريبة القيمة المضافة (15%)' : 'Apply VAT (15%)'}
                    </Label>
                    <p className="text-xs text-blue-700">
                      {formData.apply_vat ? (language === 'ar' ? 'الضريبة مفعّلة' : 'VAT enabled') : (language === 'ar' ? 'الضريبة معطّلة' : 'VAT disabled')}
                    </p>
                  </div>
                </div>
              </div>

              {formData.apply_vat && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 text-sm">{language === 'ar' ? 'ضريبة القيمة المضافة 15%' : 'VAT 15%'}</span>
                  <span className="font-medium text-sm">{formData.tax_amount.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 text-sm">{language === 'ar' ? 'الخصم (ر.س)' : 'Discount (SAR)'}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-24 text-center"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                  dir="ltr"
                />
              </div>

              <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-3">
                <span>{language === 'ar' ? 'الإجمالي النهائي' : 'Total'}</span>
                <span className="text-emerald-600">{formData.total.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">{language === 'ar' ? 'شروط أو ملاحظات إضافية' : 'Terms & Additional Notes'}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'ملاحظات العرض' : 'Quotation Notes'}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={language === 'ar' 
                ? "مثال: شروط الدفع، مدة الصلاحية، أو ملاحظات خاصة"
                : "Example: Payment terms, validity period, or special notes"}
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-200 pt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel}
          className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          disabled={isLoading}
        >
          <X className="w-4 h-4 ml-2" />
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        >
          <Save className="w-4 h-4 ml-2" />
          {isLoading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'إنشاء عرض سعر' : 'Create Quotation')}
        </Button>
      </div>

      <QuickCustomerAdd 
        open={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onAdd={handleAddCustomer}
        isLoading={isLoading}
      />
    </form>
  );
}