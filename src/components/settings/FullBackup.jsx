import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wadaq } from "@/api/WadaqCore";
import { Download, Database, FileJson, FileSpreadsheet, Loader2, Package } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import * as XLSX from "xlsx";
import JSZip from "jszip";

export default function FullBackup() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const exportToJSON = async () => {
    setLoading(true);
    try {
      // Fetch all data
      const [customers, products, invoices, expenses, quotations] = await Promise.all([
        Wadaq.entities.Customer.list(),
        Wadaq.entities.Product.list(),
        Wadaq.entities.Invoice.list(),
        Wadaq.entities.Expense.list(),
        Wadaq.entities.Quotation.list()
      ]);

      const backup = {
        metadata: {
          app: "المحاسب الذكي - Smart Accountant",
          backup_date: new Date().toISOString(),
          version: "1.0"
        },
        data: {
          customers,
          products,
          invoices,
          expenses,
          quotations
        }
      };

      // Create download
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup failed:", error);
      alert(language === 'ar' ? 'فشل إنشاء النسخة الاحتياطية' : 'Backup failed');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    setLoading(true);
    try {
      // Fetch all data
      const [customers, products, invoices, expenses, quotations] = await Promise.all([
        Wadaq.entities.Customer.list(),
        Wadaq.entities.Product.list(),
        Wadaq.entities.Invoice.list(),
        Wadaq.entities.Expense.list(),
        Wadaq.entities.Quotation.list()
      ]);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add sheets
      const customersSheet = XLSX.utils.json_to_sheet(customers);
      XLSX.utils.book_append_sheet(wb, customersSheet, "Customers");

      const productsSheet = XLSX.utils.json_to_sheet(products);
      XLSX.utils.book_append_sheet(wb, productsSheet, "Products");

      const invoicesSheet = XLSX.utils.json_to_sheet(invoices.map(inv => ({
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_name,
        date: inv.date,
        total: inv.total,
        status: inv.status,
        payment_method: inv.payment_method
      })));
      XLSX.utils.book_append_sheet(wb, invoicesSheet, "Invoices");

      const expensesSheet = XLSX.utils.json_to_sheet(expenses);
      XLSX.utils.book_append_sheet(wb, expensesSheet, "Expenses");

      const quotationsSheet = XLSX.utils.json_to_sheet(quotations);
      XLSX.utils.book_append_sheet(wb, quotationsSheet, "Quotations");

      // Download
      XLSX.writeFile(wb, `backup-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Backup failed:", error);
      alert(language === 'ar' ? 'فشل إنشاء النسخة الاحتياطية' : 'Backup failed');
    } finally {
      setLoading(false);
    }
  };

  const exportFullSystemZip = async () => {
    setLoading(true);
    try {
      // Fetch ALL data from all entities
      const [
        customers, 
        products, 
        invoices, 
        expenses, 
        quotations,
        creditNotes,
        recurringInvoices,
        productBatches,
        productVariants,
        productReviews,
        stockMovements,
        notifications,
        founderSubscriptions
      ] = await Promise.all([
        Wadaq.entities.Customer.list().catch(() => []),
        Wadaq.entities.Product.list().catch(() => []),
        Wadaq.entities.Invoice.list().catch(() => []),
        Wadaq.entities.Expense.list().catch(() => []),
        Wadaq.entities.Quotation.list().catch(() => []),
        Wadaq.entities.CreditNote.list().catch(() => []),
        Wadaq.entities.RecurringInvoice.list().catch(() => []),
        Wadaq.entities.ProductBatch.list().catch(() => []),
        Wadaq.entities.ProductVariant.list().catch(() => []),
        Wadaq.entities.ProductReview.list().catch(() => []),
        Wadaq.entities.StockMovement.list().catch(() => []),
        Wadaq.entities.Notification.list().catch(() => []),
        Wadaq.entities.FounderSubscription.list().catch(() => [])
      ]);

      const allData = {
        metadata: {
          app: "المحاسب الذكي - Smart Accountant by Rikaz Foundation",
          backup_date: new Date().toISOString(),
          version: "2.0",
          total_records: {
            customers: customers.length,
            products: products.length,
            invoices: invoices.length,
            expenses: expenses.length,
            quotations: quotations.length,
            credit_notes: creditNotes.length,
            recurring_invoices: recurringInvoices.length,
            product_batches: productBatches.length,
            product_variants: productVariants.length,
            product_reviews: productReviews.length,
            stock_movements: stockMovements.length,
            notifications: notifications.length,
            founder_subscriptions: founderSubscriptions.length
          }
        },
        data: {
          customers,
          products,
          invoices,
          expenses,
          quotations,
          credit_notes: creditNotes,
          recurring_invoices: recurringInvoices,
          product_batches: productBatches,
          product_variants: productVariants,
          product_reviews: productReviews,
          stock_movements: stockMovements,
          notifications,
          founder_subscriptions: founderSubscriptions
        }
      };

      // Create ZIP file
      const zip = new JSZip();

      // Add JSON file
      zip.file("full-backup.json", JSON.stringify(allData, null, 2));

      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      
      if (customers.length) {
        const sheet = XLSX.utils.json_to_sheet(customers);
        XLSX.utils.book_append_sheet(wb, sheet, "Customers");
      }
      
      if (products.length) {
        const sheet = XLSX.utils.json_to_sheet(products);
        XLSX.utils.book_append_sheet(wb, sheet, "Products");
      }
      
      if (invoices.length) {
        const sheet = XLSX.utils.json_to_sheet(invoices);
        XLSX.utils.book_append_sheet(wb, sheet, "Invoices");
      }
      
      if (expenses.length) {
        const sheet = XLSX.utils.json_to_sheet(expenses);
        XLSX.utils.book_append_sheet(wb, sheet, "Expenses");
      }
      
      if (quotations.length) {
        const sheet = XLSX.utils.json_to_sheet(quotations);
        XLSX.utils.book_append_sheet(wb, sheet, "Quotations");
      }
      
      if (creditNotes.length) {
        const sheet = XLSX.utils.json_to_sheet(creditNotes);
        XLSX.utils.book_append_sheet(wb, sheet, "CreditNotes");
      }
      
      if (recurringInvoices.length) {
        const sheet = XLSX.utils.json_to_sheet(recurringInvoices);
        XLSX.utils.book_append_sheet(wb, sheet, "RecurringInvoices");
      }
      
      if (productBatches.length) {
        const sheet = XLSX.utils.json_to_sheet(productBatches);
        XLSX.utils.book_append_sheet(wb, sheet, "ProductBatches");
      }
      
      if (productVariants.length) {
        const sheet = XLSX.utils.json_to_sheet(productVariants);
        XLSX.utils.book_append_sheet(wb, sheet, "ProductVariants");
      }
      
      if (productReviews.length) {
        const sheet = XLSX.utils.json_to_sheet(productReviews);
        XLSX.utils.book_append_sheet(wb, sheet, "ProductReviews");
      }
      
      if (stockMovements.length) {
        const sheet = XLSX.utils.json_to_sheet(stockMovements);
        XLSX.utils.book_append_sheet(wb, sheet, "StockMovements");
      }
      
      if (notifications.length) {
        const sheet = XLSX.utils.json_to_sheet(notifications);
        XLSX.utils.book_append_sheet(wb, sheet, "Notifications");
      }
      
      if (founderSubscriptions.length) {
        const sheet = XLSX.utils.json_to_sheet(founderSubscriptions);
        XLSX.utils.book_append_sheet(wb, sheet, "FounderSubscriptions");
      }

      // Convert Excel to binary
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file("full-backup.xlsx", excelBuffer);

      // Add README
      const readme = language === 'ar' 
        ? `النسخة الاحتياطية الشاملة - المحاسب الذكي
        
تاريخ النسخة: ${new Date().toLocaleString('ar-SA')}

المحتويات:
- full-backup.json: جميع البيانات بصيغة JSON
- full-backup.xlsx: جميع البيانات بصيغة Excel

إحصائيات:
- العملاء: ${customers.length}
- المنتجات: ${products.length}
- الفواتير: ${invoices.length}
- المصروفات: ${expenses.length}
- عروض الأسعار: ${quotations.length}
- الإشعارات الدائنة: ${creditNotes.length}
- الفواتير المتكررة: ${recurringInvoices.length}
- دفعات المنتجات: ${productBatches.length}
- متغيرات المنتجات: ${productVariants.length}
- تقييمات المنتجات: ${productReviews.length}
- حركات المخزون: ${stockMovements.length}
- الإشعارات: ${notifications.length}
- اشتراكات المؤسسين: ${founderSubscriptions.length}

احتفظ بهذه النسخة في مكان آمن!
`
        : `Full System Backup - Smart Accountant

Backup Date: ${new Date().toLocaleString('en-US')}

Contents:
- full-backup.json: All data in JSON format
- full-backup.xlsx: All data in Excel format

Statistics:
- Customers: ${customers.length}
- Products: ${products.length}
- Invoices: ${invoices.length}
- Expenses: ${expenses.length}
- Quotations: ${quotations.length}
- Credit Notes: ${creditNotes.length}
- Recurring Invoices: ${recurringInvoices.length}
- Product Batches: ${productBatches.length}
- Product Variants: ${productVariants.length}
- Product Reviews: ${productReviews.length}
- Stock Movements: ${stockMovements.length}
- Notifications: ${notifications.length}
- Founder Subscriptions: ${founderSubscriptions.length}

Keep this backup in a safe place!
`;

      zip.file("README.txt", readme);

      // Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `full-system-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(language === 'ar' 
        ? '✅ تم تصدير النسخة الاحتياطية الشاملة بنجاح!' 
        : '✅ Full system backup exported successfully!');
    } catch (error) {
      console.error("Full backup failed:", error);
      alert(language === 'ar' ? '❌ فشل إنشاء النسخة الاحتياطية الشاملة' : '❌ Full backup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-blue-400/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          {language === 'ar' ? 'النسخ الاحتياطي الشامل' : 'Full Backup'}
        </CardTitle>
        <CardDescription className="text-slate-300">
          {language === 'ar' 
            ? 'احفظ نسخة احتياطية كاملة من جميع بياناتك (العملاء، المنتجات، الفواتير، المصروفات، عروض الأسعار)'
            : 'Save a complete backup of all your data (customers, products, invoices, expenses, quotations)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Full System Export Button */}
        <Button
          onClick={exportFullSystemZip}
          disabled={loading}
          className="w-full h-16 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-700 hover:via-pink-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
              <span className="text-lg font-bold">
                {language === 'ar' ? 'جاري التصدير...' : 'Exporting...'}
              </span>
            </>
          ) : (
            <>
              <Package className="w-6 h-6 mr-3" />
              <span className="text-lg font-bold">
                {language === 'ar' ? 'تصدير النسخة الاحتياطية الشاملة' : 'Export Full System Backup'}
              </span>
            </>
          )}
        </Button>

        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-lg">
          <p className="text-sm text-slate-200 font-semibold mb-2">
            {language === 'ar' ? '📦 النسخة الاحتياطية الشاملة تتضمن:' : '📦 Full backup includes:'}
          </p>
          <ul className="text-xs text-slate-300 space-y-1 mr-4">
            <li>• {language === 'ar' ? 'جميع جداول قاعدة البيانات (13 جدول)' : 'All database tables (13 tables)'}</li>
            <li>• {language === 'ar' ? 'ملف JSON شامل' : 'Comprehensive JSON file'}</li>
            <li>• {language === 'ar' ? 'ملف Excel متعدد الصفحات' : 'Multi-sheet Excel file'}</li>
            <li>• {language === 'ar' ? 'ملف README بالإحصائيات' : 'README file with statistics'}</li>
          </ul>
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-slate-400 mb-3">
            {language === 'ar' ? 'أو قم بالتصدير بصيغة واحدة:' : 'Or export in single format:'}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              onClick={exportToJSON}
              disabled={loading}
              variant="outline"
              className="w-full border-blue-500/30 hover:bg-blue-500/10"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="w-4 h-4 mr-2" />
              )}
              {language === 'ar' ? 'JSON فقط' : 'JSON Only'}
            </Button>

            <Button
              onClick={exportToExcel}
              disabled={loading}
              variant="outline"
              className="w-full border-green-500/30 hover:bg-green-500/10"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              )}
              {language === 'ar' ? 'Excel فقط' : 'Excel Only'}
            </Button>
          </div>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
          <p className="text-sm text-slate-300">
            {language === 'ar' 
              ? '💡 يتم حفظ الملف مباشرة على جهازك. احتفظ بهذه النسخة في مكان آمن.'
              : '💡 The file is saved directly to your device. Keep this backup in a safe place.'}
          </p>
        </div>

        <div className="pt-4 border-t border-white/10">
          <h4 className="font-semibold text-white mb-2">
            {language === 'ar' ? 'نسخ احتياطي للأكواد والتصميم:' : 'Code & Design Backup:'}
          </h4>
          <p className="text-sm text-slate-300 mb-3">
            {language === 'ar' 
              ? 'لتحميل ملفات التصميم (CSS/HTML/JSX)، اذهب إلى:'
              : 'To download design files (CSS/HTML/JSX), go to:'}
          </p>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <code className="text-sm text-blue-400">
              Dashboard → Code → {language === 'ar' ? 'تحميل الملفات' : 'Download Files'}
            </code>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {language === 'ar' 
              ? 'يمكنك تحميل جميع ملفات المشروع من لوحة التحكم'
              : 'You can download all project files from the dashboard'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}