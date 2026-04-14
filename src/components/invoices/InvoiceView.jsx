import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, RotateCcw, Settings2, Receipt } from "lucide-react";
import ThermalReceipt from "./ThermalReceipt";
import CreditNoteView from "./CreditNoteView";
import CreditNoteForm from "./CreditNoteForm";
import InvoiceCustomizer, { DEFAULT_INVOICE_STYLE } from "./InvoiceCustomizer";
import { Wadaq } from "@/api/WadaqClient";
import {
  getOrCreateInvoiceZatcaQrDataUrl,
  getOrganizationVatForDisplay,
  ZATCA_QR_WIDTH_SCREEN,
} from "@/lib/zatcaQr";
import { useLanguage } from "@/components/LanguageContext";
import Swal from "sweetalert2";

// ============================================================
// دالة توليد HTML نظيف للفاتورة (بدون Tailwind)
// ============================================================
function buildInvoiceHTML(invoice, companyInfo, style, language, qrDataUrl = null) {
  const isAr = language === 'ar';
  const pc = style?.primaryColor || '#2563eb';
  const pcLight = pc + '18';

  const fmt = (n) => (n || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const vatDisplay = getOrganizationVatForDisplay(invoice, companyInfo);

  const statusMap = {
    draft: isAr ? 'مسودة' : 'Draft',
    sent: isAr ? 'مرسلة' : 'Sent',
    paid: isAr ? 'مدفوعة' : 'Paid',
    overdue: isAr ? 'متأخرة' : 'Overdue',
    cancelled: isAr ? 'ملغية' : 'Cancelled',
  };
  const statusColors = { draft: '#94a3b8', sent: '#3b82f6', paid: '#10b981', overdue: '#ef4444', cancelled: '#6b7280' };
  const paymentMap = {
    cash: isAr ? 'نقداً' : 'Cash',
    bank_transfer: isAr ? 'تحويل بنكي' : 'Bank Transfer',
    credit_card: isAr ? 'بطاقة ائتمانية' : 'Credit Card',
    other: isAr ? 'أخرى' : 'Other',
  };

  const itemRows = (invoice.items || []).map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : pcLight}">
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;">${item.product_name || item.name || ''}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center;color:#475569;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center;color:#475569;" dir="ltr">${fmt(item.price)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center;font-weight:700;color:#1e293b;" dir="ltr">${fmt(item.total)}</td>
    </tr>
  `).join('');

  const logoHTML = companyInfo?.logo
    ? `<img src="${companyInfo.logo}" style="height:70px;max-width:200px;object-fit:contain;display:block;margin-bottom:8px;" />`
    : '';

  const qrHTML = qrDataUrl
    ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;align-items:center;gap:16px;">
        <img src="${qrDataUrl}" width="${ZATCA_QR_WIDTH_SCREEN}" height="${ZATCA_QR_WIDTH_SCREEN}" style="width:${ZATCA_QR_WIDTH_SCREEN}px;height:${ZATCA_QR_WIDTH_SCREEN}px;object-fit:contain;background:#fff;" alt="ZATCA QR" />
        <div style="font-size:11px;color:#64748b;">
          <div style="font-weight:700;color:#334155;margin-bottom:4px;">${isAr ? 'رمز الاستجابة السريعة (هيئة الزكاة والضريبة والجمارك)' : 'ZATCA QR Code'}</div>
          <div>${isAr ? 'امسح الرمز للتحقق من صحة الفاتورة الإلكترونية' : 'Scan to verify e-invoice'}</div>
          ${invoice.zatca_uuid ? `<div style="font-size:9px;color:#94a3b8;font-family:monospace;margin-top:4px;word-break:break-all;">${invoice.zatca_uuid}</div>` : ''}
        </div>
      </div>`
    : `<div style="margin-top:20px;padding:16px;border:1px dashed #cbd5e1;border-radius:12px;font-size:12px;color:#64748b;text-align:center;">${isAr ? 'جاري تجهيز رمز الاستجابة السريعة…' : 'Preparing QR code…'}</div>`;

  return `<!DOCTYPE html>
<html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
<head>
  <meta charset="UTF-8"/>
  <title></title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    body { font-family: 'Tajawal', Arial, sans-serif; margin: 0; padding: 20px 28px; background: white; color: #1e293b; font-size: 13px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
    table { border-collapse: collapse; width: 100%; }
    @media print { body { padding: 0; max-width: none; } }
  </style>
</head>
<body>

<!-- ===== الهيدر ===== -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid ${pc};margin-bottom:20px;">
  <!-- بيانات الشركة -->
  <div>
    ${logoHTML}
    ${companyInfo?.name ? `<div style="font-size:16px;font-weight:800;color:#1e293b;">${companyInfo.name}</div>` : ''}
    ${companyInfo?.name_en && !isAr ? `<div style="font-size:13px;color:#64748b;">${companyInfo.name_en}</div>` : ''}
    ${vatDisplay ? `<div style="font-size:11px;color:#64748b;">${isAr ? 'الرقم الضريبي للمنشأة:' : 'Establishment VAT:'} <span dir="ltr">${vatDisplay}</span></div>` : ''}
    ${companyInfo?.commercial_registration ? `<div style="font-size:11px;color:#64748b;">${isAr ? 'السجل التجاري:' : 'CR:'} ${companyInfo.commercial_registration}</div>` : ''}
    ${companyInfo?.address ? `<div style="font-size:11px;color:#64748b;">${companyInfo.address}</div>` : ''}
    ${companyInfo?.phone ? `<div style="font-size:11px;color:#64748b;">${companyInfo.phone}</div>` : ''}
    ${companyInfo?.email ? `<div style="font-size:11px;color:#64748b;">${companyInfo.email}</div>` : ''}
  </div>

  <!-- عنوان الفاتورة ومعلوماتها -->
  <div style="text-align:${isAr ? 'left' : 'right'};">
    <div style="font-size:28px;font-weight:900;color:${pc};margin-bottom:6px;">${isAr ? 'فاتورة ضريبية' : 'TAX INVOICE'}</div>
    <span style="display:inline-block;background:${statusColors[invoice.status] || '#94a3b8'};color:white;font-size:11px;font-weight:700;padding:3px 12px;border-radius:20px;margin-bottom:8px;">
      ${statusMap[invoice.status] || invoice.status || ''}
    </span>
    <table style="font-size:12px;margin-top:4px;">
      <tr>
        <td style="color:#94a3b8;padding:2px 8px;">${isAr ? 'رقم الفاتورة:' : 'Invoice #:'}</td>
        <td style="font-weight:700;" dir="ltr">${invoice.invoice_number || ''}</td>
      </tr>
      ${invoice.invoice_counter_number ? `<tr><td style="color:#94a3b8;padding:2px 8px;">${isAr ? 'الرقم التسلسلي:' : 'Counter:'}</td><td style="font-weight:700;" dir="ltr">${invoice.invoice_counter_number}</td></tr>` : ''}
      <tr>
        <td style="color:#94a3b8;padding:2px 8px;">${isAr ? 'التاريخ:' : 'Date:'}</td>
        <td style="font-weight:700;" dir="ltr">${invoice.date || ''}</td>
      </tr>
      ${invoice.time ? `<tr><td style="color:#94a3b8;padding:2px 8px;">${isAr ? 'الوقت:' : 'Time:'}</td><td style="font-weight:700;" dir="ltr">${invoice.time}</td></tr>` : ''}
      ${invoice.due_date ? `<tr><td style="color:#94a3b8;padding:2px 8px;">${isAr ? 'الاستحقاق:' : 'Due:'}</td><td style="font-weight:700;" dir="ltr">${invoice.due_date}</td></tr>` : ''}
      <tr>
        <td style="color:#94a3b8;padding:2px 8px;">${isAr ? 'نوع الفاتورة:' : 'Type:'}</td>
        <td style="font-weight:700;">${invoice.invoice_type === 'standard' ? (isAr ? 'ضريبية اعتيادية' : 'Standard') : (isAr ? 'مبسطة' : 'Simplified')}</td>
      </tr>
    </table>
  </div>
</div>

<!-- ===== بيانات العميل وطريقة الدفع ===== -->
<div style="display:flex;justify-content:space-between;gap:20px;background:${pcLight};border-radius:10px;padding:16px 20px;margin-bottom:20px;">
  <div>
    <div style="font-size:10px;font-weight:800;color:${pc};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">${isAr ? 'إلى العميل' : 'BILL TO'}</div>
    <div style="font-size:14px;font-weight:800;color:#1e293b;">${invoice.customer_name || ''}</div>
    ${invoice.customer_vat_number ? `<div style="font-size:11px;color:#64748b;">${isAr ? 'الرقم الضريبي:' : 'VAT:'} ${invoice.customer_vat_number}</div>` : ''}
    ${invoice.customer_address ? `<div style="font-size:11px;color:#64748b;">${invoice.customer_address}</div>` : ''}
  </div>
  ${invoice.payment_method ? `
  <div style="text-align:${isAr ? 'left' : 'right'};">
    <div style="font-size:10px;font-weight:800;color:${pc};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">${isAr ? 'طريقة الدفع' : 'PAYMENT'}</div>
    <div style="font-size:14px;font-weight:700;color:#334155;">${paymentMap[invoice.payment_method] || invoice.payment_method}</div>
  </div>` : ''}
</div>

<!-- ===== جدول البنود ===== -->
<table style="margin-bottom:0;">
  <thead>
    <tr style="background:${pc};">
      <th style="padding:10px 12px;text-align:${isAr ? 'right' : 'left'};font-size:12px;color:white;font-weight:700;">${isAr ? 'الوصف' : 'Description'}</th>
      <th style="padding:10px 12px;text-align:center;font-size:12px;color:white;font-weight:700;">${isAr ? 'الكمية' : 'Qty'}</th>
      <th style="padding:10px 12px;text-align:center;font-size:12px;color:white;font-weight:700;">${isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
      <th style="padding:10px 12px;text-align:center;font-size:12px;color:white;font-weight:700;">${isAr ? 'الإجمالي' : 'Total'}</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

<!-- ===== الإجماليات ===== -->
<div style="display:flex;justify-content:flex-end;margin-top:16px;">
  <div style="width:280px;">
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#64748b;">
      <span>${isAr ? 'المجموع قبل الضريبة' : 'Subtotal (excl. VAT)'}</span>
      <span dir="ltr">${fmt(invoice.subtotal)} ${isAr ? 'ر.س' : 'SAR'}</span>
    </div>
    ${invoice.apply_vat ? `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#64748b;">
      <span>${isAr ? `ضريبة القيمة المضافة (${invoice.tax_rate || 15}%)` : `VAT (${invoice.tax_rate || 15}%)`}</span>
      <span dir="ltr">${fmt(invoice.tax_amount)} ${isAr ? 'ر.س' : 'SAR'}</span>
    </div>` : ''}
    ${(invoice.discount || 0) > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#ef4444;">
      <span>${isAr ? 'الخصم' : 'Discount'}</span>
      <span dir="ltr">-${fmt(invoice.discount)}</span>
    </div>` : ''}
    <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:4px;border-top:2px solid ${pc};font-size:15px;font-weight:800;color:${pc};">
      <span>${isAr ? 'الإجمالي شامل الضريبة' : 'Total (incl. VAT)'}</span>
      <span dir="ltr">${fmt(invoice.total)} ${isAr ? 'ر.س' : 'SAR'}</span>
    </div>
  </div>
</div>

<!-- ===== الملاحظات ===== -->
${invoice.notes ? `
<div style="margin-top:16px;padding:12px;background:#f8fafc;border-right:4px solid ${pc};border-radius:6px;font-size:12px;color:#475569;">
  ${invoice.notes}
</div>` : ''}

<!-- ===== QR Code ===== -->
${qrHTML}



</body>
</html>`;
}

// ============================================================
export default function InvoiceView({ invoice, onBack, onCreateCreditNote }) {
  const { language } = useLanguage();
  const [view, setView] = useState("main");
  const [showCreditNote, setShowCreditNote] = useState(false);
  const [creditNoteData, setCreditNoteData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [invoiceStyle, setInvoiceStyle] = useState(DEFAULT_INVOICE_STYLE);
  const [zatcaQrUrl, setZatcaQrUrl] = useState(null);

  const mergedCompanyInfo = React.useMemo(
    () => ({
      ...(companyInfo || {}),
      vat_number: getOrganizationVatForDisplay(invoice, companyInfo),
    }),
    [invoice, companyInfo]
  );

  useEffect(() => {
    let cancelled = false;
    setZatcaQrUrl(null);
    getOrCreateInvoiceZatcaQrDataUrl(invoice, companyInfo, { width: ZATCA_QR_WIDTH_SCREEN }).then((url) => {
      if (!cancelled) setZatcaQrUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [invoice, companyInfo]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const user = await Wadaq.auth.me();
        if (user?.invoice_style) {
          setInvoiceStyle({ ...DEFAULT_INVOICE_STYLE, ...user.invoice_style });
        } else {
          const saved = localStorage.getItem("invoice_style");
          if (saved) setInvoiceStyle({ ...DEFAULT_INVOICE_STYLE, ...JSON.parse(saved) });
        }
        const orgs = await Wadaq.entities.Organization.filter({ owner_email: user.email });
        setCompanyInfo(orgs[0] || {
          name: user?.company_name || '',
          logo: user?.company_logo,
          address: user?.company_address,
          phone: user?.company_phone,
          email: user?.email,
          vat_number: user?.company_vat_number,
          commercial_registration: user?.company_commercial_registration
        });
      } catch (e) {
        const saved = localStorage.getItem("invoice_style");
        if (saved) setInvoiceStyle({ ...DEFAULT_INVOICE_STYLE, ...JSON.parse(saved) });
      }
    };
    loadAll();
  }, []);

  // ===== طباعة A4 عبر iframe =====
  const printA4 = () => {
    const html = buildInvoiceHTML(invoice, mergedCompanyInfo, invoiceStyle, language, zatcaQrUrl);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:0;';
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    // انتظار تحميل الخطوط والصور قبل الطباعة
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 800);
  };

  // ===== إشعار دائن =====
  const handleSaveCreditNote = async (cnData) => {
    try {
      const saved = await Wadaq.entities.CreditNote.create(cnData);
      for (const item of cnData.items) {
        if (item.product_id && item.product_id !== 'plastic-bags') {
          const product = await Wadaq.entities.Product.get(item.product_id);
          if (product) {
            const newQty = (product.quantity || 0) + Math.abs(item.quantity);
            await Wadaq.entities.Product.update(item.product_id, { quantity: newQty });
            await Wadaq.entities.StockMovement.create({
              product_id: item.product_id,
              product_name: item.product_name,
              type: 'in',
              quantity: Math.abs(item.quantity),
              previous_quantity: product.quantity || 0,
              new_quantity: newQty,
              reference_type: 'return',
              reference_id: saved.id,
              date: cnData.date,
              notes: language === 'ar' ? 'مرتجع من إشعار دائن' : 'Return from credit note'
            });
          }
        }
      }
      setCreditNoteData(saved);
      setView("creditNote");
      setShowCreditNote(false);
      Swal.fire({ icon: 'success', title: language === 'ar' ? 'تم إصدار الإشعار الدائن' : 'Credit Note Issued', timer: 2000, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: language === 'ar' ? 'خطأ' : 'Error', text: error.message });
    }
  };

  if (view === "thermal") {
    return <ThermalReceipt invoice={invoice} companyInfo={mergedCompanyInfo} onClose={() => setView("main")} />;
  }
  if (view === "creditNote" && creditNoteData) {
    return <CreditNoteView creditNote={creditNoteData} invoice={invoice} companyInfo={companyInfo} onBack={() => setView("main")} />;
  }

  // معاينة الفاتورة (HTML مضمّن مباشرة)
  const previewHTML = buildInvoiceHTML(invoice, mergedCompanyInfo, invoiceStyle, language, zatcaQrUrl);

  return (
    <div className="space-y-4">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {language === 'ar' ? 'رجوع' : 'Back'}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button onClick={printA4} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="w-4 h-4" />
            {language === 'ar' ? 'طباعة / PDF' : 'Print / PDF'}
          </Button>
          <Button variant="outline" onClick={() => setView("thermal")} className="gap-2">
            <Receipt className="w-4 h-4" />
            {language === 'ar' ? 'طباعة حرارية' : 'Thermal'}
          </Button>
          {invoice.status === 'paid' && (
            <Button variant="outline" onClick={() => setShowCreditNote(true)} className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50">
              <RotateCcw className="w-4 h-4" />
              {language === 'ar' ? 'إشعار دائن' : 'Credit Note'}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowCustomizer(!showCustomizer)} className="gap-2">
            <Settings2 className="w-4 h-4" />
            {language === 'ar' ? 'تخصيص' : 'Customize'}
          </Button>
        </div>
      </div>

      <div className={`flex gap-4 ${showCustomizer ? 'flex-col lg:flex-row' : ''}`}>
        {showCustomizer && (
          <div className="w-full lg:w-72 flex-shrink-0">
            <InvoiceCustomizer
              invoice={invoice}
              companyInfo={mergedCompanyInfo}
              onClose={() => setShowCustomizer(false)}
              onStyleChange={setInvoiceStyle}
            />
          </div>
        )}

        {/* معاينة الفاتورة عبر iframe */}
        <div className="flex-1 bg-gray-100 rounded-xl shadow overflow-hidden" style={{ minHeight: '700px' }}>
          <iframe
            srcDoc={previewHTML}
            style={{ width: '100%', height: '900px', border: 'none', display: 'block' }}
            title="invoice-preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {showCreditNote && (
        <CreditNoteForm
          invoice={invoice}
          onSave={handleSaveCreditNote}
          onCancel={() => setShowCreditNote(false)}
          isLoading={false}
          language={language}
        />
      )}
    </div>
  );
}