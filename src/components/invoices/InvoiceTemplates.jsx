import React from "react";

export const TEMPLATES = [
  { id: "classic", name: "كلاسيكي", nameEn: "Classic", preview: "🏢" },
  { id: "modern",  name: "عصري",    nameEn: "Modern",  preview: "✨" },
  { id: "elegant", name: "أنيق",    nameEn: "Elegant", preview: "💎" },
  { id: "minimal", name: "بسيط",    nameEn: "Minimal", preview: "⬜" },
];

// ===== مكونات مشتركة =====
function InvoiceTable({ invoice, primaryColor, tableStyle, language }) {
  const isAr = language === 'ar';
  const headers = [
    isAr ? 'الوصف' : 'Description',
    isAr ? 'الكمية' : 'Qty',
    isAr ? 'سعر الوحدة' : 'Unit Price',
    isAr ? 'الإجمالي' : 'Total',
  ];
  return (
    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ backgroundColor: primaryColor }}>
          {headers.map(h => (
            <th key={h} className="p-3 text-xs font-bold text-white text-center">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(invoice.items || []).map((item, i) => (
          <tr key={i} style={{ backgroundColor: i % 2 === 1 && tableStyle === 'striped' ? `${primaryColor}0d` : 'white', borderBottom: '1px solid #f1f5f9' }}>
            <td className="p-3 text-sm text-slate-800">{item.product_name || item.name || ''}</td>
            <td className="p-3 text-sm text-center text-slate-600">{item.quantity}</td>
            <td className="p-3 text-sm text-center text-slate-600" dir="ltr">{(item.price || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</td>
            <td className="p-3 text-sm text-center font-semibold text-slate-800" dir="ltr">{(item.total || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InvoiceTotals({ invoice, primaryColor, language }) {
  const isAr = language === 'ar';
  return (
    <div className="flex justify-end mt-6">
      <div className="w-72 text-sm space-y-2">
        <div className="flex justify-between text-slate-500 pb-1 border-b border-slate-100">
          <span>{isAr ? 'المجموع قبل الضريبة' : 'Subtotal (excl. VAT)'}</span>
          <span dir="ltr">{(invoice.subtotal || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {isAr ? 'ر.س' : 'SAR'}</span>
        </div>
        {invoice.apply_vat && (
          <div className="flex justify-between text-slate-500 pb-1 border-b border-slate-100">
            <span>{isAr ? `ضريبة القيمة المضافة (${invoice.tax_rate || 15}%)` : `VAT (${invoice.tax_rate || 15}%)`}</span>
            <span dir="ltr">{(invoice.tax_amount || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {isAr ? 'ر.س' : 'SAR'}</span>
          </div>
        )}
        {(invoice.discount || 0) > 0 && (
          <div className="flex justify-between text-red-500 pb-1 border-b border-slate-100">
            <span>{isAr ? 'الخصم' : 'Discount'}</span>
            <span dir="ltr">-{invoice.discount.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-2" style={{ color: primaryColor, borderTop: `2px solid ${primaryColor}` }}>
          <span>{isAr ? 'الإجمالي شامل الضريبة' : 'Total (incl. VAT)'}</span>
          <span dir="ltr">{(invoice.total || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {isAr ? 'ر.س' : 'SAR'}</span>
        </div>
      </div>
    </div>
  );
}

function ZATCABadge({ invoice, language, primaryColor }) {
  const isAr = language === 'ar';
  const statusColors = { draft:'#94a3b8', sent:'#3b82f6', paid:'#10b981', overdue:'#ef4444', cancelled:'#6b7280' };
  const statusLabels = {
    draft: isAr ? 'مسودة' : 'Draft',
    sent: isAr ? 'مرسلة' : 'Sent',
    paid: isAr ? 'مدفوعة' : 'Paid',
    overdue: isAr ? 'متأخرة' : 'Overdue',
    cancelled: isAr ? 'ملغية' : 'Cancelled',
  };
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs text-white font-medium"
      style={{ backgroundColor: statusColors[invoice.status] || '#94a3b8' }}>
      {statusLabels[invoice.status] || invoice.status}
    </span>
  );
}

function CompanyBlock({ companyInfo, logoSize, language }) {
  const isAr = language === 'ar';
  return (
    <div>
      {companyInfo?.logo && <img src={companyInfo.logo} alt="Logo" className={`${logoSize} object-contain mb-2`} />}
      {companyInfo?.name && <div className="font-bold text-slate-800 text-base">{companyInfo.name}</div>}
      {companyInfo?.name_en && language !== 'ar' && <div className="text-slate-600 text-sm">{companyInfo.name_en}</div>}
      {companyInfo?.vat_number && <div className="text-xs text-slate-500">{isAr ? 'الرقم الضريبي (VAT):' : 'VAT Number:'} {companyInfo.vat_number}</div>}
      {companyInfo?.commercial_registration && <div className="text-xs text-slate-500">{isAr ? 'السجل التجاري:' : 'CR:'} {companyInfo.commercial_registration}</div>}
      {companyInfo?.address && <div className="text-xs text-slate-500">{companyInfo.address}</div>}
      {companyInfo?.phone && <div className="text-xs text-slate-500">{companyInfo.phone}</div>}
      {companyInfo?.email && <div className="text-xs text-slate-500">{companyInfo.email}</div>}
    </div>
  );
}

function CustomerBlock({ invoice, language }) {
  const isAr = language === 'ar';
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wide">{isAr ? 'إلى العميل:' : 'Bill To:'}</p>
      <div className="font-bold text-slate-800">{invoice.customer_name}</div>
      {invoice.customer_vat_number && <div className="text-xs text-slate-500">{isAr ? 'الرقم الضريبي:' : 'VAT:'} {invoice.customer_vat_number}</div>}
      {invoice.customer_address && <div className="text-xs text-slate-500">{invoice.customer_address}</div>}
    </div>
  );
}

function InvoiceMetaBlock({ invoice, language }) {
  const isAr = language === 'ar';
  return (
    <div className="text-sm space-y-1">
      <div className="flex gap-2">
        <span className="text-slate-400 min-w-[80px]">{isAr ? 'رقم الفاتورة:' : 'Invoice #:'}</span>
        <span className="font-semibold text-slate-800" dir="ltr">{invoice.invoice_number}</span>
      </div>
      {invoice.invoice_counter_number && (
        <div className="flex gap-2">
          <span className="text-slate-400 min-w-[80px]">{isAr ? 'الرقم التسلسلي:' : 'Counter:'}</span>
          <span className="font-semibold text-slate-800" dir="ltr">{invoice.invoice_counter_number}</span>
        </div>
      )}
      <div className="flex gap-2">
        <span className="text-slate-400 min-w-[80px]">{isAr ? 'التاريخ:' : 'Date:'}</span>
        <span className="font-semibold text-slate-800" dir="ltr">{invoice.date}</span>
      </div>
      {invoice.time && (
        <div className="flex gap-2">
          <span className="text-slate-400 min-w-[80px]">{isAr ? 'الوقت:' : 'Time:'}</span>
          <span className="font-semibold text-slate-800" dir="ltr">{invoice.time}</span>
        </div>
      )}
      {invoice.due_date && (
        <div className="flex gap-2">
          <span className="text-slate-400 min-w-[80px]">{isAr ? 'الاستحقاق:' : 'Due:'}</span>
          <span className="font-semibold text-slate-800" dir="ltr">{invoice.due_date}</span>
        </div>
      )}
      <div className="flex gap-2">
        <span className="text-slate-400 min-w-[80px]">{isAr ? 'نوع الفاتورة:' : 'Type:'}</span>
        <span className="font-semibold text-slate-800">{invoice.invoice_type === 'standard' ? (isAr ? 'ضريبية اعتيادية' : 'Standard') : (isAr ? 'مبسطة' : 'Simplified')}</span>
      </div>
    </div>
  );
}

function QRSection({ invoice, language }) {
  const isAr = language === 'ar';
  if (!invoice.qr_code) return null;
  return (
    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
      <img src={invoice.qr_code} alt="QR ZATCA" className="w-28 h-28" />
      <div className="text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">{isAr ? 'رمز الاستجابة السريعة (ZATCA)' : 'ZATCA QR Code'}</p>
        <p>{isAr ? 'امسح الرمز للتحقق من صحة الفاتورة' : 'Scan to verify invoice authenticity'}</p>
        {invoice.zatca_uuid && <p className="text-[10px] text-slate-400 font-mono">{invoice.zatca_uuid}</p>}
      </div>
    </div>
  );
}

function ExtraTexts({ style, language }) {
  const isAr = language === 'ar';
  if (!style?.customNotes && !style?.returnPolicy && !style?.termsText) return null;
  return (
    <div className="mt-4 space-y-2">
      {style.customNotes && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs font-semibold text-amber-700 mb-1">{isAr ? 'ملاحظات:' : 'Notes:'}</p>
          <p className="text-xs text-amber-800 whitespace-pre-wrap">{style.customNotes}</p>
        </div>
      )}
      {style.returnPolicy && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs font-semibold text-slate-600 mb-1">{isAr ? 'سياسة الاستبدال والإرجاع:' : 'Return Policy:'}</p>
          <p className="text-xs text-slate-500 whitespace-pre-wrap">{style.returnPolicy}</p>
        </div>
      )}
      {style.termsText && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs font-semibold text-slate-600 mb-1">{isAr ? 'الشروط والأحكام:' : 'Terms & Conditions:'}</p>
          <p className="text-xs text-slate-500 whitespace-pre-wrap">{style.termsText}</p>
        </div>
      )}
    </div>
  );
}

function Footer({ style, language }) {
  if (style?.showFooter === false) return null;
  const isAr = language === 'ar';
  return (
    <div className="mt-6 pt-3 border-t border-slate-100 text-center">
      <p className="text-xs text-slate-400">
        {isAr ? 'صدرت بواسطة نظام المحاسب الذكي - ' : 'Generated by Smart Accountant - '}
        <span className="font-semibold">RikazAi.com</span>
      </p>
    </div>
  );
}

// ===== القوالب =====

// CLASSIC
function ClassicTemplate({ invoice, companyInfo, style, language }) {
  const pc = style?.primaryColor || '#2563eb';
  const isAr = language === 'ar';
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm" dir="rtl">
      <div className="flex justify-between items-start mb-6 pb-6" style={{ borderBottom: `2px solid ${pc}` }}>
        <CompanyBlock companyInfo={companyInfo} logoSize={style?.logoSize || 'h-16'} language={language} />
        <div className="text-left space-y-2">
          <h1 className="text-3xl font-black" style={{ color: pc }}>{isAr ? 'فاتورة ضريبية' : 'TAX INVOICE'}</h1>
          <ZATCABadge invoice={invoice} language={language} primaryColor={pc} />
          <InvoiceMetaBlock invoice={invoice} language={language} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6 p-4 rounded-lg" style={{ backgroundColor: `${pc}08` }}>
        <CustomerBlock invoice={invoice} language={language} />
        <div className="text-left">
          {invoice.payment_method && (
            <div className="text-sm">
              <span className="text-slate-400">{isAr ? 'طريقة الدفع: ' : 'Payment: '}</span>
              <span className="font-medium text-slate-700">
                {{ cash: isAr?'نقداً':'Cash', bank_transfer: isAr?'تحويل':'Transfer', credit_card: isAr?'بطاقة':'Card', other: isAr?'أخرى':'Other' }[invoice.payment_method] || invoice.payment_method}
              </span>
            </div>
          )}
        </div>
      </div>

      <InvoiceTable invoice={invoice} primaryColor={pc} tableStyle={style?.tableStyle} language={language} />
      <InvoiceTotals invoice={invoice} primaryColor={pc} language={language} />

      {invoice.notes && (
        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${pc}08` }}>
          <p className="text-xs text-slate-500">{invoice.notes}</p>
        </div>
      )}

      <ExtraTexts style={style} language={language} />
      {style?.showQr !== false && <QRSection invoice={invoice} language={language} />}
      <Footer style={style} language={language} />
    </div>
  );
}

// MODERN
function ModernTemplate({ invoice, companyInfo, style, language }) {
  const pc = style?.primaryColor || '#2563eb';
  const isAr = language === 'ar';
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden" dir="rtl">
      <div className="h-2" style={{ backgroundColor: pc }} />
      <div className="p-8">
        <div className="flex justify-between items-start mb-8">
          <CompanyBlock companyInfo={companyInfo} logoSize={style?.logoSize || 'h-16'} language={language} />
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: pc }}>{isAr ? 'فاتورة ضريبية' : 'TAX INVOICE'}</h1>
            <ZATCABadge invoice={invoice} language={language} primaryColor={pc} />
            <div className="mt-2">
              <InvoiceMetaBlock invoice={invoice} language={language} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="pr-4" style={{ borderRight: `4px solid ${pc}` }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: pc }}>{isAr ? 'العميل' : 'BILL TO'}</p>
            <CustomerBlock invoice={invoice} language={language} />
          </div>
          <div className="pl-4" style={{ borderLeft: `4px solid ${pc}` }}>
            {invoice.payment_method && (
              <div className="text-sm mt-1">
                <span className="text-slate-400 text-xs uppercase font-bold tracking-widest block mb-1">{isAr ? 'طريقة الدفع' : 'PAYMENT'}</span>
                <span className="font-medium text-slate-700">
                  {{ cash: isAr?'نقداً':'Cash', bank_transfer: isAr?'تحويل':'Transfer', credit_card: isAr?'بطاقة':'Card', other: isAr?'أخرى':'Other' }[invoice.payment_method] || ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <InvoiceTable invoice={invoice} primaryColor={pc} tableStyle={style?.tableStyle} language={language} />
        <InvoiceTotals invoice={invoice} primaryColor={pc} language={language} />

        {invoice.notes && (
          <div className="mt-4 border-r-4 pr-3" style={{ borderColor: pc }}>
            <p className="text-xs text-slate-500">{invoice.notes}</p>
          </div>
        )}

        <ExtraTexts style={style} language={language} />
        {style?.showQr !== false && <QRSection invoice={invoice} language={language} />}
        <Footer style={style} language={language} />
      </div>
    </div>
  );
}

// ELEGANT
function ElegantTemplate({ invoice, companyInfo, style, language }) {
  const pc = style?.primaryColor || '#2563eb';
  const isAr = language === 'ar';
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden" dir="rtl" style={{ border: `1px solid ${pc}30` }}>
      <div className="p-6" style={{ background: `linear-gradient(135deg, ${pc}15 0%, ${pc}05 100%)`, borderBottom: `1px solid ${pc}20` }}>
        <div className="flex justify-between items-center">
          <CompanyBlock companyInfo={companyInfo} logoSize={style?.logoSize || 'h-16'} language={language} />
          <div className="text-left">
            <p className="text-4xl font-thin tracking-widest" style={{ color: pc }}>{isAr ? 'فاتورة' : 'INVOICE'}</p>
            <p className="text-sm text-slate-400 mt-1">{isAr ? 'ضريبية' : 'Tax Invoice'}</p>
            <div className="mt-2">
              <ZATCABadge invoice={invoice} language={language} primaryColor={pc} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-6 pb-4" style={{ borderBottom: `1px solid ${pc}20` }}>
          <CustomerBlock invoice={invoice} language={language} />
          <div className="text-left">
            <InvoiceMetaBlock invoice={invoice} language={language} />
          </div>
        </div>

        <InvoiceTable invoice={invoice} primaryColor={pc} tableStyle={style?.tableStyle} language={language} />
        <InvoiceTotals invoice={invoice} primaryColor={pc} language={language} />

        {invoice.notes && (
          <div className="mt-4 p-3 rounded-lg" style={{ background: `${pc}08`, border: `1px solid ${pc}20` }}>
            <p className="text-xs text-slate-500">{invoice.notes}</p>
          </div>
        )}

        <ExtraTexts style={style} language={language} />
        {style?.showQr !== false && <QRSection invoice={invoice} language={language} />}
        <Footer style={style} language={language} />
      </div>
    </div>
  );
}

// MINIMAL
function MinimalTemplate({ invoice, companyInfo, style, language }) {
  const pc = style?.primaryColor || '#2563eb';
  const isAr = language === 'ar';
  return (
    <div className="bg-white p-8 rounded-xl" dir="rtl">
      <div className="flex justify-between items-start mb-8">
        <CompanyBlock companyInfo={companyInfo} logoSize={style?.logoSize || 'h-14'} language={language} />
        <div className="text-left">
          <h1 className="text-5xl font-thin text-slate-200 select-none">{isAr ? 'فاتورة' : 'INV'}</h1>
          <p className="text-sm font-bold text-slate-700 -mt-2">#{invoice.invoice_number}</p>
          <div className="mt-2"><ZATCABadge invoice={invoice} language={language} primaryColor={pc} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8 p-4 border border-slate-100 rounded-lg">
        <CustomerBlock invoice={invoice} language={language} />
        <div className="text-left">
          <InvoiceMetaBlock invoice={invoice} language={language} />
        </div>
      </div>

      <InvoiceTable invoice={invoice} primaryColor={pc} tableStyle={style?.tableStyle} language={language} />

      <div className="flex justify-end mt-6">
        <div className="p-5 rounded-xl" style={{ backgroundColor: `${pc}10`, border: `1px solid ${pc}20` }}>
          {invoice.apply_vat && (
            <div className="flex justify-between gap-10 text-xs text-slate-400 mb-1">
              <span>{isAr ? 'الضريبة' : 'VAT'}</span>
              <span dir="ltr">{(invoice.tax_amount || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex items-baseline gap-3 justify-between">
            <span className="text-xs text-slate-500">{isAr ? 'الإجمالي' : 'TOTAL'}</span>
            <span className="text-2xl font-bold" style={{ color: pc }} dir="ltr">
              {(invoice.total || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal mr-1">{isAr ? 'ر.س' : 'SAR'}</span>
            </span>
          </div>
        </div>
      </div>

      {invoice.notes && <p className="mt-4 text-xs text-slate-400 border-t pt-3">{invoice.notes}</p>}
      <ExtraTexts style={style} language={language} />
      {style?.showQr !== false && <QRSection invoice={invoice} language={language} />}
      <Footer style={style} language={language} />
    </div>
  );
}

// ===== المحرك الرئيسي =====
export function InvoiceTemplateRenderer({ invoice, companyInfo, style, language }) {
  const template = style?.template || 'classic';
  const props = { invoice, companyInfo, style, language };
  if (template === 'modern')  return <ModernTemplate {...props} />;
  if (template === 'elegant') return <ElegantTemplate {...props} />;
  if (template === 'minimal') return <MinimalTemplate {...props} />;
  return <ClassicTemplate {...props} />;
}