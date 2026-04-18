import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, X, UserPlus, AlertTriangle, Package, Search } from "lucide-react";
import { format } from "date-fns";
import QuickCustomerAdd from "./QuickCustomerAdd";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/LanguageContext";

export default function InvoiceForm({ invoice, customers = [], products = [], onSave, onCancel, isLoading, onAddCustomer, onSaveAndPrint }) {
  const { language, t } = useLanguage();
  const isEditMode = !!invoice;
  const isLocked = isEditMode && invoice?.status !== "draft";
  
  const [formData, setFormData] = useState({
    invoice_number: "",
    customer_id: "",
    customer_name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    due_date: "",
    items: [],
    subtotal: 0,
    tax_rate: 15,
    tax_amount: 0,
    discount: 0,
    shipping_cost: 0,
    total: 0,
    status: "sent",
    payment_method: "",
    notes: "",
    apply_vat: true,
    ...invoice,
  });

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchProducts, setSearchProducts] = useState({});
  const [showProductDropdown, setShowProductDropdown] = useState({});
  const [sendEmailToCustomer, setSendEmailToCustomer] = useState(true);

  
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

  const generateInvoiceNumber = async () => {
    try {
      const allInvoices = await import("@/api/WadaqCore").then(({ Wadaq }) => 
        Wadaq.entities.Invoice.list("-created_date", 1)
      );
      
      // Extract last invoice number
      const lastInvoice = allInvoices[0];
      let nextNumber = 1;
      
      if (lastInvoice?.invoice_number) {
        const match = lastInvoice.invoice_number.match(/INV-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      return `INV-${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      // Fallback to timestamp-based
      const timestamp = Date.now().toString().slice(-6);
      return `INV-${timestamp}`;
    }
  };

  useEffect(() => {
    if (!invoice && !formData.invoice_number) {
      generateInvoiceNumber().then(number => {
        setFormData(prev => ({ ...prev, invoice_number: number }));
      });
    }
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax_rate, formData.discount, formData.shipping_cost, formData.apply_vat]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax_amount = formData.apply_vat ? (subtotal * formData.tax_rate) / 100 : 0;
    const total = subtotal + tax_amount - (formData.discount || 0) + (formData.shipping_cost || 0);
    
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
      customer_vat_number: customer?.tax_number || prev.customer_vat_number || "",
      customer_address: customer?.address || prev.customer_address || "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // توليد بيانات ZATCA المطلوبة
    try {
      const { Wadaq } = await import("@/api/WadaqCore");
      const user = await Wadaq.auth.me();
      const organizations = await Wadaq.entities.Organization.filter({ owner_email: user.email });
      const org = organizations[0];
      
      const zatcaResponse = await Wadaq.functions.invoke('generateZATCACompliantInvoice', {
        invoiceData: {
          invoice_number: formData.invoice_number,
          date: formData.date,
          time: format(new Date(), 'HH:mm:ss'),
          total: formData.total,
          tax_amount: formData.tax_amount,
          subtotal: formData.subtotal,
          items: formData.items,
          seller_name: org?.name || user?.company_name || 'مؤسسة ركاز',
          vat_number: org?.vat_number || user?.company_vat_number || '',
          commercial_registration: org?.commercial_registration || user?.company_commercial_registration || '',
          seller_address: org?.address || user?.company_address || ''
        }
      });
      
      if (zatcaResponse.data?.success) {
        // إضافة بيانات ZATCA للفاتورة
        Object.assign(formData, {
          ...zatcaResponse.data.zatca_fields,
          time: format(new Date(), 'HH:mm:ss')
        });
      }
    } catch (error) {
      console.error('Error generating ZATCA data:', error);
    }
    
    // Validation: Check required fields
    if (!formData.customer_name || !formData.customer_name.trim()) {
      alert(language === 'ar' ? 'يجب إدخال اسم العميل' : 'Customer name is required');
      return;
    }
    
    if (!formData.invoice_number || !formData.invoice_number.trim()) {
      alert(language === 'ar' ? 'يجب إدخال رقم الفاتورة' : 'Invoice number is required');
      return;
    }
    
    if (!formData.date) {
      alert(language === 'ar' ? 'يجب إدخال تاريخ الفاتورة' : 'Invoice date is required');
      return;
    }
    
    // Validation: Check items
    if (formData.items.length === 0) {
      alert(language === 'ar' ? 'يجب إضافة بند واحد على الأقل للفاتورة' : 'At least one item is required');
      return;
    }
    
    // Validation: Check each item has required data
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.product_id && !item.product_name) {
        alert(language === 'ar' 
          ? `البند رقم ${i + 1}: يجب اختيار منتج أو إدخال اسم المنتج`
          : `Item ${i + 1}: Product selection or name is required`);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        alert(language === 'ar' 
          ? `البند رقم ${i + 1}: يجب إدخال كمية صحيحة`
          : `Item ${i + 1}: Valid quantity is required`);
        return;
      }
      if (!item.price || item.price < 0) {
        alert(language === 'ar' 
          ? `البند رقم ${i + 1}: يجب إدخال سعر صحيح`
          : `Item ${i + 1}: Valid price is required`);
        return;
      }
    }
    
    // Validation: Check total is greater than zero
    if (formData.total <= 0) {
      alert(language === 'ar' ? 'إجمالي الفاتورة يجب أن يكون أكبر من صفر' : 'Invoice total must be greater than zero');
      return;
    }
    
    // Update inventory for each item
    // خصم المخزون فقط في الحالات التالية:
    // 1. فاتورة جديدة بحالة "مدفوعة" (!isEditMode && formData.status === 'paid')
    // 2. تعديل فاتورة وتغيير الحالة من غير مدفوعة إلى مدفوعة (isEditMode && invoice?.status !== 'paid' && formData.status === 'paid')
    const shouldDeductInventory = !isEditMode 
      ? formData.status === 'paid'  // فاتورة جديدة: خصم فقط إذا كانت مدفوعة
      : (invoice?.status !== 'paid' && formData.status === 'paid');  // فاتورة موجودة: خصم فقط عند تغيير الحالة لمدفوعة

    if (shouldDeductInventory) {
      for (const item of formData.items) {
        if (item.product_id) {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            const newQuantity = (product.quantity || 0) - item.quantity;
            try {
              const { Wadaq } = await import("@/api/WadaqCore");
              await Wadaq.entities.Product.update(item.product_id, {
                quantity: Math.max(0, newQuantity)
              });
              
              // Create stock movement record
              await Wadaq.entities.StockMovement.create({
                product_id: item.product_id,
                product_name: item.product_name,
                type: 'out',
                quantity: item.quantity,
                previous_quantity: product.quantity || 0,
                new_quantity: Math.max(0, newQuantity),
                reference_type: 'invoice',
                reference_id: formData.invoice_number,
                date: formData.date,
                notes: language === 'ar' ? 'خصم من فاتورة مدفوعة' : 'Deducted from paid invoice'
              });
            } catch (error) {
              console.error('Error updating inventory:', error);
            }
          }
        }
      }
    }
    
    await onSave(formData, sendEmailToCustomer);
  };

  const handleCancel = () => {
    if (formData.items.length > 0 || formData.customer_name) {
      if (confirm(t("confirm_cancel_invoice"))) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isLocked && (
        <Card className="bg-amber-50 border-2 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">{language === 'ar' ? t('locked_invoice') : t('locked_invoice')}</p>
              <p className="text-sm text-amber-700">
                {language === 'ar' ? t('locked_message') : t('locked_message')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">{language === 'ar' ? t('invoice_information') : t('invoice_information')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {language === 'ar' ? t('invoice_number') : t('invoice_number')}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.invoice_number}
              onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
              required
              disabled={isEditMode}
              className={isEditMode ? "bg-slate-100" : ""}
            />
          </div>

          <div className="space-y-2 md:col-span-2 relative">
            <Label className="flex items-center gap-1">
              {language === 'ar' ? t('customer_name') : t('customer_name')}
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={formData.customer_name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, customer_name: e.target.value, customer_id: "" }));
                    setSearchCustomer(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  placeholder={language === 'ar' ? 'اكتب اسم العميل للبحث أو الإدخال المباشر...' : 'Type customer name to search or enter directly...'}
                  required
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {filteredCustomers.map(customer => {
                      const displayName = language === 'ar' ? customer.name : (customer.name_en || customer.name);
                      return (
                        <div
                          key={customer.id}
                          onMouseDown={() => {
                            handleCustomerChange(customer.id);
                            setSearchCustomer(displayName);
                            setShowCustomerDropdown(false);
                          }}
                          className="px-4 py-2.5 cursor-pointer hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                        >
                          <span className="font-medium text-slate-800">{displayName}</span>
                          {customer.phone && <span className="text-xs text-slate-400">{customer.phone}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddCustomer(true)}
                className="shrink-0"
              >
                <UserPlus className="w-4 h-4 ml-2" />
                {language === 'ar' ? t('new_customer') : t('new_customer')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {language === 'ar' ? t('invoice_date') : t('invoice_date')}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              disabled={isLocked}
              className={isLocked ? "bg-slate-100" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'ar' ? t('due_date') : t('due_date')}</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'ar' ? 'الرقم الضريبي للعميل' : 'Customer VAT Number'}</Label>
            <Input
              value={formData.customer_vat_number || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_vat_number: e.target.value }))}
              placeholder={language === 'ar' ? '300000000000003 (اختياري للفواتير المبسطة)' : 'Optional for simplified invoices'}
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'ar' ? t('status') : t('status')}</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{language === 'ar' ? t('draft') : t('draft')}</SelectItem>
                <SelectItem value="sent">{language === 'ar' ? t('sent') : t('sent')}</SelectItem>
                <SelectItem value="paid">{language === 'ar' ? t('paid') : t('paid')}</SelectItem>
                <SelectItem value="overdue">{language === 'ar' ? t('overdue') : t('overdue')}</SelectItem>
                <SelectItem value="cancelled">{language === 'ar' ? t('cancelled') : t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{language === 'ar' ? t('invoice_items') : t('invoice_items')}</CardTitle>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addItem}
              disabled={isLocked}
            >
              <Plus className="w-4 h-4 ml-2" />
              {language === 'ar' ? t('add_item') : t('add_item')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {formData.items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              {language === 'ar' ? t('no_items') : t('no_items')}
            </div>
          ) : (
            <div className="space-y-4">
              {formData.items.map((item, index) => {
                const hasLowStock = item.available_quantity !== undefined && 
                                   item.quantity > item.available_quantity;
                return (
                  <div key={item.id || index} className={`flex flex-wrap gap-4 items-end p-4 rounded-xl border-2 ${
                    hasLowStock ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex-1 min-w-[200px] space-y-2">
                      <Label>{language === 'ar' ? 'اسم المنتج' : 'Product Name'}</Label>
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          value={item.product_name}
                          onChange={(e) => {
                            updateItem(index, "product_name", e.target.value);
                            updateItem(index, "product_id", "");
                            setSearchProducts(prev => ({ ...prev, [index]: e.target.value }));
                            setShowProductDropdown(prev => ({ ...prev, [index]: true }));
                          }}
                          onFocus={() => setShowProductDropdown(prev => ({ ...prev, [index]: true }))}
                          onBlur={() => setTimeout(() => setShowProductDropdown(prev => ({ ...prev, [index]: false })), 200)}
                          placeholder={language === 'ar' ? 'ابحث أو اكتب اسم المنتج...' : 'Search or type product name...'}
                          disabled={isLocked}
                          className="pr-9"
                        />
                        {showProductDropdown[index] && getAvailableProducts(index).length > 0 && (
                          <div className="absolute top-full right-0 left-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                            {getAvailableProducts(index).map(product => {
                              const displayName = language === 'ar' ? product.name : (product.name_en || product.name);
                              return (
                                <div
                                  key={product.id}
                                  onMouseDown={() => {
                                    updateItem(index, "product_id", product.id);
                                    setSearchProducts(prev => ({ ...prev, [index]: displayName }));
                                    setShowProductDropdown(prev => ({ ...prev, [index]: false }));
                                  }}
                                  className="px-4 py-2.5 cursor-pointer hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                                >
                                  <span className="font-medium text-slate-800">{displayName}</span>
                                  <div className="flex items-center gap-2 text-xs">
                                    <Badge variant="outline">{product.quantity || 0} {language === 'ar' ? 'متاح' : 'in stock'}</Badge>
                                    <span className="text-emerald-600 font-bold">{product.selling_price || product.price || 0} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {hasLowStock && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{language === 'ar' ? t('quantity_exceeds') : t('quantity_exceeds')} ({item.available_quantity})</span>
                        </div>
                      )}
                    </div>

                    <div className="w-24 space-y-2">
                      <Label>{language === 'ar' ? t('quantity') : t('quantity')}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                        className={hasLowStock ? 'border-red-500' : isLocked ? 'bg-slate-100' : ''}
                        disabled={isLocked}
                      />
                    </div>

                    <div className="w-32 space-y-2">
                      <Label>{language === 'ar' ? t('price') : t('price')}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                        dir="ltr"
                        disabled={isLocked}
                        className={isLocked ? 'bg-slate-100' : ''}
                      />
                    </div>

                    <div className="w-32 space-y-2">
                      <Label>{language === 'ar' ? t('total') : t('total')}</Label>
                      <Input
                        value={item.total.toLocaleString()}
                        readOnly
                        className="bg-slate-100 font-bold"
                        dir="ltr"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={addItem}
                        disabled={isLocked}
                        title={language === 'ar' ? 'إضافة بند جديد' : 'Add new item'}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => removeItem(index)}
                        disabled={isLocked}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="max-w-md mr-auto space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{language === 'ar' ? t('subtotal') : t('subtotal')}</span>
                <span className="font-medium">{formData.subtotal.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
              
              {/* VAT Toggle */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.apply_vat}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, apply_vat: checked }))}
                    disabled={isLocked}
                  />
                  <div>
                    <Label className="text-sm font-semibold text-blue-900">
                      {language === 'ar' ? t('apply_vat') : t('apply_vat')}
                    </Label>
                    <p className="text-xs text-blue-700">
                      {formData.apply_vat ? (language === 'ar' ? t('vat_enabled') : t('vat_enabled')) : (language === 'ar' ? t('vat_disabled') : t('vat_disabled'))}
                    </p>
                  </div>
                </div>
              </div>

              {formData.apply_vat && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 text-sm">{language === 'ar' ? t('tax') + ' 15%' : t('tax') + ' 15%'}</span>
                  <span className="font-medium text-sm">{formData.tax_amount.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 text-sm">{language === 'ar' ? t('discount_sar') : t('discount_sar')}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-24 text-center ${isLocked ? 'bg-slate-100' : ''}`}
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                  dir="ltr"
                  disabled={isLocked}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 text-sm">{language === 'ar' ? t('shipping_sar') : t('shipping_sar')}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-24 text-center ${isLocked ? 'bg-slate-100' : ''}`}
                  value={formData.shipping_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipping_cost: Number(e.target.value) }))}
                  dir="ltr"
                  disabled={isLocked}
                />
              </div>

              <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-3">
                <span>{language === 'ar' ? t('final_total') : t('final_total')}</span>
                <span className="text-emerald-600">{formData.total.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Email Options */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">{language === 'ar' ? t('terms_notes') : t('terms_notes')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label>{language === 'ar' ? t('invoice_notes') : t('invoice_notes')}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t('notes_placeholder')}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              {t('notes_hint')}
            </p>
          </div>

          {/* Email to Customer Toggle */}
          {!isEditMode && (
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={sendEmailToCustomer}
                    onCheckedChange={setSendEmailToCustomer}
                  />
                  <div>
                    <Label className="text-sm font-semibold text-blue-900">
                      {language === 'ar' ? t('send_email_customer') : t('send_email_customer')}
                    </Label>
                    <p className="text-xs text-blue-700">
                      {sendEmailToCustomer 
                        ? (language === 'ar' ? t('email_sent_auto') : t('email_sent_auto'))
                        : (language === 'ar' ? t('no_email_sent') : t('no_email_sent'))}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {t('email_hint')}
              </p>
            </div>
          )}
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
          {language === 'ar' ? t('cancel') : t('cancel')}
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
        >
          <Save className="w-4 h-4 ml-2" />
          {isLoading ? t('saving') : t('save_finish')}
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