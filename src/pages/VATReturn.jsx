import React, { useState, useMemo } from "react";
import { Wadaq } from "@/api/WadaqCore";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageContext";
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw, Calculator, ChevronDown } from "lucide-react";
import PlanGuard from "@/components/auth/PlanGuard";

const PERIODS = [
  { label: "سنوي (كامل العام)", labelEn: "Annual (Full Year)", months: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { label: "الربع الأول (يناير - مارس)", labelEn: "Q1 (Jan - Mar)", months: [1, 2, 3] },
  { label: "الربع الثاني (أبريل - يونيو)", labelEn: "Q2 (Apr - Jun)", months: [4, 5, 6] },
  { label: "الربع الثالث (يوليو - سبتمبر)", labelEn: "Q3 (Jul - Sep)", months: [7, 8, 9] },
  { label: "الربع الرابع (أكتوبر - ديسمبر)", labelEn: "Q4 (Oct - Dec)", months: [10, 11, 12] },
];

const YEARS = [2026, 2025, 2024, 2023];

function VATReturnContent() {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);

  const period = PERIODS[selectedPeriodIdx];

  // Fetch invoices and expenses - filtered by current user
  const { data: invoices = [], isLoading: loadingInv } = useQuery({
    queryKey: ['invoices-vat'],
    queryFn: async () => {
      const user = await Wadaq.auth.me();
      return Wadaq.entities.Invoice.filter({ created_by: user.email });
    }
  });
  const { data: expenses = [], isLoading: loadingExp } = useQuery({
    queryKey: ['expenses-vat'],
    queryFn: async () => {
      const user = await Wadaq.auth.me();
      return Wadaq.entities.Expense.filter({ created_by: user.email });
    }
  });
  const { data: org } = useQuery({
    queryKey: ['org'],
    queryFn: async () => {
      const user = await Wadaq.auth.me();
      const orgs = await Wadaq.entities.Organization.filter({ owner_email: user.email });
      return orgs[0];
    }
  });

  // Filter by period
  const filtered = useMemo(() => {
    const inPeriod = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === selectedYear && period.months.includes(d.getMonth() + 1);
    };

    const periodInvoices = invoices.filter(inv => inPeriod(inv.date) && inv.status !== 'cancelled');
    const periodExpenses = expenses.filter(exp => inPeriod(exp.date));

    // ── Box 1: Standard-rated supplies (المبيعات الخاضعة)
    const standardSales = periodInvoices.filter(inv => inv.apply_vat !== false);
    const box1_sales = standardSales.reduce((s, inv) => s + (inv.subtotal || 0), 0);
    const box1_vat = standardSales.reduce((s, inv) => s + (inv.tax_amount || 0), 0);

    // ── Box 2: Zero-rated supplies (المبيعات الصفرية)
    const zeroRated = periodInvoices.filter(inv => inv.apply_vat === false);
    const box2_sales = zeroRated.reduce((s, inv) => s + (inv.total || 0), 0);

    // ── Box 3: Exempt supplies — 0 for now
    const box3_sales = 0;

    // ── Box 4: Total sales
    const box4_total = box1_sales + box2_sales + box3_sales;

    // ── Box 5: Total output VAT
    const box5_vat = box1_vat;

    // ── Box 6: Purchases with recoverable VAT (المشتريات)
    const vatExpenses = periodExpenses.filter(exp => exp.payment_method !== 'other');
    const box6_purchases = vatExpenses.reduce((s, exp) => s + (exp.amount || 0), 0);
    const box6_vat = box6_purchases * 0.15; // assumed 15% recoverable

    // ── Box 7: Total input VAT
    const box7_vat = box6_vat;

    // ── Net VAT
    const net_vat = box5_vat - box7_vat;

    return {
      periodInvoices,
      periodExpenses,
      box1_sales, box1_vat,
      box2_sales,
      box3_sales,
      box4_total,
      box5_vat,
      box6_purchases, box6_vat,
      box7_vat,
      net_vat,
      totalInvoices: periodInvoices.length,
      totalExpenses: vatExpenses.length
    };
  }, [invoices, expenses, selectedYear, selectedPeriodIdx]);

  const loading = loadingInv || loadingExp;

  const handlePrint = () => {
    window.print();
  };

  const fmt = (n) => (n || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm 12mm; }
          body * { visibility: hidden !important; }
          #vat-print-area, #vat-print-area * { visibility: visible !important; }
          #vat-print-area {
            position: fixed !important;
            inset: 0 !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          #vat-print-area .bg-white { background: white !important; }
          #vat-print-area .rounded-2xl { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
          #vat-print-area .shadow-sm { box-shadow: none !important; }
          #vat-print-area table { font-size: 9pt !important; }
          #vat-print-area th, #vat-print-area td { padding: 3px 5px !important; }
          #vat-print-area h3 { font-size: 10pt !important; margin-bottom: 4px !important; }
          #vat-print-area .bg-gradient-to-r { padding: 8px 14px !important; }
          #vat-print-area .text-4xl { font-size: 20pt !important; }
          #vat-print-area .text-xl { font-size: 11pt !important; }
          #vat-print-area .p-5 { padding: 8px 12px !important; }
          #vat-print-area .p-6 { padding: 8px 12px !important; }
          #vat-print-area .mt-6 { margin-top: 6px !important; }
          #vat-print-area .mt-8 { margin-top: 8px !important; }
          #vat-print-area .pt-6 { padding-top: 6px !important; }
          #vat-print-area .h-12 { height: 20px !important; }
          #vat-print-area .gap-8 { gap: 16px !important; }
          #vat-print-area .p-4 { padding: 6px 10px !important; }
          #vat-print-area .mb-4 { margin-bottom: 4px !important; }
          #vat-print-area .mb-3 { margin-bottom: 3px !important; }
          #vat-print-area ul { margin: 0 !important; }
          #vat-print-area ul li { font-size: 8pt !important; }
          #vat-print-area .grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
          #vat-print-area .bg-green-700, #vat-print-area .bg-gradient-to-r {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {ar ? '📋 الإقرار الضريبي - ضريبة القيمة المضافة' : '📋 VAT Return'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {ar ? 'وفقاً لنظام هيئة الزكاة والضريبة والجمارك (ZATCA)' : 'Saudi Zakat, Tax and Customs Authority (ZATCA)'}
            </p>
          </div>
          <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Printer className="w-4 h-4" />
            {ar ? 'طباعة الإقرار' : 'Print Return'}
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="max-w-4xl mx-auto px-6 py-4 no-print">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-700">{ar ? 'الفترة الضريبية:' : 'Tax Period:'}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map((p, i) => (
              <button key={i} onClick={() => setSelectedPeriodIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedPeriodIdx === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                {ar ? p.label.split(' ')[0] + ' ' + p.label.split(' ')[1] : p.labelEn.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="relative">
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 pr-8 focus:outline-none focus:border-indigo-400">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
          {loading && <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
        </div>
      </div>

      {/* Summary Cards - no print */}
      <div className="max-w-4xl mx-auto px-6 pb-4 no-print">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-xs text-emerald-600 mb-1">{ar ? 'إجمالي ضريبة المخرجات' : 'Output VAT'}</p>
            <p className="text-xl font-bold text-emerald-700">{fmt(filtered.box5_vat)} {ar ? 'ر.س' : 'SAR'}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-xs text-blue-600 mb-1">{ar ? 'ضريبة المدخلات القابلة للاسترداد' : 'Input VAT'}</p>
            <p className="text-xl font-bold text-blue-700">{fmt(filtered.box7_vat)} {ar ? 'ر.س' : 'SAR'}</p>
          </div>
          <div className={`${filtered.net_vat >= 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'} border rounded-xl p-4 text-center`}>
            <p className={`text-xs ${filtered.net_vat >= 0 ? 'text-amber-600' : 'text-green-600'} mb-1`}>{ar ? 'صافي الضريبة المستحقة' : 'Net VAT Due'}</p>
            <p className={`text-xl font-bold ${filtered.net_vat >= 0 ? 'text-amber-700' : 'text-green-700'}`}>{fmt(Math.abs(filtered.net_vat))} {ar ? 'ر.س' : 'SAR'}</p>
            {filtered.net_vat < 0 && <p className="text-xs text-green-600 mt-0.5">{ar ? '(مبلغ قابل للاسترداد)' : '(Refundable)'}</p>}
          </div>
        </div>
      </div>

      {/* ─── PRINT AREA ─── */}
      <div id="vat-print-area" className="max-w-4xl mx-auto px-6 pb-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Official Header */}
          <div className="bg-gradient-to-r from-green-700 to-green-800 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">{ar ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}</p>
                <h2 className="text-xl font-bold mt-0.5">{ar ? 'هيئة الزكاة والضريبة والجمارك' : 'Zakat, Tax and Customs Authority'}</h2>
                <p className="text-green-200 text-sm mt-1">{ar ? 'إقرار ضريبة القيمة المضافة' : 'VAT Return Form'}</p>
              </div>
              <div className="text-left">
                <div className="text-4xl font-bold opacity-30">ZATCA</div>
                <div className="text-green-200 text-sm mt-1 text-left">VAT-301</div>
              </div>
            </div>
          </div>

          {/* Taxpayer Info */}
          <div className="border-b border-gray-200 p-5 bg-gray-50">
            <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">{ar ? 'بيانات المكلّف' : 'Taxpayer Information'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label={ar ? 'اسم المنشأة' : 'Business Name'} value={org?.name || '—'} />
              {org?.name_en && <InfoRow label={ar ? 'الاسم بالإنجليزية' : 'English Name'} value={org.name_en} />}
              <InfoRow label={ar ? 'الرقم الضريبي (VAT)' : 'VAT Number'} value={org?.vat_number || '—'} />
              <InfoRow label={ar ? 'السجل التجاري' : 'CR Number'} value={org?.commercial_registration || '—'} />
              {org?.address && <InfoRow label={ar ? 'العنوان' : 'Address'} value={org.address} />}
              {org?.phone && <InfoRow label={ar ? 'الهاتف' : 'Phone'} value={org.phone} />}
              {org?.email && <InfoRow label={ar ? 'البريد الإلكتروني' : 'Email'} value={org.email} />}
              {org?.website && <InfoRow label={ar ? 'الموقع الإلكتروني' : 'Website'} value={org.website} />}
              <InfoRow label={ar ? 'الفترة الضريبية' : 'Tax Period'} value={`${ar ? period.label : period.labelEn} ${selectedYear}`} />
              <InfoRow label={ar ? 'تاريخ الإعداد' : 'Prepared Date'} value={new Date().toLocaleDateString('ar-SA')} />
              <InfoRow label={ar ? 'عدد الفواتير' : 'Invoice Count'} value={filtered.totalInvoices.toString()} />
            </div>
          </div>

          {/* VAT Return Table */}
          <div className="p-5">
            <h3 className="font-bold text-gray-700 mb-4">{ar ? 'تفاصيل الإقرار الضريبي' : 'VAT Return Details'}</h3>

            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-right font-bold text-gray-700 w-12">{ar ? 'الخانة' : 'Box'}</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-bold text-gray-700">{ar ? 'البيان' : 'Description'}</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 w-36">{ar ? 'المبلغ (ر.س)' : 'Amount (SAR)'}</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 w-36">{ar ? 'ضريبة القيمة المضافة (ر.س)' : 'VAT Amount (SAR)'}</th>
                </tr>
              </thead>
              <tbody>
                {/* Section A */}
                <tr className="bg-green-50">
                  <td colSpan={4} className="border border-gray-300 px-3 py-2 font-bold text-green-800 text-xs uppercase">
                    {ar ? 'أ. ضريبة المخرجات — المبيعات' : 'A. Output Tax — Sales'}
                  </td>
                </tr>
                <VATRow box="1" desc={ar ? 'التوريدات الخاضعة للضريبة بالنسبة الأساسية (15%)' : 'Standard-rated supplies (15%)'} amount={filtered.box1_sales} vat={filtered.box1_vat} />
                <VATRow box="2" desc={ar ? 'التوريدات الخاضعة للضريبة بنسبة الصفر (0%)' : 'Zero-rated supplies (0%)'} amount={filtered.box2_sales} vat={0} />
                <VATRow box="3" desc={ar ? 'التوريدات المعفاة من الضريبة' : 'Exempt supplies'} amount={filtered.box3_sales} vat={0} />
                <tr className="bg-green-100 font-bold">
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold">4</td>
                  <td className="border border-gray-300 px-3 py-2 font-bold text-gray-800">{ar ? 'إجمالي التوريدات' : 'Total Supplies'}</td>
                  <td className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-800 font-mono">{fmt(filtered.box4_total)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-left font-bold text-green-700 font-mono">{fmt(filtered.box5_vat)}</td>
                </tr>
                <tr className="bg-green-100 font-bold">
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold">5</td>
                  <td className="border border-gray-300 px-3 py-2 font-bold text-gray-800">{ar ? 'إجمالي ضريبة المخرجات المستحقة' : 'Total Output VAT Due'}</td>
                  <td className="border border-gray-300 px-3 py-2"></td>
                  <td className="border border-gray-300 px-3 py-2 text-left font-bold text-green-700 font-mono">{fmt(filtered.box5_vat)}</td>
                </tr>

                {/* Section B */}
                <tr className="bg-blue-50">
                  <td colSpan={4} className="border border-gray-300 px-3 py-2 font-bold text-blue-800 text-xs uppercase">
                    {ar ? 'ب. ضريبة المدخلات — المشتريات والمصروفات' : 'B. Input Tax — Purchases & Expenses'}
                  </td>
                </tr>
                <VATRow box="6" desc={ar ? 'المشتريات والمصروفات الخاضعة للضريبة (15%)' : 'Standard-rated purchases & expenses (15%)'} amount={filtered.box6_purchases} vat={filtered.box6_vat} />
                <tr className="bg-blue-100 font-bold">
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold">7</td>
                  <td className="border border-gray-300 px-3 py-2 font-bold text-gray-800">{ar ? 'إجمالي ضريبة المدخلات القابلة للاسترداد' : 'Total Recoverable Input VAT'}</td>
                  <td className="border border-gray-300 px-3 py-2"></td>
                  <td className="border border-gray-300 px-3 py-2 text-left font-bold text-blue-700 font-mono">{fmt(filtered.box7_vat)}</td>
                </tr>

                {/* Net */}
                <tr className={`${filtered.net_vat >= 0 ? 'bg-amber-50' : 'bg-emerald-50'} font-bold`}>
                  <td className="border-2 border-gray-400 px-3 py-3 text-center font-bold text-lg">8</td>
                  <td className="border-2 border-gray-400 px-3 py-3 font-bold text-gray-900 text-base">
                    {filtered.net_vat >= 0
                      ? (ar ? 'صافي الضريبة المستحقة السداد' : 'Net VAT Payable')
                      : (ar ? 'مبلغ ضريبة مستردة' : 'VAT Refundable Amount')}
                  </td>
                  <td className="border-2 border-gray-400 px-3 py-3"></td>
                  <td className={`border-2 border-gray-400 px-3 py-3 text-left font-bold text-xl font-mono ${filtered.net_vat >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {fmt(Math.abs(filtered.net_vat))}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Notes */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-xs font-bold text-yellow-800 mb-2">⚠️ {ar ? 'ملاحظات هامة:' : 'Important Notes:'}</p>
              <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                <li>{ar ? 'يُعدّ هذا الإقرار تلقائياً من بيانات الفواتير والمصروفات المُدخلة في النظام.' : 'This return is auto-calculated from your invoices and expenses.'}</li>
                <li>{ar ? 'يجب مراجعة الأرقام مع محاسبك قبل التقديم الرسمي عبر بوابة ZATCA.' : 'Review with your accountant before official submission via ZATCA portal.'}</li>
                <li>{ar ? 'الموعد النهائي للتقديم: اليوم الثلاثون من الشهر التالي لانتهاء الفترة الضريبية.' : 'Deadline: 30th day of the month following the tax period end.'}</li>
                <li>{ar ? 'رابط التقديم: zatca.gov.sa' : 'Submission portal: zatca.gov.sa'}</li>
              </ul>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="h-12 border-b-2 border-gray-300 mb-2"></div>
                <p className="text-xs text-gray-500">{ar ? 'توقيع المُعِد' : 'Preparer Signature'}</p>
              </div>
              <div className="text-center">
                <div className="h-12 border-b-2 border-gray-300 mb-2"></div>
                <p className="text-xs text-gray-500">{ar ? 'توقيع المدير المالي / صاحب العمل' : 'CFO / Owner Signature'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VATReturn() {
  const { language } = useLanguage();
  return (
    <PlanGuard requiredPlans={['advanced', 'smart', 'golden']} featureName={language === 'ar' ? 'الإقرار الضريبي' : 'VAT Return'}>
      <VATReturnContent />
    </PlanGuard>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-500 w-32 shrink-0">{label}:</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function VATRow({ box, desc, amount, vat }) {
  const fmt = (n) => (n || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <tr className="hover:bg-gray-50">
      <td className="border border-gray-300 px-3 py-2 text-center text-gray-600 font-medium">{box}</td>
      <td className="border border-gray-300 px-3 py-2 text-gray-700">{desc}</td>
      <td className="border border-gray-300 px-3 py-2 text-left text-gray-800 font-mono">{fmt(amount)}</td>
      <td className="border border-gray-300 px-3 py-2 text-left text-gray-800 font-mono">{fmt(vat)}</td>
    </tr>
  );
}