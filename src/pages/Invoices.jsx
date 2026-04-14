import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import InvoiceView from "@/components/invoices/InvoiceView";
import InvoicesList from "@/components/invoices/InvoicesList";
import PostSaveModal from "@/components/invoices/PostSaveModal";
import { useLanguage } from "@/components/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import Swal from "sweetalert2";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import { toast } from "@/components/ui/use-toast";

function buildInvoiceHTML(invoice, companyInfo, isAr) {
  const pc = "#2563eb";
  const fmt = (n) =>
    (n || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const statusMap = {
    draft: isAr ? "مسودة" : "Draft",
    sent: isAr ? "مرسلة" : "Sent",
    paid: isAr ? "مدفوعة" : "Paid",
    overdue: isAr ? "متأخرة" : "Overdue",
    cancelled: isAr ? "ملغية" : "Cancelled",
  };
  const statusColors = {
    draft: "#94a3b8",
    sent: "#3b82f6",
    paid: "#10b981",
    overdue: "#ef4444",
    cancelled: "#6b7280",
  };
  const paymentMap = {
    cash: isAr ? "نقداً" : "Cash",
    bank_transfer: isAr ? "تحويل بنكي" : "Bank Transfer",
    credit_card: isAr ? "بطاقة" : "Card",
    other: isAr ? "أخرى" : "Other",
  };

  const itemRows = (invoice.items || [])
    .map(
      (item, i) =>
        '<tr style="background:' +
        (i % 2 === 0 ? "#fff" : "#eff6ff") +
        '">' +
        '<td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;">' +
        (item.product_name || item.name || "") +
        "</td>" +
        '<td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center;">' +
        item.quantity +
        "</td>" +
        '<td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center;" dir="ltr">' +
        fmt(item.price) +
        "</td>" +
        '<td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center;font-weight:700;" dir="ltr">' +
        fmt(item.total) +
        "</td>" +
        "</tr>"
    )
    .join("");

  const logoHtml = companyInfo && companyInfo.logo
    ? '<img src="' + companyInfo.logo + '" style="height:65px;max-width:180px;object-fit:contain;display:block;margin-bottom:6px;"/>'
    : "";
  const nameHtml = companyInfo && companyInfo.name
    ? '<div style="font-size:16px;font-weight:800;">' + companyInfo.name + "</div>"
    : "";
  const vatHtml = companyInfo && companyInfo.vat_number
    ? '<div style="font-size:11px;color:#64748b;">' + (isAr ? "الرقم الضريبي:" : "VAT:") + " " + companyInfo.vat_number + "</div>"
    : "";
  const crHtml = companyInfo && companyInfo.commercial_registration
    ? '<div style="font-size:11px;color:#64748b;">' + (isAr ? "السجل التجاري:" : "CR:") + " " + companyInfo.commercial_registration + "</div>"
    : "";
  const addrHtml = companyInfo && companyInfo.address
    ? '<div style="font-size:11px;color:#64748b;">' + companyInfo.address + "</div>"
    : "";
  const phoneHtml = companyInfo && companyInfo.phone
    ? '<div style="font-size:11px;color:#64748b;">' + companyInfo.phone + "</div>"
    : "";
  const emailHtml = companyInfo && companyInfo.email
    ? '<div style="font-size:11px;color:#64748b;">' + companyInfo.email + "</div>"
    : "";

  const counterRow = invoice.invoice_counter_number
    ? "<tr><td style=\"color:#94a3b8;padding:2px 8px;\">" + (isAr ? "الرقم التسلسلي:" : "Counter:") + "</td><td style=\"font-weight:700;\" dir=\"ltr\">" + invoice.invoice_counter_number + "</td></tr>"
    : "";
  const timeRow = invoice.time
    ? "<tr><td style=\"color:#94a3b8;padding:2px 8px;\">" + (isAr ? "الوقت:" : "Time:") + "</td><td style=\"font-weight:700;\" dir=\"ltr\">" + invoice.time + "</td></tr>"
    : "";
  const dueRow = invoice.due_date
    ? "<tr><td style=\"color:#94a3b8;padding:2px 8px;\">" + (isAr ? "الاستحقاق:" : "Due:") + "</td><td style=\"font-weight:700;\" dir=\"ltr\">" + invoice.due_date + "</td></tr>"
    : "";

  const custVatHtml = invoice.customer_vat_number
    ? '<div style="font-size:11px;color:#64748b;">' + (isAr ? "الرقم الضريبي:" : "VAT:") + " " + invoice.customer_vat_number + "</div>"
    : "";
  const custAddrHtml = invoice.customer_address
    ? '<div style="font-size:11px;color:#64748b;">' + invoice.customer_address + "</div>"
    : "";

  const paymentHtml = invoice.payment_method
    ? '<div style="text-align:left;">' +
      '<div style="font-size:10px;font-weight:800;color:' + pc + ';text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">' + (isAr ? "طريقة الدفع" : "PAYMENT") + "</div>" +
      '<div style="font-size:14px;font-weight:700;color:#334155;">' + (paymentMap[invoice.payment_method] || "") + "</div>" +
      "</div>"
    : "";

  const vatRow = invoice.apply_vat
    ? '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#64748b;">' +
      "<span>" + (isAr ? "ضريبة القيمة المضافة (" + (invoice.tax_rate || 15) + "%)" : "VAT (" + (invoice.tax_rate || 15) + "%)") + "</span>" +
      '<span dir="ltr">' + fmt(invoice.tax_amount) + " " + (isAr ? "ر.س" : "SAR") + "</span></div>"
    : "";

  const discountRow = (invoice.discount || 0) > 0
    ? '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#ef4444;">' +
      "<span>" + (isAr ? "الخصم" : "Discount") + "</span>" +
      '<span dir="ltr">-' + fmt(invoice.discount) + "</span></div>"
    : "";

  const notesHtml = invoice.notes
    ? '<div style="margin-top:16px;padding:12px;background:#f8fafc;border-right:4px solid ' + pc + ';border-radius:6px;font-size:12px;color:#475569;">' + invoice.notes + "</div>"
    : "";

  const qrHtml = invoice.qr_code
    ? '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;align-items:center;gap:16px;">' +
      '<img src="' + invoice.qr_code + '" style="width:100px;height:100px;object-fit:contain;background:#fff;"/>' +
      '<div style="font-size:11px;color:#64748b;"><div style="font-weight:700;color:#334155;margin-bottom:4px;">' + (isAr ? "رمز الاستجابة السريعة (هيئة الزكاة والضريبة والجمارك)" : "ZATCA QR Code") + "</div>" +
      "<div>" + (isAr ? "امسح الرمز للتحقق" : "Scan to verify") + "</div></div></div>"
    : "";

  return (
    "<!DOCTYPE html>" +
    '<html dir="' + (isAr ? "rtl" : "ltr") + '" lang="' + (isAr ? "ar" : "en") + '">' +
    "<head>" +
    '<meta charset="UTF-8"/>' +
    "<title>" + (isAr ? "فاتورة" : "Invoice") + " " + (invoice.invoice_number || "") + "</title>" +
    '<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">' +
    "<style>" +
    "@page{size:A4 portrait;margin:14mm}" +
    "*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}" +
    "body{font-family:'Tajawal',Arial,sans-serif;margin:0;padding:24px;background:white;color:#1e293b;font-size:13px;line-height:1.6}" +
    "table{border-collapse:collapse;width:100%}" +
    "@media print{body{padding:0}}" +
    "</style></head><body>" +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid ' + pc + ';margin-bottom:20px;">' +
    "<div>" + logoHtml + nameHtml + vatHtml + crHtml + addrHtml + phoneHtml + emailHtml + "</div>" +
    '<div style="text-align:left;">' +
    '<div style="font-size:26px;font-weight:900;color:' + pc + ';margin-bottom:6px;">' + (isAr ? "فاتورة ضريبية" : "TAX INVOICE") + "</div>" +
    '<span style="display:inline-block;background:' + (statusColors[invoice.status] || "#94a3b8") + ';color:white;font-size:11px;font-weight:700;padding:3px 12px;border-radius:20px;margin-bottom:8px;">' + (statusMap[invoice.status] || "") + "</span>" +
    '<table style="font-size:12px;margin-top:4px;">' +
    "<tr><td style=\"color:#94a3b8;padding:2px 8px;\">" + (isAr ? "رقم الفاتورة:" : "Invoice #:") + "</td><td style=\"font-weight:700;\" dir=\"ltr\">" + (invoice.invoice_number || "") + "</td></tr>" +
    counterRow + timeRow + dueRow +
    "<tr><td style=\"color:#94a3b8;padding:2px 8px;\">" + (isAr ? "التاريخ:" : "Date:") + "</td><td style=\"font-weight:700;\" dir=\"ltr\">" + (invoice.date || "") + "</td></tr>" +
    "<tr><td style=\"color:#94a3b8;padding:2px 8px;\">" + (isAr ? "النوع:" : "Type:") + "</td><td style=\"font-weight:700;\">" + (invoice.invoice_type === "standard" ? (isAr ? "اعتيادية" : "Standard") : (isAr ? "مبسطة" : "Simplified")) + "</td></tr>" +
    "</table></div></div>" +
    '<div style="display:flex;justify-content:space-between;gap:20px;background:#eff6ff;border-radius:10px;padding:16px 20px;margin-bottom:20px;">' +
    "<div>" +
    '<div style="font-size:10px;font-weight:800;color:' + pc + ';text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">' + (isAr ? "إلى العميل" : "BILL TO") + "</div>" +
    '<div style="font-size:14px;font-weight:800;">' + (invoice.customer_name || "") + "</div>" +
    custVatHtml + custAddrHtml +
    "</div>" + paymentHtml + "</div>" +
    "<table><thead>" +
    '<tr style="background:' + pc + ';">' +
    '<th style="padding:10px 12px;text-align:right;font-size:12px;color:white;">' + (isAr ? "الوصف" : "Description") + "</th>" +
    '<th style="padding:10px 12px;text-align:center;font-size:12px;color:white;">' + (isAr ? "الكمية" : "Qty") + "</th>" +
    '<th style="padding:10px 12px;text-align:center;font-size:12px;color:white;">' + (isAr ? "سعر الوحدة" : "Unit Price") + "</th>" +
    '<th style="padding:10px 12px;text-align:center;font-size:12px;color:white;">' + (isAr ? "الإجمالي" : "Total") + "</th>" +
    "</tr></thead><tbody>" + itemRows + "</tbody></table>" +
    '<div style="display:flex;justify-content:flex-end;margin-top:16px;">' +
    '<div style="width:280px;">' +
    '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#64748b;"><span>' + (isAr ? "المجموع قبل الضريبة" : "Subtotal") + '</span><span dir="ltr">' + fmt(invoice.subtotal) + " " + (isAr ? "ر.س" : "SAR") + "</span></div>" +
    vatRow + discountRow +
    '<div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:4px;border-top:2px solid ' + pc + ';font-size:15px;font-weight:800;color:' + pc + ';"><span>' + (isAr ? "الإجمالي شامل الضريبة" : "Total (incl. VAT)") + '</span><span dir="ltr">' + fmt(invoice.total) + " " + (isAr ? "ر.س" : "SAR") + "</span></div>" +
    "</div></div>" +
    notesHtml + qrHtml +
    '<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;color:#94a3b8;">' + (isAr ? "صدرت بواسطة نظام المحاسب الذكي - " : "Generated by Smart Accountant - ") + "<strong>RikazAi.com</strong></div>" +
    "</body></html>"
  );
}

function InvoicesContent() {
  const { language } = useLanguage();
  const [view, setView] = useState("list");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [postSaveInvoice, setPostSaveInvoice] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    Wadaq.auth.me().then(async (user) => {
      const orgs = await Wadaq.entities.Organization.filter({ owner_email: user.email });
      setCompanyInfo(orgs[0] || {
        name: user?.company_name || "",
        logo: user?.company_logo,
        address: user?.company_address,
        phone: user?.company_phone,
        email: user?.email,
        vat_number: user?.company_vat_number,
        commercial_registration: user?.company_commercial_registration,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setView("form");
      setSelectedInvoice(null);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const invoiceId = params.get("invoice_id");
    if (paymentStatus && invoiceId) {
      if (paymentStatus === "success") {
        setPaymentMessage({ type: "success", text: language === "ar" ? "تم الدفع بنجاح! شكراً لك." : "Payment successful! Thank you." });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      } else if (paymentStatus === "cancelled") {
        setPaymentMessage({ type: "error", text: language === "ar" ? "تم إلغاء عملية الدفع." : "Payment was cancelled." });
      }
      window.history.replaceState({}, "", "/invoices");
      setTimeout(() => setPaymentMessage(null), 5000);
    }
  }, [language, queryClient]);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Invoice.filter({ created_by: currentUser.email }, "-created_date");
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Customer.filter({ created_by: currentUser.email });
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Product.filter({ created_by: currentUser.email });
    },
  });

  const printA4Direct = (invoice) => {
    const html = buildInvoiceHTML(invoice, companyInfo, language === "ar");
    const win = window.open("", "_blank", "width=900,height=800");
    if (!win) {
      alert(language === "ar" ? "يرجى السماح بالنوافذ المنبثقة" : "Please allow popups");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    // انتظر تحميل الخطوط قبل الطباعة
    setTimeout(() => { win.focus(); win.print(); }, 1200);
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await Wadaq.auth.me();
      const sanitizedItems = (data.items || []).map((item) => ({
        ...item,
        product_name: item.product_name || item.name || (language === "ar" ? "بند" : "Item"),
      }));
      return Wadaq.entities.Invoice.create({
        ...data,
        items: sanitizedItems,
        created_by: user.email,
        created_date: new Date().toISOString(),
      });
    },
    onSuccess: (newInvoice) => {
      setPostSaveInvoice(newInvoice);
      setSelectedInvoice(null);
      setView("list");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({
        title: language === "ar" ? "تم الحفظ" : "Saved",
        description:
          language === "ar"
            ? "تم حفظ الفاتورة وتحديث القائمة ولوحة التحكم."
            : "Invoice saved. Lists and dashboard will refresh.",
      });
    },
    onError: (error) => {
      console.error("Error creating invoice:", error);
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل الحفظ" : "Save failed",
        description:
          error?.message ||
          (language === "ar" ? "تعذّر حفظ الفاتورة. تحقق من البيانات وحاول مجدداً." : "Could not save the invoice."),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitizedItems = (data.items || []).map((item) => ({
        ...item,
        product_name: item.product_name || item.name || (language === "ar" ? "بند" : "Item"),
      }));
      return Wadaq.entities.Invoice.update(id, { ...data, items: sanitizedItems });
    },
    onSuccess: () => {
      setSelectedInvoice(null);
      setView("list");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: language === "ar" ? "تم التحديث" : "Updated",
        description: language === "ar" ? "تم حفظ تعديلات الفاتورة." : "Invoice changes saved.",
      });
    },
    onError: (error) => {
      console.error("Error updating invoice:", error);
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل التحديث" : "Update failed",
        description: error?.message || (language === "ar" ? "تعذّر حفظ التعديلات." : "Could not save changes."),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Wadaq.entities.Invoice.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data) => {
      const user = await Wadaq.auth.me();
      return Wadaq.entities.Customer.create({ ...data, created_by: user.email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "لم يُحفظ العميل" : "Customer not saved",
        description: error?.message || "",
      });
    },
  });

  const handleSave = async (invoiceData) => {
    try {
      const user = await Wadaq.auth.me();
      const timestamp = new Date(invoiceData.date + "T" + (invoiceData.time || "00:00:00")).toISOString();
      const qrResponse = await Wadaq.functions.invoke("generateZATCAQR", {
        seller_name: user.company_name || "مؤسسة ركاز لتقنية المعلومات",
        vat_number: user.company_vat_number || "300000000000003",
        timestamp,
        total_with_vat: invoiceData.total || 0,
        vat_amount: invoiceData.tax_amount || 0,
      });
      if (qrResponse.data && qrResponse.data.qr_code) {
        invoiceData.qr_code = qrResponse.data.qr_code;
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    }

    try {
      if (selectedInvoice) {
        await updateMutation.mutateAsync({ id: selectedInvoice.id, data: invoiceData });
      } else {
        await createMutation.mutateAsync(invoiceData);
      }
    } catch {
      /* Toast يُعرض عبر onError في الطفرة */
    }
  };

  const handleEdit = (invoice) => { setSelectedInvoice(invoice); setView("form"); };
  const handleView = (invoice) => { setSelectedInvoice(invoice); setView("view"); };

  const handleDelete = (invoice) => {
    Swal.fire({
      title: language === "ar" ? "حذف الفاتورة؟" : "Delete Invoice?",
      text: language === "ar"
        ? "هل أنت متأكد من حذف فاتورة " + invoice.invoice_number + "؟"
        : "Delete invoice " + invoice.invoice_number + "?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: language === "ar" ? "نعم، احذف" : "Yes, delete",
      cancelButtonText: language === "ar" ? "إلغاء" : "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(invoice.id);
        Swal.fire({ title: language === "ar" ? "تم الحذف!" : "Deleted!", icon: "success", timer: 1500, showConfirmButton: false });
      }
    });
  };

  const handleStatusChange = (invoice, newStatus) => {
    updateMutation.mutate({ id: invoice.id, data: { ...invoice, status: newStatus } });
  };

  const handleAddCustomer = async (customerData) => {
    try { return await createCustomerMutation.mutateAsync(customerData); }
    catch (error) { console.error("Error creating customer:", error); return null; }
  };

  const handleCreateCreditNote = async (creditNoteData) => {
    console.log("Creating credit note:", creditNoteData);
  };

  const printThermalDirect = (invoice) => {
    const isAr = language === "ar";
    const fmt = (n) => (n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const items = (invoice.items || []).map(item =>
      `<tr>
        <td style="padding:4px 2px;font-size:13px;border-bottom:1px dotted #ccc;">${item.product_name || ""}</td>
        <td style="padding:4px 2px;font-size:13px;text-align:center;border-bottom:1px dotted #ccc;">${item.quantity}</td>
        <td style="padding:4px 2px;font-size:13px;text-align:left;border-bottom:1px dotted #ccc;" dir="ltr">${fmt(item.total)}</td>
      </tr>`
    ).join("");
    const html = `<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
<style>
  @page { size: 80mm auto; margin: 3mm 2mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: 'Tajawal', Arial, sans-serif;
    font-size: 13px;
    width: 76mm;
    margin: 0 auto;
    padding: 0;
    color: #000;
    background: #fff;
  }
  table { width: 100%; border-collapse: collapse; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
</style>
</head>
<body>
  <div class="center bold" style="font-size:16px;margin-bottom:2px;">${companyInfo?.name || ""}</div>
  ${companyInfo?.phone ? `<div class="center" style="font-size:12px;">${companyInfo.phone}</div>` : ""}
  ${companyInfo?.vat_number ? `<div class="center" style="font-size:12px;">${isAr ? "ر.ض: " : "VAT: "}${companyInfo.vat_number}</div>` : ""}
  ${companyInfo?.address ? `<div class="center" style="font-size:11px;">${companyInfo.address}</div>` : ""}
  <div class="divider"></div>
  <div class="center bold" style="font-size:14px;">${isAr ? "فاتورة ضريبية مبسطة" : "Simplified Tax Invoice"}</div>
  <div class="divider"></div>
  <div class="row"><span>${isAr ? "رقم الفاتورة:" : "Invoice #:"}</span><span>${invoice.invoice_number || ""}</span></div>
  <div class="row"><span>${isAr ? "التاريخ:" : "Date:"}</span><span>${invoice.date || ""}</span></div>
  ${invoice.time ? `<div class="row"><span>${isAr ? "الوقت:" : "Time:"}</span><span>${invoice.time}</span></div>` : ""}
  <div class="row"><span>${isAr ? "العميل:" : "Customer:"}</span><span>${invoice.customer_name || ""}</span></div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th style="text-align:right;font-size:12px;padding:3px 2px;">${isAr ? "الصنف" : "Item"}</th>
        <th style="text-align:center;font-size:12px;padding:3px 2px;">${isAr ? "الكمية" : "Qty"}</th>
        <th style="text-align:left;font-size:12px;padding:3px 2px;">${isAr ? "المبلغ" : "Amount"}</th>
      </tr>
    </thead>
    <tbody>${items}</tbody>
  </table>
  <div class="divider"></div>
  <div class="row"><span>${isAr ? "المجموع:" : "Subtotal:"}</span><span dir="ltr">${fmt(invoice.subtotal)} ${isAr ? "ر.س" : "SAR"}</span></div>
  ${invoice.apply_vat ? `<div class="row"><span>${isAr ? "ضريبة القيمة المضافة (${invoice.tax_rate || 15}%):" : "VAT (${invoice.tax_rate || 15}%):"}</span><span dir="ltr">${fmt(invoice.tax_amount)} ${isAr ? "ر.س" : "SAR"}</span></div>` : ""}
  ${(invoice.discount || 0) > 0 ? `<div class="row" style="color:#e11d48;"><span>${isAr ? "الخصم:" : "Discount:"}</span><span dir="ltr">-${fmt(invoice.discount)}</span></div>` : ""}
  <div class="divider"></div>
  <div class="row bold" style="font-size:15px;"><span>${isAr ? "الإجمالي:" : "Total:"}</span><span dir="ltr">${fmt(invoice.total)} ${isAr ? "ر.س" : "SAR"}</span></div>
  ${invoice.qr_code ? `<div class="center" style="margin-top:10px;"><img src="${invoice.qr_code}" style="width:90px;height:90px;"/><div style="font-size:10px;margin-top:2px;">${isAr ? "رمز ZATCA" : "ZATCA QR"}</div></div>` : ""}
  <div class="divider"></div>
  <div class="center" style="font-size:12px;font-weight:700;">${isAr ? "شكراً لزيارتكم 🙏" : "Thank you! 🙏"}</div>
  <div class="center" style="font-size:10px;color:#666;margin-top:2px;">rikazai.com</div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) { alert(isAr ? "يرجى السماح بالنوافذ المنبثقة" : "Please allow popups"); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 800);
  };

  const sendWhatsApp = (invoice) => {
    const isAr = language === "ar";
    const fmt = (n) => (n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const itemsText = (invoice.items || []).map(item =>
      `  • ${item.product_name} × ${item.quantity} = ${fmt(item.total)} ${isAr ? "ر.س" : "SAR"}`
    ).join("\n");

    const msg = isAr
      ? `السلام عليكم ${invoice.customer_name} 👋\n\n` +
        `📄 *فاتورة ضريبية مبسطة*\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🔢 رقم الفاتورة: ${invoice.invoice_number}\n` +
        `📅 التاريخ: ${invoice.date}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🛒 *البنود:*\n${itemsText}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `💰 المجموع قبل الضريبة: ${fmt(invoice.subtotal)} ر.س\n` +
        (invoice.apply_vat ? `🧾 ضريبة القيمة المضافة: ${fmt(invoice.tax_amount)} ر.س\n` : "") +
        `✅ *الإجمالي: ${fmt(invoice.total)} ر.س*\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🏢 ${companyInfo?.name || ""}\n` +
        `شكراً لتعاملكم معنا 🙏`
      : `Hello ${invoice.customer_name} 👋\n\n` +
        `📄 *Tax Invoice*\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🔢 Invoice #: ${invoice.invoice_number}\n` +
        `📅 Date: ${invoice.date}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🛒 *Items:*\n${itemsText}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `💰 Subtotal: ${fmt(invoice.subtotal)} SAR\n` +
        (invoice.apply_vat ? `🧾 VAT: ${fmt(invoice.tax_amount)} SAR\n` : "") +
        `✅ *Total: ${fmt(invoice.total)} SAR*\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🏢 ${companyInfo?.name || ""}\n` +
        `Thank you for your business 🙏`;

    // إذا كان هناك رقم هاتف العميل - أرسل إليه مباشرة
    const customerPhone = invoice.customer_phone || 
      customers.find(c => c.id === invoice.customer_id)?.phone;
    
    const phone = customerPhone
      ? customerPhone.replace(/[^0-9]/g, "").replace(/^0/, "966")
      : "";
    
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    
    window.open(url, "_blank");
  };

  const sendEmail = (invoice) => {
    const subject = language === "ar" ? `فاتورة رقم ${invoice.invoice_number}` : `Invoice #${invoice.invoice_number}`;
    const body = language === "ar"
      ? `مرحباً ${invoice.customer_name},\n\nإجمالي الفاتورة: ${invoice.total?.toLocaleString()} ر.س`
      : `Hello ${invoice.customer_name},\n\nInvoice total: ${invoice.total?.toLocaleString()} SAR`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (view === "form") {
    return (
      <InvoiceForm
        invoice={selectedInvoice}
        customers={customers}
        products={products}
        onSave={handleSave}
        onCancel={() => { setView("list"); setSelectedInvoice(null); }}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onAddCustomer={handleAddCustomer}
      />
    );
  }

  if (view === "view") {
    return (
      <InvoiceView
        invoice={selectedInvoice}
        onBack={() => { setView("list"); setSelectedInvoice(null); }}
        onCreateCreditNote={handleCreateCreditNote}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PostSaveModal
        open={!!postSaveInvoice}
        onClose={() => setPostSaveInvoice(null)}
        language={language}
        onPrintA4={() => postSaveInvoice && printA4Direct(postSaveInvoice)}
        onPrintThermal={() => postSaveInvoice && printThermalDirect(postSaveInvoice)}
        onWhatsApp={() => postSaveInvoice && sendWhatsApp(postSaveInvoice)}
        onEmail={() => postSaveInvoice && sendEmail(postSaveInvoice)}
      />

      {paymentMessage && (
        <Card className={"border-2 " + (paymentMessage.type === "success" ? "border-emerald-500 bg-emerald-50" : "border-rose-500 bg-rose-50")}>
          <CardContent className="p-4 flex items-center gap-3">
            {paymentMessage.type === "success"
              ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              : <XCircle className="w-6 h-6 text-rose-600" />}
            <p className={"font-medium " + (paymentMessage.type === "success" ? "text-emerald-800" : "text-rose-800")}>
              {paymentMessage.text}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setPaymentMessage(null)} className="mr-auto">
              {language === "ar" ? "إغلاق" : "Close"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
            {language === "ar" ? "الفواتير" : "Invoices"}
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-light tracking-wide">
            {language === "ar" ? "إدارة الفواتير والمبيعات" : "Manage invoices and sales"}
          </p>
        </div>
        <Button
          onClick={() => setView("form")}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-6 font-light tracking-wide"
        >
          <Plus className="w-5 h-5 ml-2" strokeWidth={1.5} />
          {language === "ar" ? "فاتورة جديدة" : "New Invoice"}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder={language === "ar" ? "بحث برقم الفاتورة أو اسم العميل..." : "Search by invoice number or customer..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <InvoicesList
          invoices={filteredInvoices}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

export default function Invoices() {
  return (
    <SubscriptionGuard>
      <InvoicesContent />
    </SubscriptionGuard>
  );
}