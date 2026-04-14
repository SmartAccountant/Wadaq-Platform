import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import {
  getOrCreateInvoiceZatcaQrDataUrl,
  getOrganizationVatForDisplay,
  ZATCA_QR_WIDTH_THERMAL,
} from "@/lib/zatcaQr";

export default function ThermalReceipt({ invoice, companyInfo, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setQrCodeUrl(null);
    getOrCreateInvoiceZatcaQrDataUrl(invoice, companyInfo, { width: ZATCA_QR_WIDTH_THERMAL })
      .then((url) => {
        if (!cancelled) setQrCodeUrl(url);
      })
      .catch((error) => {
        console.error("Error generating QR code:", error);
        if (!cancelled) setQrCodeUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [invoice, companyInfo]);

  const handlePrint = () => {
    const receiptEl = document.querySelector('.thermal-receipt-content');
    const content = receiptEl ? receiptEl.innerHTML : '';

    const printHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>إيصال حراري</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    body { font-family: 'Courier New', Arial, monospace; margin: 0; padding: 0; background: white; color: #000; font-size: 11px; line-height: 1.4; width: 80mm; }
    .receipt-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
    .company-logo { max-width: 50mm; max-height: 25mm; margin: 0 auto 5px; display: block; }
    .company-name { font-size: 14px; font-weight: bold; margin: 5px 0; }
    .info-text { font-size: 10px; margin: 2px 0; }
    .section-divider { border-bottom: 1px solid #000; margin: 8px 0; }
    .receipt-table { width: 100%; margin: 8px 0; border-collapse: collapse; }
    .receipt-table td { padding: 3px 0; font-size: 10px; }
    .totals-section { border-top: 1px solid #000; padding-top: 5px; margin-top: 8px; }
    .total-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
    .grand-total-row { font-size: 13px; font-weight: bold; border-top: 2px double #000; border-bottom: 2px double #000; padding: 5px 0; margin: 5px 0; }
    .qr-container { text-align: center; margin: 10px 0; padding-top: 8px; border-top: 2px dashed #000; }
    .qr-image { width: 128px; height: 128px; margin: 5px auto; display: block; object-fit: contain; }
    .receipt-footer { text-align: center; font-size: 9px; border-top: 2px dashed #000; padding-top: 8px; margin-top: 10px; }
    @media print { body { width: 80mm; } }
  </style>
</head>
<body>${content}</body>
</html>`;

    // استخدام iframe بدلاً من window.open لتجنب حجب المتصفح للنوافذ المنبثقة
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:80mm;height:200mm;border:0;';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(printHtml);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Controls */}
        <div className="p-4 border-b flex justify-between items-center no-print">
          <h3 className="text-lg font-bold">إيصال حراري 80mm</h3>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 ml-2" />
              إغلاق
            </Button>
          </div>
        </div>

        {/* Thermal Receipt Content */}
        <div className="invoice-content thermal-receipt-content p-6" dir="rtl">
          <style>{`
            /* Thermal Receipt Specific Styles */
            .invoice-content {
              width: 80mm;
              font-family: 'Courier New', 'Arial', monospace;
              font-size: 11px;
              line-height: 1.4;
              color: #000;
              background: #fff;
            }
            
            .receipt-header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            
            .company-logo {
              max-width: 50mm;
              max-height: 25mm;
              margin: 0 auto 5px;
              display: block;
            }
            
            .company-name {
              font-size: 14px;
              font-weight: bold;
              margin: 5px 0;
            }
            
            .info-text {
              font-size: 10px;
              margin: 2px 0;
            }
            
            .section-divider {
              border-bottom: 1px solid #000;
              margin: 8px 0;
            }
            
            .receipt-table {
              width: 100%;
              margin: 8px 0;
              border-collapse: collapse;
            }
            
            .receipt-table td {
              padding: 3px 0;
              font-size: 10px;
            }
            
            .totals-section {
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 8px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              font-size: 11px;
            }
            
            .grand-total-row {
              font-size: 13px;
              font-weight: bold;
              border-top: 2px double #000;
              border-bottom: 2px double #000;
              padding: 5px 0;
              margin: 5px 0;
            }
            
            .qr-container {
              text-align: center;
              margin: 10px 0;
              padding-top: 8px;
              border-top: 2px dashed #000;
            }
            
            .qr-image {
              width: 128px;
              height: 128px;
              margin: 5px auto;
              display: block;
              object-fit: contain;
            }
            
            .receipt-footer {
              text-align: center;
              font-size: 9px;
              border-top: 2px dashed #000;
              padding-top: 8px;
              margin-top: 10px;
            }
          `}</style>

          {/* Header */}
          <div className="receipt-header">
            {companyInfo?.logo && (
              <img 
                src={companyInfo.logo} 
                alt="شعار" 
                className="company-logo"
              />
            )}
            <div className="company-name">
              {companyInfo?.name || ""}
            </div>
            {companyInfo?.commercial_registration && (
              <div className="info-text">س.ت: {companyInfo.commercial_registration}</div>
            )}
            <div className="info-text">
              الرقم الضريبي للمنشأة:{" "}
              <span dir="ltr">{getOrganizationVatForDisplay(invoice, companyInfo)}</span>
            </div>
            {companyInfo?.address && (
              <div className="info-text">{companyInfo.address}</div>
            )}
            {companyInfo?.phone && (
              <div className="info-text">هاتف: {companyInfo.phone}</div>
            )}
          </div>

          {/* Invoice Info */}
          <div style={{ textAlign: 'center', margin: '8px 0', fontSize: '12px', fontWeight: 'bold' }}>
            فاتورة ضريبية مبسطة
          </div>
          <div className="info-text">
            <strong>رقم:</strong> {invoice.invoice_number}
          </div>
          <div className="info-text">
            <strong>تاريخ:</strong> {invoice.date && format(new Date(invoice.date), "yyyy-MM-dd")}
          </div>
          {invoice.customer_name && (
            <div className="info-text">
              <strong>عميل:</strong> {invoice.customer_name}
            </div>
          )}

          <div className="section-divider"></div>

          {/* Items */}
          <table className="receipt-table">
            <tbody>
              {invoice.items?.map((item, idx) => (
                <React.Fragment key={idx}>
                  <tr>
                    <td colSpan="2" style={{ fontWeight: 'bold', paddingTop: '5px' }}>
                      {item.product_name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ width: '60%' }}>
                      {item.quantity} × {item.price?.toFixed(2)} ر.س
                    </td>
                    <td style={{ width: '40%', textAlign: 'left', fontWeight: 'bold' }}>
                      {item.total?.toFixed(2)} ر.س
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals-section">
            <div className="total-row">
              <span>المجموع الفرعي:</span>
              <span>{invoice.subtotal?.toFixed(2)} ر.س</span>
            </div>
            
            {invoice.discount > 0 && (
              <div className="total-row">
                <span>الخصم:</span>
                <span>-{invoice.discount?.toFixed(2)} ر.س</span>
              </div>
            )}
            
            {invoice.shipping_cost > 0 && (
              <div className="total-row">
                <span>الشحن:</span>
                <span>{invoice.shipping_cost?.toFixed(2)} ر.س</span>
              </div>
            )}
            
            {invoice.apply_vat !== false && invoice.tax_amount > 0 && (
              <div className="total-row">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span>{invoice.tax_amount?.toFixed(2)} ر.س</span>
              </div>
            )}
            
            <div className="total-row grand-total-row">
              <span>الإجمالي:</span>
              <span>{invoice.total?.toFixed(2)} ر.س</span>
            </div>
          </div>

          {/* QR Code — ZATCA TLV، حجم 128px لسهولة المسح */}
          <div className="qr-container">
            <div style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "3px" }}>
              رمز الفاتورة الإلكترونية
            </div>
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="ZATCA QR"
                className="qr-image"
                width={ZATCA_QR_WIDTH_THERMAL}
                height={ZATCA_QR_WIDTH_THERMAL}
              />
            ) : (
              <div style={{ fontSize: "10px", padding: "8px 4px", color: "#555" }}>
                جاري تجهيز رمز الاستجابة…
              </div>
            )}
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={{ marginTop: '8px', fontSize: '9px', borderTop: '1px dashed #000', paddingTop: '5px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>ملاحظات:</div>
              <div style={{ whiteSpace: 'pre-line', lineHeight: '1.3' }}>{invoice.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="receipt-footer">
            <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>شكراً لتعاملكم معنا</div>
            {companyInfo?.name && (
              <div style={{ margin: '3px 0' }}>{companyInfo.name}</div>
            )}
            {companyInfo?.commercial_registration && (
              <div style={{ fontSize: '8px' }}>س.ت: {companyInfo.commercial_registration}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}