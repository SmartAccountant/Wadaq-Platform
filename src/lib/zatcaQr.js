/**
 * توليد رمز الاستجابة السريعة للفاتورة الضريبية المبسّطة — المرحلة الأولى (ZATCA KSA).
 * الترميز: TLV ثم Base64، ثم وضع الناتج كنص داخل رمز QR (كما تتطلب الهيئة).
 */

/** عرض افتراضي لمعاينة الفاتورة A4 / الشاشة */
export const ZATCA_QR_WIDTH_SCREEN = 200;

/** عرض مناسب للإيصال الحراري (سهولة المسح بالكاميرا) */
export const ZATCA_QR_WIDTH_THERMAL = 128;

/**
 * الرقم الضريبي الافتراضي للاختبار المحلي فقط — يجب استبداله من إعدادات المنشأة في الإنتاج.
 */
const DEFAULT_VAT_FALLBACK = "300000000000003";

/**
 * دمج الرقم الضريبي للمنشأة من الفاتورة ثم من بيانات المنشأة لضمان صحة حقل TLV (Tag 2).
 * يدعم حقولاً شائعة إن وُجدت على كائن الفاتورة.
 */
export function resolveOrganizationVatNumber(invoice, companyInfo) {
  const fromInvoice =
    invoice?.company_vat_number ??
    invoice?.seller_vat_number ??
    invoice?.organization_vat_number ??
    invoice?.vat_registration_number ??
    invoice?.org_vat_number ??
    "";
  const fromCompany = companyInfo?.vat_number ?? "";
  const raw = String(fromInvoice || fromCompany || "").replace(/\D/g, "").slice(0, 15);
  return raw;
}

/** للعرض على الفاتورة: نفس الرقم المستخدم في QR (مع احتياطي محلي إن وُجد النقص). */
export function getOrganizationVatForDisplay(invoice, companyInfo) {
  return resolveOrganizationVatNumber(invoice, companyInfo) || DEFAULT_VAT_FALLBACK;
}

/**
 * @param {object} p
 * @param {string} p.sellerName
 * @param {string} p.vatNumber رقم تسجيل ضريبي (يفضّل 15 رقماً)
 * @param {string} p.timestampIso وقت الفاتورة بصيغة ISO 8601
 * @param {number|string} p.invoiceTotalWithVat إجمالي الفاتورة شامل الضريبة
 * @param {number|string} p.vatTotal مبلغ ضريبة القيمة المضافة
 * @returns {string} سلسلة Base64 للـ TLV (محتوى رمز QR كنص)
 */
export function buildZatcaPhase1TlvBase64({
  sellerName,
  vatNumber,
  timestampIso,
  invoiceTotalWithVat,
  vatTotal,
}) {
  const enc = new TextEncoder();

  function tlv(tag, value) {
    const valueBytes = enc.encode(String(value ?? ""));
    if (valueBytes.length > 255) {
      throw new Error("ZATCA TLV: قيمة أطول من 255 بايت");
    }
    const buf = new Uint8Array(2 + valueBytes.length);
    buf[0] = tag & 0xff;
    buf[1] = valueBytes.length & 0xff;
    buf.set(valueBytes, 2);
    return buf;
  }

  const vatClean = String(vatNumber ?? "")
    .replace(/\D/g, "")
    .slice(0, 15);

  const parts = [
    tlv(1, sellerName ?? ""),
    tlv(2, vatClean),
    tlv(3, timestampIso ?? ""),
    tlv(4, Number(invoiceTotalWithVat ?? 0).toFixed(2)),
    tlv(5, Number(vatTotal ?? 0).toFixed(2)),
  ];

  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    merged.set(p, offset);
    offset += p.length;
  }

  let binary = "";
  for (let i = 0; i < merged.length; i++) {
    binary += String.fromCharCode(merged[i]);
  }
  return btoa(binary);
}

/**
 * تحويل محتوى TLV (Base64) إلى صورة PNG كـ data URL — ألوان سوداء على أبيض (متوافق مع الطباعة).
 * @param {string} tlvBase64String
 * @param {{ width?: number; margin?: number }} [options]
 */
export async function zatcaTlvBase64ToQrDataUrl(tlvBase64String, options = {}) {
  const { width = ZATCA_QR_WIDTH_SCREEN, margin = 1 } = options;
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(tlvBase64String, {
    errorCorrectionLevel: "M",
    width,
    margin,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

/**
 * توليد رمز ZATCA من حقول استدعاء الخادم (مثل generateZATCAQR).
 */
export async function generateZatcaQrFromInvokePayload(payload) {
  const tlvB64 = buildZatcaPhase1TlvBase64({
    sellerName: payload.seller_name ?? "",
    vatNumber: payload.vat_number ?? "",
    timestampIso: payload.timestamp,
    invoiceTotalWithVat: payload.total_with_vat ?? 0,
    vatTotal: payload.vat_amount ?? 0,
  });
  const qr_code = await zatcaTlvBase64ToQrDataUrl(tlvB64, { width: ZATCA_QR_WIDTH_SCREEN });
  return { tlv_base64: tlvB64, qr_code };
}

/**
 * توليد رمز QR للفاتورة من بيانات الفاتورة والمنشأة دائماً (بدون الاعتماد على صور بدائية قديمة).
 * يُدمَج الرقم الضريبي من الفاتورة أو المنشأة، وإن وُجد النقص يُستخدم رقم احتياطي للاختبار المحلي فقط.
 *
 * @param {object} invoice
 * @param {object|null} companyInfo
 * @param {{ width?: number }} [options] width للحراري استخدم ZATCA_QR_WIDTH_THERMAL (128)
 */
export async function getOrCreateInvoiceZatcaQrDataUrl(invoice, companyInfo, options = {}) {
  const { width = ZATCA_QR_WIDTH_SCREEN } = options;

  const sellerName =
    companyInfo?.name ||
    companyInfo?.name_en ||
    invoice?.seller_name ||
    "المنشأة";

  let vatForQr = resolveOrganizationVatNumber(invoice, companyInfo);
  if (!vatForQr) {
    vatForQr = DEFAULT_VAT_FALLBACK;
  }

  let timestampIso;
  try {
    const d = invoice?.date
      ? new Date(`${invoice.date}T${invoice?.time || "12:00:00"}`)
      : new Date();
    timestampIso = Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    timestampIso = new Date().toISOString();
  }

  const tlvB64 = buildZatcaPhase1TlvBase64({
    sellerName,
    vatNumber: vatForQr,
    timestampIso,
    invoiceTotalWithVat: invoice?.total ?? 0,
    vatTotal: invoice?.tax_amount ?? 0,
  });

  return zatcaTlvBase64ToQrDataUrl(tlvB64, { width });
}
