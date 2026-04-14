import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Loader2, FileText, Mail } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Wadaq } from "@/api/WadaqCore";

export default function ExportButtons({ invoices, expenses, period }) {
  const [isExporting, setIsExporting] = useState(false);
  const { language } = useLanguage();

  const exportSalesReport = () => {
    setIsExporting(true);
    try {
      // Prepare sales data
      const salesData = invoices.map(inv => ({
        [language === 'ar' ? "رقم الفاتورة" : "Invoice Number"]: inv.invoice_number,
        [language === 'ar' ? "التاريخ" : "Date"]: inv.date ? format(new Date(inv.date), "yyyy-MM-dd") : "",
        [language === 'ar' ? "العميل" : "Customer"]: inv.customer_name,
        [language === 'ar' ? "الحالة" : "Status"]: getStatusLabel(inv.status),
        [language === 'ar' ? "المجموع الفرعي" : "Subtotal"]: inv.subtotal || 0,
        [language === 'ar' ? "الضريبة" : "Tax"]: inv.tax_amount || 0,
        [language === 'ar' ? "الخصم" : "Discount"]: inv.discount || 0,
        [language === 'ar' ? "الشحن" : "Shipping"]: inv.shipping_cost || 0,
        [language === 'ar' ? "الإجمالي" : "Total"]: inv.total || 0,
      }));

      // Calculate summary
      const totalSales = invoices
        .filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      const pendingSales = invoices
        .filter(inv => inv.status === "sent" || inv.status === "draft")
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      const summary = [
        { [language === 'ar' ? "البيان" : "Item"]: language === 'ar' ? "إجمالي المبيعات المدفوعة" : "Total Paid Sales", [language === 'ar' ? "المبلغ" : "Amount"]: totalSales },
        { [language === 'ar' ? "البيان" : "Item"]: language === 'ar' ? "المبيعات المعلقة" : "Pending Sales", [language === 'ar' ? "المبلغ" : "Amount"]: pendingSales },
        { [language === 'ar' ? "البيان" : "Item"]: language === 'ar' ? "عدد الفواتير" : "Number of Invoices", [language === 'ar' ? "المبلغ" : "Amount"]: invoices.length },
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add summary sheet
      const summarySheet = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, summarySheet, language === 'ar' ? "الملخص" : "Summary");
      
      // Add details sheet
      const detailsSheet = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, detailsSheet, language === 'ar' ? "التفاصيل" : "Details");

      // Export
      const periodLabel = getPeriodLabel(period);
      const fileName = language === 'ar' 
        ? `تقرير_المبيعات_${periodLabel}_${format(new Date(), "yyyy-MM-dd")}.xlsx`
        : `Sales_Report_${periodLabel}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting sales report:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportExpensesReport = () => {
    setIsExporting(true);
    try {
      // Prepare expenses data
      const expensesData = expenses.map(exp => ({
        [language === 'ar' ? "التاريخ" : "Date"]: exp.date ? format(new Date(exp.date), "yyyy-MM-dd") : "",
        [language === 'ar' ? "العنوان" : "Title"]: exp.title,
        [language === 'ar' ? "التصنيف" : "Category"]: getCategoryLabel(exp.category),
        [language === 'ar' ? "المبلغ" : "Amount"]: exp.amount || 0,
        [language === 'ar' ? "طريقة الدفع" : "Payment Method"]: getPaymentLabel(exp.payment_method),
        [language === 'ar' ? "رقم المرجع" : "Reference"]: exp.reference || "",
        [language === 'ar' ? "ملاحظات" : "Notes"]: exp.notes || "",
      }));

      // Calculate summary by category
      const expensesByCategory = expenses.reduce((acc, exp) => {
        const cat = getCategoryLabel(exp.category);
        acc[cat] = (acc[cat] || 0) + (exp.amount || 0);
        return acc;
      }, {});

      const categorySummary = Object.entries(expensesByCategory).map(([category, amount]) => ({
        [language === 'ar' ? "التصنيف" : "Category"]: category,
        [language === 'ar' ? "المبلغ" : "Amount"]: amount,
      }));

      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      categorySummary.push({ 
        [language === 'ar' ? "التصنيف" : "Category"]: language === 'ar' ? "الإجمالي" : "Total", 
        [language === 'ar' ? "المبلغ" : "Amount"]: totalExpenses 
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add summary sheet
      const summarySheet = XLSX.utils.json_to_sheet(categorySummary);
      XLSX.utils.book_append_sheet(wb, summarySheet, language === 'ar' ? "الملخص" : "Summary");
      
      // Add details sheet
      const detailsSheet = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, detailsSheet, language === 'ar' ? "التفاصيل" : "Details");

      // Export
      const periodLabel = getPeriodLabel(period);
      const fileName = language === 'ar'
        ? `تقرير_المصروفات_${periodLabel}_${format(new Date(), "yyyy-MM-dd")}.xlsx`
        : `Expenses_Report_${periodLabel}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting expenses report:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportFullReport = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Summary
      const totalSales = invoices
        .filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const netProfit = totalSales - totalExpenses;

      const summary = [
        { [language === 'ar' ? "البيان" : "Item"]: language === 'ar' ? "إجمالي المبيعات" : "Total Sales", [language === 'ar' ? "المبلغ" : "Amount"]: totalSales },
        { [language === 'ar' ? "البيان" : "Item"]: language === 'ar' ? "إجمالي المصروفات" : "Total Expenses", [language === 'ar' ? "المبلغ" : "Amount"]: totalExpenses },
        { [language === 'ar' ? "البيان" : "Item"]: language === 'ar' ? "صافي الربح" : "Net Profit", [language === 'ar' ? "المبلغ" : "Amount"]: netProfit },
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, summarySheet, language === 'ar' ? "الملخص" : "Summary");

      // Sales
      const salesData = invoices.map(inv => ({
        [language === 'ar' ? "رقم الفاتورة" : "Invoice Number"]: inv.invoice_number,
        [language === 'ar' ? "التاريخ" : "Date"]: inv.date ? format(new Date(inv.date), "yyyy-MM-dd") : "",
        [language === 'ar' ? "العميل" : "Customer"]: inv.customer_name,
        [language === 'ar' ? "الإجمالي" : "Total"]: inv.total || 0,
      }));
      const salesSheet = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, salesSheet, language === 'ar' ? "المبيعات" : "Sales");

      // Expenses
      const expensesData = expenses.map(exp => ({
        [language === 'ar' ? "التاريخ" : "Date"]: exp.date ? format(new Date(exp.date), "yyyy-MM-dd") : "",
        [language === 'ar' ? "العنوان" : "Title"]: exp.title,
        [language === 'ar' ? "التصنيف" : "Category"]: getCategoryLabel(exp.category),
        [language === 'ar' ? "المبلغ" : "Amount"]: exp.amount || 0,
      }));
      const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, expensesSheet, language === 'ar' ? "المصروفات" : "Expenses");

      const periodLabel = getPeriodLabel(period);
      const fileName = language === 'ar'
        ? `التقرير_الشامل_${periodLabel}_${format(new Date(), "yyyy-MM-dd")}.xlsx`
        : `Full_Report_${periodLabel}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting full report:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusLabel = (status) => {
    const mapAr = {
      draft: "مسودة",
      sent: "مرسلة",
      paid: "مدفوعة",
      overdue: "متأخرة",
      cancelled: "ملغية",
    };
    const mapEn = {
      draft: "Draft",
      sent: "Sent",
      paid: "Paid",
      overdue: "Overdue",
      cancelled: "Cancelled",
    };
    return language === 'ar' ? (mapAr[status] || status) : (mapEn[status] || status);
  };

  const getCategoryLabel = (category) => {
    const mapAr = {
      rent: "إيجار",
      utilities: "خدمات عامة",
      salaries: "رواتب",
      supplies: "مستلزمات",
      marketing: "تسويق",
      maintenance: "صيانة",
      transportation: "نقل ومواصلات",
      other: "أخرى",
    };
    const mapEn = {
      rent: "Rent",
      utilities: "Utilities",
      salaries: "Salaries",
      supplies: "Supplies",
      marketing: "Marketing",
      maintenance: "Maintenance",
      transportation: "Transportation",
      other: "Other",
    };
    return language === 'ar' ? (mapAr[category] || category) : (mapEn[category] || category);
  };

  const getPaymentLabel = (method) => {
    const mapAr = {
      cash: "نقداً",
      bank_transfer: "تحويل بنكي",
      credit_card: "بطاقة ائتمان",
      other: "أخرى",
    };
    const mapEn = {
      cash: "Cash",
      bank_transfer: "Bank Transfer",
      credit_card: "Credit Card",
      other: "Other",
    };
    return language === 'ar' ? (mapAr[method] || method) : (mapEn[method] || method);
  };

  const getPeriodLabel = (period) => {
    const mapAr = {
      month: "شهري",
      quarter: "ربع_سنوي",
      year: "سنوي",
      day: "يومي",
      week: "أسبوعي",
      custom: "مخصص",
    };
    const mapEn = {
      month: "Monthly",
      quarter: "Quarterly",
      year: "Yearly",
      day: "Daily",
      week: "Weekly",
      custom: "Custom",
    };
    return language === 'ar' ? (mapAr[period] || period) : (mapEn[period] || period);
  };

  const exportPDFReport = async () => {
    setIsExporting(true);
    try {
      const totalSales = invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const netProfit = totalSales - totalExpenses;
      const isAr = language === 'ar';

      // Build an HTML element and render it to canvas for Arabic support
      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed; left: -9999px; top: 0;
        width: 794px; padding: 40px;
        background: white; font-family: 'Tajawal', 'Cairo', Arial, sans-serif;
        direction: ${isAr ? 'rtl' : 'ltr'}; color: #1e293b;
      `;

      container.innerHTML = `
        <div style="text-align:center; margin-bottom:30px; border-bottom:3px solid #6d28d9; padding-bottom:20px;">
          <h1 style="font-size:28px; font-weight:700; color:#6d28d9; margin:0;">
            ${isAr ? 'التقرير المالي الشامل' : 'Financial Report'}
          </h1>
          <p style="color:#64748b; margin-top:8px; font-size:14px;">${format(new Date(), 'yyyy-MM-dd')}</p>
        </div>

        <h2 style="font-size:18px; color:#1e40af; margin-bottom:12px;">${isAr ? 'الملخص المالي' : 'Financial Summary'}</h2>
        <table style="width:100%; border-collapse:collapse; margin-bottom:30px; font-size:14px;">
          <tr style="background:#f0fdf4;">
            <td style="padding:12px 16px; border:1px solid #e2e8f0; font-weight:bold;">${isAr ? 'إجمالي المبيعات المدفوعة' : 'Total Paid Sales'}</td>
            <td style="padding:12px 16px; border:1px solid #e2e8f0; font-weight:bold; color:#047857;">${totalSales.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}</td>
          </tr>
          <tr style="background:#fef2f2;">
            <td style="padding:12px 16px; border:1px solid #e2e8f0; font-weight:bold;">${isAr ? 'إجمالي المصروفات' : 'Total Expenses'}</td>
            <td style="padding:12px 16px; border:1px solid #e2e8f0; font-weight:bold; color:#dc2626;">${totalExpenses.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}</td>
          </tr>
          <tr style="background:${netProfit >= 0 ? '#dbeafe' : '#fee2e2'};">
            <td style="padding:12px 16px; border:1px solid #e2e8f0; font-weight:bold;">${isAr ? 'صافي الربح' : 'Net Profit'}</td>
            <td style="padding:12px 16px; border:1px solid #e2e8f0; font-weight:bold; color:${netProfit >= 0 ? '#047857' : '#dc2626'}; font-size:16px;">
              ${netProfit.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}
            </td>
          </tr>
        </table>

        <div style="display:flex; gap:20px; margin-bottom:30px;">
          <div style="flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
            <h3 style="font-size:15px; color:#1e40af; margin:0 0 10px 0;">${isAr ? 'المبيعات' : 'Sales'}</h3>
            <p style="margin:4px 0; font-size:13px;">${isAr ? 'عدد الفواتير' : 'Number of Invoices'}: <strong>${invoices.length}</strong></p>
            <p style="margin:4px 0; font-size:13px;">${isAr ? 'المبيعات المدفوعة' : 'Paid'}: <strong>${totalSales.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}</strong></p>
          </div>
          <div style="flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
            <h3 style="font-size:15px; color:#dc2626; margin:0 0 10px 0;">${isAr ? 'المصروفات' : 'Expenses'}</h3>
            <p style="margin:4px 0; font-size:13px;">${isAr ? 'عدد المصروفات' : 'Number of Expenses'}: <strong>${expenses.length}</strong></p>
            <p style="margin:4px 0; font-size:13px;">${isAr ? 'الإجمالي' : 'Total'}: <strong>${totalExpenses.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}</strong></p>
          </div>
        </div>

        <div style="margin-top:40px; padding-top:16px; border-top:1px solid #e2e8f0; text-align:center; color:#94a3b8; font-size:12px;">
          ${isAr ? 'تم إنشاؤه بواسطة نظام المحاسب الذكي | rikazai.com' : 'Generated by Smart Accountant | rikazai.com'}
        </div>
      `;

      document.body.appendChild(container);
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const periodLabel = getPeriodLabel(period);
      const fileName = isAr
        ? `التقرير_المالي_${periodLabel}_${format(new Date(), "yyyy-MM-dd")}.pdf`
        : `Financial_Report_${periodLabel}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error exporting PDF report:", error);
      alert(language === 'ar' ? 'حدث خطأ أثناء تصدير التقرير' : 'Error exporting report');
    } finally {
      setIsExporting(false);
    }
  };

  const emailReport = async () => {
    setIsExporting(true);
    try {
      const user = await Wadaq.auth.me();
      if (!user?.email) {
        alert(language === 'ar' ? 'لم يتم العثور على البريد الإلكتروني' : 'Email not found');
        return;
      }

      const totalSales = invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const netProfit = totalSales - totalExpenses;

      const emailBody = language === 'ar' ? `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">التقرير المالي</h2>
            <p style="color: #666;">التاريخ: ${format(new Date(), 'yyyy-MM-dd')}</p>
            
            <div style="margin: 30px 0;">
              <h3 style="color: #047857; margin-bottom: 15px;">الملخص المالي</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f0fdf4;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">إجمالي المبيعات</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: left;">${totalSales.toLocaleString()} ر.س</td>
                </tr>
                <tr style="background: #fef2f2;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">إجمالي المصروفات</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: left;">${totalExpenses.toLocaleString()} ر.س</td>
                </tr>
                <tr style="background: ${netProfit >= 0 ? '#dbeafe' : '#fee2e2'};">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">صافي الربح</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: left; color: ${netProfit >= 0 ? '#047857' : '#dc2626'}; font-weight: bold;">${netProfit.toLocaleString()} ر.س</td>
                </tr>
              </table>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #1e40af; margin-bottom: 15px;">تفاصيل إضافية</h3>
              <p>عدد الفواتير: <strong>${invoices.length}</strong></p>
              <p>عدد المصروفات: <strong>${expenses.length}</strong></p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center;">
              <p>هذا التقرير تم إنشاؤه تلقائياً من نظام المحاسب الذكي</p>
              <p>rikazai.com | support@rikazai.com</p>
            </div>
          </div>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">Financial Report</h2>
            <p style="color: #666;">Date: ${format(new Date(), 'yyyy-MM-dd')}</p>
            
            <div style="margin: 30px 0;">
              <h3 style="color: #047857; margin-bottom: 15px;">Financial Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f0fdf4;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Total Sales</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${totalSales.toLocaleString()} SAR</td>
                </tr>
                <tr style="background: #fef2f2;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Total Expenses</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${totalExpenses.toLocaleString()} SAR</td>
                </tr>
                <tr style="background: ${netProfit >= 0 ? '#dbeafe' : '#fee2e2'};">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Net Profit</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: ${netProfit >= 0 ? '#047857' : '#dc2626'}; font-weight: bold;">${netProfit.toLocaleString()} SAR</td>
                </tr>
              </table>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #1e40af; margin-bottom: 15px;">Additional Details</h3>
              <p>Number of Invoices: <strong>${invoices.length}</strong></p>
              <p>Number of Expenses: <strong>${expenses.length}</strong></p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center;">
              <p>This report was automatically generated by Smart Accountant</p>
              <p>rikazai.com | support@rikazai.com</p>
            </div>
          </div>
        </div>
      `;

      await Wadaq.integrations.Core.SendEmail({
        to: user.email,
        subject: language === 'ar' ? 'التقرير المالي' : 'Financial Report',
        body: emailBody
      });

      alert(language === 'ar' ? '✓ تم إرسال التقرير إلى بريدك الإلكتروني' : '✓ Report sent to your email');
    } catch (error) {
      console.error("Error emailing report:", error);
      alert(language === 'ar' ? 'حدث خطأ أثناء إرسال التقرير' : 'Error sending report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        onClick={exportSalesReport} 
        disabled={isExporting || invoices.length === 0}
        variant="outline"
        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 ml-2" />
        )}
        {language === 'ar' ? 'Excel - المبيعات' : 'Sales Excel'}
      </Button>

      <Button 
        onClick={exportExpensesReport} 
        disabled={isExporting || expenses.length === 0}
        variant="outline"
        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 ml-2" />
        )}
        {language === 'ar' ? 'Excel - المصروفات' : 'Expenses Excel'}
      </Button>

      <Button 
        onClick={exportFullReport} 
        disabled={isExporting || (invoices.length === 0 && expenses.length === 0)}
        variant="outline"
        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 ml-2" />
        )}
        {language === 'ar' ? 'Excel - شامل' : 'Full Excel'}
      </Button>

      <Button 
        onClick={exportPDFReport} 
        disabled={isExporting || (invoices.length === 0 && expenses.length === 0)}
        variant="outline"
        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 ml-2" />
        )}
        {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
      </Button>

      <Button 
        onClick={emailReport} 
        disabled={isExporting || (invoices.length === 0 && expenses.length === 0)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <Mail className="w-4 h-4 ml-2" />
        )}
        {language === 'ar' ? 'إرسال بالإيميل' : 'Email Report'}
      </Button>
    </div>
  );
}