import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  ar: {
    // Navigation
    'dashboard': 'لوحة التحكم',
    'invoices': 'الفواتير',
    'customers': 'العملاء',
    'products': 'المنتجات',
    'expenses': 'المصروفات',
    'reports': 'التقارير',
    'settings': 'الإعدادات',
    'logout': 'تسجيل الخروج',
    
    // Common
    'add': 'إضافة',
    'edit': 'تعديل',
    'delete': 'حذف',
    'save': 'حفظ',
    'cancel': 'إلغاء',
    'search': 'بحث',
    'filter': 'تصفية',
    'export': 'تصدير',
    'print': 'طباعة',
    'view': 'عرض',
    'actions': 'الإجراءات',
    'status': 'الحالة',
    'date': 'التاريخ',
    'total': 'الإجمالي',
    'subtotal': 'المجموع الفرعي',
    'tax': 'الضريبة',
    'discount': 'الخصم',
    'notes': 'ملاحظات',
    'name': 'الاسم',
    'description': 'الوصف',
    'price': 'السعر',
    'quantity': 'الكمية',
    'amount': 'المبلغ',
    
    // Invoice
    'invoice_number': 'رقم الفاتورة',
    'customer_name': 'اسم العميل',
    'due_date': 'تاريخ الاستحقاق',
    'payment_method': 'طريقة الدفع',
    'add_invoice': 'إضافة فاتورة',
    'create_invoice': 'إنشاء فاتورة',
    'invoice_details': 'تفاصيل الفاتورة',
    'invoice_items': 'بنود الفاتورة',
    'invoice_information': 'معلومات الفاتورة',
    'search_customer': 'البحث عن العميل',
    'search_by_name_phone': 'ابحث بالاسم أو الهاتف...',
    'choose_customer': 'اختر العميل',
    'choose_from_list': 'اختر من القائمة',
    'new_customer': 'عميل جديد',
    'or_enter_name': 'أو أدخل اسم مباشرة',
    'invoice_date': 'تاريخ الفاتورة',
    'add_item': 'إضافة بند',
    'no_items': 'لم يتم إضافة بنود بعد',
    'search_product': 'بحث عن منتج',
    'search_by_name_code': 'ابحث بالاسم، الكود أو الباركود...',
    'choose_product': 'اختر المنتج',
    'available': 'متوفر',
    'quantity_exceeds': 'الكمية المطلوبة أكبر من المتوفر',
    'apply_vat': 'تطبيق ضريبة القيمة المضافة',
    'vat_enabled': 'الضريبة مفعّلة',
    'vat_disabled': 'الضريبة معطّلة',
    'discount_sar': 'الخصم (ر.س)',
    'shipping_sar': 'الشحن (ر.س)',
    'final_total': 'الإجمالي النهائي',
    'terms_notes': 'شروط أو ملاحظات إضافية',
    'invoice_notes': 'ملاحظات الفاتورة',
    'notes_placeholder': 'مثال: الضمان، سياسة الاسترجاع، أو تفاصيل الحساب البنكي',
    'notes_hint': '💡 ستظهر هذه الملاحظات في أسفل الفاتورة المطبوعة',
    'send_email_customer': 'إرسال نسخة بالبريد الإلكتروني للعميل',
    'email_sent_auto': 'سيتم إرسال ملخص الفاتورة إلى بريد العميل تلقائياً',
    'no_email_sent': 'لن يتم إرسال بريد إلكتروني',
    'email_hint': '💡 تأكد من إدخال بريد إلكتروني صحيح للعميل',
    'save_finish': 'حفظ وإنهاء الفاتورة',
    'locked_invoice': 'فاتورة مؤمنة',
    'locked_message': 'هذه الفاتورة لم تعد مسودة ولا يمكن تعديل المبالغ',
    'new_invoice': 'فاتورة جديدة',
    
    // Status
    'draft': 'مسودة',
    'sent': 'مرسلة',
    'paid': 'مدفوعة',
    'overdue': 'متأخرة',
    'cancelled': 'ملغاة',
    
    // Payment Methods
    'cash': 'نقدي',
    'bank_transfer': 'تحويل بنكي',
    'credit_card': 'بطاقة ائتمان',
    'other': 'أخرى',
    
    // Dashboard
    'welcome': 'مرحباً',
    'monthly_sales': 'المبيعات الشهرية',
    'total_sales': 'إجمالي المبيعات',
    'taxes': 'الضرائب',
    'recent_invoices': 'الفواتير الأخيرة',
    'profit_trend': 'اتجاه الأرباح',
    
    // Customer
    'add_customer': 'إضافة عميل',
    'customer_details': 'بيانات العميل',
    'phone': 'الهاتف',
    'email': 'البريد الإلكتروني',
    'address': 'العنوان',
    'tax_number': 'الرقم الضريبي',
    'customer_information': 'معلومات العميل',
    'phone_number': 'رقم الهاتف',
    'save_customer': 'حفظ العميل',
    'edit_customer': 'تعديل العميل',
    'all_customers': 'جميع العملاء',
    'active_customers': 'عملاء نشطين',
    'inactive_customers': 'عملاء غير نشطين',
    
    // Product
    'add_product': 'إضافة منتج',
    'product_name': 'اسم المنتج',
    'product_code': 'رمز المنتج',
    'selling_price': 'سعر البيع',
    'cost_price': 'سعر التكلفة',
    'category': 'التصنيف',
    'stock': 'المخزون',
    'product_information': 'معلومات المنتج',
    'barcode': 'الباركود',
    'brand': 'العلامة التجارية',
    'unit': 'الوحدة',
    'product_description': 'وصف المنتج',
    'product_images': 'صور المنتج',
    'upload_image': 'رفع صورة',
    'uploading': 'جاري الرفع...',
    'no_images': 'لم يتم إضافة صور بعد',
    'main': 'رئيسية',
    'pricing_stock': 'التسعير والمخزون',
    'product_has_variants': 'المنتج لديه متغيرات',
    'variants_description': 'مثل الحجم واللون بأسعار مختلفة',
    'stock_quantity': 'الكمية المتوفرة',
    'min_stock_level': 'حد الطلب الأدنى',
    'variants_management': 'سيتم إدارة الأسعار والكميات من خلال المتغيرات بعد حفظ المنتج',
    'custom_fields': 'حقول مخصصة',
    'field_name': 'اسم الحقل',
    'field_value': 'القيمة',
    'product_active': 'المنتج نشط',
    'visible_in_list': 'يظهر في قائمة المنتجات',
    'save_product': 'حفظ المنتج',
    'edit_product': 'تعديل المنتج',
    'new_product': 'منتج جديد',
    'bulk_update': 'تحديث جماعي',
    'compare': 'مقارنة',
    'selected': 'محدد',
    
    // Expense
    'add_expense': 'إضافة مصروف',
    'expense_title': 'عنوان المصروف',
    'expense_category': 'تصنيف المصروف',
    
    // Settings
    'company_settings': 'إعدادات الشركة',
    'company_name': 'اسم الشركة',
    'company_logo': 'شعار الشركة',
    'vat_number': 'الرقم الضريبي',
    
    // Messages
    'no_data': 'لا توجد بيانات',
    'loading': 'جاري التحميل...',
    'success': 'تم بنجاح',
    'error': 'حدث خطأ',
    'saving': 'جاري الحفظ...',
    'confirm_delete': 'هل أنت متأكد من الحذف؟',
    'back': 'رجوع',
    'close': 'إغلاق',
  },
  en: {
    // Navigation
    'dashboard': 'Dashboard',
    'invoices': 'Invoices',
    'customers': 'Customers',
    'products': 'Products',
    'expenses': 'Expenses',
    'reports': 'Reports',
    'settings': 'Settings',
    'logout': 'Logout',
    
    // Common
    'add': 'Add',
    'edit': 'Edit',
    'delete': 'Delete',
    'save': 'Save',
    'cancel': 'Cancel',
    'search': 'Search',
    'filter': 'Filter',
    'export': 'Export',
    'print': 'Print',
    'view': 'View',
    'actions': 'Actions',
    'status': 'Status',
    'date': 'Date',
    'total': 'Total',
    'subtotal': 'Subtotal',
    'tax': 'Tax',
    'discount': 'Discount',
    'notes': 'Notes',
    'name': 'Name',
    'description': 'Description',
    'price': 'Price',
    'quantity': 'Quantity',
    'amount': 'Amount',
    
    // Invoice
    'invoice_number': 'Invoice Number',
    'customer_name': 'Customer Name',
    'due_date': 'Due Date',
    'payment_method': 'Payment Method',
    'add_invoice': 'Add Invoice',
    'create_invoice': 'Create Invoice',
    'invoice_details': 'Invoice Details',
    'invoice_items': 'Invoice Items',
    'invoice_information': 'Invoice Information',
    'search_customer': 'Search for customer',
    'search_by_name_phone': 'Search by name or phone...',
    'choose_customer': 'Choose customer',
    'choose_from_list': 'Choose from list',
    'new_customer': 'New Customer',
    'or_enter_name': 'Or enter name directly',
    'invoice_date': 'Invoice Date',
    'add_item': 'Add Item',
    'no_items': 'No items added yet',
    'search_product': 'Search for product',
    'search_by_name_code': 'Search by name, code or barcode...',
    'choose_product': 'Choose product',
    'available': 'available',
    'quantity_exceeds': 'Requested quantity exceeds available stock',
    'apply_vat': 'Apply VAT (15%)',
    'vat_enabled': 'VAT enabled',
    'vat_disabled': 'VAT disabled',
    'discount_sar': 'Discount (SAR)',
    'shipping_sar': 'Shipping (SAR)',
    'final_total': 'Final Total',
    'terms_notes': 'Terms & Additional Notes',
    'invoice_notes': 'Invoice Notes',
    'notes_placeholder': 'Example: Warranty, return policy, or bank account details',
    'notes_hint': '💡 These notes will appear at the bottom of the printed invoice',
    'send_email_customer': 'Send Email Copy to Customer',
    'email_sent_auto': 'Invoice summary will be sent to customer email automatically',
    'no_email_sent': 'No email will be sent',
    'email_hint': '💡 Make sure customer email is entered correctly',
    'save_finish': 'Save & Finish Invoice',
    'locked_invoice': 'Locked Invoice',
    'locked_message': 'This invoice is no longer a draft and amounts cannot be modified',
    'new_invoice': 'New Invoice',
    
    // Status
    'draft': 'Draft',
    'sent': 'Sent',
    'paid': 'Paid',
    'overdue': 'Overdue',
    'cancelled': 'Cancelled',
    
    // Payment Methods
    'cash': 'Cash',
    'bank_transfer': 'Bank Transfer',
    'credit_card': 'Credit Card',
    'other': 'Other',
    
    // Dashboard
    'welcome': 'Welcome',
    'monthly_sales': 'Monthly Sales',
    'total_sales': 'Total Sales',
    'taxes': 'Taxes',
    'recent_invoices': 'Recent Invoices',
    'profit_trend': 'Profit Trend',
    
    // Customer
    'add_customer': 'Add Customer',
    'customer_details': 'Customer Details',
    'phone': 'Phone',
    'email': 'Email',
    'address': 'Address',
    'tax_number': 'Tax Number',
    'customer_information': 'Customer Information',
    'phone_number': 'Phone Number',
    'save_customer': 'Save Customer',
    'edit_customer': 'Edit Customer',
    'all_customers': 'All Customers',
    'active_customers': 'Active Customers',
    'inactive_customers': 'Inactive Customers',
    
    // Product
    'add_product': 'Add Product',
    'product_name': 'Product Name',
    'product_code': 'Product Code',
    'selling_price': 'Selling Price',
    'cost_price': 'Cost Price',
    'category': 'Category',
    'stock': 'Stock',
    'product_information': 'Product Information',
    'barcode': 'Barcode',
    'brand': 'Brand',
    'unit': 'Unit',
    'product_description': 'Product Description',
    'product_images': 'Product Images',
    'upload_image': 'Upload Image',
    'uploading': 'Uploading...',
    'no_images': 'No images added yet',
    'main': 'Main',
    'pricing_stock': 'Pricing & Stock',
    'product_has_variants': 'Product has variants',
    'variants_description': 'Like size and color with different prices',
    'stock_quantity': 'Stock Quantity',
    'min_stock_level': 'Minimum Stock Level',
    'variants_management': 'Prices and quantities will be managed through variants after saving',
    'custom_fields': 'Custom Fields',
    'field_name': 'Field name',
    'field_value': 'Value',
    'product_active': 'Product Active',
    'visible_in_list': 'Visible in product list',
    'save_product': 'Save Product',
    'edit_product': 'Edit Product',
    'new_product': 'New Product',
    'bulk_update': 'Bulk Update',
    'compare': 'Compare',
    'selected': 'selected',
    
    // Expense
    'add_expense': 'Add Expense',
    'expense_title': 'Expense Title',
    'expense_category': 'Expense Category',
    
    // Settings
    'company_settings': 'Company Settings',
    'company_name': 'Company Name',
    'company_logo': 'Company Logo',
    'vat_number': 'VAT Number',
    
    // Expense Categories
    'rent': 'Rent',
    'utilities': 'Utilities',
    'salaries': 'Salaries',
    'supplies': 'Supplies',
    'marketing': 'Marketing',
    'maintenance': 'Maintenance',
    'transportation': 'Transportation',
    
    // Messages
    'no_data': 'No data available',
    'loading': 'Loading...',
    'success': 'Success',
    'error': 'Error occurred',
    'saving': 'Saving...',
    'confirm_delete': 'Are you sure you want to delete?',
    'back': 'Back',
    'close': 'Close',
  }
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ar');

  useEffect(() => {
    const saved = localStorage.getItem('app_language');
    if (saved) {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app_language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage, isRTL: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
};