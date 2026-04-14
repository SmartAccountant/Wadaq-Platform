import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

/**
 * المرحلة الثانية من ZATCA - إرسال الفواتير إلى منصة فاتورة
 * يتطلب: بيانات الاعتماد من ZATCA والشهادة الرقمية
 */

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoice_id } = await req.json();

    if (!invoice_id) {
      return Response.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // جلب بيانات الفاتورة
    const invoice = await Wadaq.asServiceRole.entities.Invoice.get(invoice_id);
    
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // التحقق من وجود بيانات ZATCA المطلوبة
    if (!invoice.zatca_uuid || !invoice.invoice_hash || !invoice.cryptographic_stamp) {
      return Response.json({ 
        error: 'Invoice is missing required ZATCA Phase 1 data',
        details: 'Please regenerate the invoice with Phase 1 compliance first'
      }, { status: 400 });
    }

    // جلب بيانات الاعتماد من Secrets
    const zatcaConfig = {
      apiUrl: Deno.env.get('ZATCA_API_BASE_URL'),
      username: Deno.env.get('ZATCA_USERNAME'),
      password: Deno.env.get('ZATCA_PASSWORD'),
      otpSecret: Deno.env.get('ZATCA_OTP_SECRET'),
      certificate: Deno.env.get('ZATCA_CERTIFICATE'),
      privateKey: Deno.env.get('ZATCA_PRIVATE_KEY'),
    };

    // التحقق من وجود جميع البيانات المطلوبة
    const missingSecrets = [];
    if (!zatcaConfig.apiUrl) missingSecrets.push('ZATCA_API_BASE_URL');
    if (!zatcaConfig.username) missingSecrets.push('ZATCA_USERNAME');
    if (!zatcaConfig.password) missingSecrets.push('ZATCA_PASSWORD');
    if (!zatcaConfig.certificate) missingSecrets.push('ZATCA_CERTIFICATE');
    if (!zatcaConfig.privateKey) missingSecrets.push('ZATCA_PRIVATE_KEY');

    if (missingSecrets.length > 0) {
      return Response.json({
        error: 'Missing ZATCA configuration',
        details: `Please set the following secrets: ${missingSecrets.join(', ')}`,
        status: 'not_configured'
      }, { status: 400 });
    }

    // تحديث حالة الفاتورة إلى "قيد الإرسال"
    await Wadaq.asServiceRole.entities.Invoice.update(invoice_id, {
      zatca_submission_status: 'pending'
    });

    try {
      // 1. توليد OTP (إذا لزم الأمر)
      let otp = null;
      if (zatcaConfig.otpSecret) {
        otp = generateTOTP(zatcaConfig.otpSecret);
      }

      // 2. إنشاء رأس المصادقة (Authentication Header)
      const authHeader = 'Basic ' + btoa(`${zatcaConfig.username}:${zatcaConfig.password}`);

      // 3. إنشاء XML الموقع للفاتورة
      const signedXML = await signInvoiceXML(invoice, zatcaConfig);

      // 4. تحديد نوع الإرسال (Clearance أو Reporting)
      const endpoint = invoice.invoice_type === 'standard' 
        ? '/invoices/clearance/single'  // للفواتير الضريبية
        : '/invoices/reporting/single'; // للفواتير المبسطة

      // 5. إرسال الفاتورة إلى ZATCA
      const zatcaResponse = await fetch(`${zatcaConfig.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
          'Accept-Language': 'ar',
          'Content-Type': 'application/json',
          ...(otp && { 'OTP': otp })
        },
        body: JSON.stringify({
          invoiceHash: invoice.invoice_hash,
          uuid: invoice.zatca_uuid,
          invoice: btoa(signedXML) // XML موقع ومشفر بـ Base64
        })
      });

      const responseData = await zatcaResponse.json();

      console.log('ZATCA Response:', responseData);

      // 6. معالجة الاستجابة
      let submissionStatus = 'rejected';
      let clearanceStatus = null;

      if (zatcaResponse.ok) {
        if (responseData.clearanceStatus === 'CLEARED') {
          submissionStatus = 'accepted';
          clearanceStatus = 'CLEARED';
        } else if (responseData.reportingStatus === 'REPORTED') {
          submissionStatus = 'accepted';
          clearanceStatus = 'REPORTED';
        } else if (responseData.validationResults?.warningMessages?.length > 0) {
          submissionStatus = 'warning';
        }
      }

      // 7. حفظ النتيجة في قاعدة البيانات
      await Wadaq.asServiceRole.entities.Invoice.update(invoice_id, {
        zatca_submission_status: submissionStatus,
        zatca_submission_date: new Date().toISOString(),
        zatca_clearance_status: clearanceStatus,
        zatca_irn: responseData.clearedInvoice || responseData.reportedInvoice || null,
        zatca_signed_xml: responseData.clearedInvoice ? atob(responseData.clearedInvoice) : null,
        zatca_response: {
          clearanceStatus: responseData.clearanceStatus,
          reportingStatus: responseData.reportingStatus,
          validationResults: responseData.validationResults || {},
          errorMessages: responseData.validationResults?.errorMessages || [],
          warningMessages: responseData.validationResults?.warningMessages || []
        }
      });

      return Response.json({
        success: true,
        status: submissionStatus,
        clearanceStatus: clearanceStatus,
        irn: responseData.clearedInvoice || responseData.reportedInvoice,
        validationResults: responseData.validationResults,
        message: submissionStatus === 'accepted' 
          ? 'تم إرسال الفاتورة بنجاح إلى ZATCA'
          : submissionStatus === 'warning'
          ? 'تم إرسال الفاتورة مع تحذيرات'
          : 'تم رفض الفاتورة من ZATCA'
      });

    } catch (apiError) {
      console.error('ZATCA API Error:', apiError);
      
      // حفظ حالة الخطأ
      await Wadaq.asServiceRole.entities.Invoice.update(invoice_id, {
        zatca_submission_status: 'rejected',
        zatca_response: {
          errorMessages: [apiError.message]
        }
      });

      return Response.json({
        success: false,
        error: 'Failed to submit to ZATCA',
        details: apiError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

/**
 * توقيع XML الفاتورة بالشهادة الرقمية
 */
async function signInvoiceXML(invoice, zatcaConfig) {
  // هنا يتم توقيع XML بالشهادة الرقمية
  // في الواقع يتطلب مكتبة crypto متقدمة للتوقيع الرقمي
  
  // للتطوير المبدئي، نستخدم XML من المرحلة الأولى
  const xmlContent = invoice.zatca_signed_xml || generateUBLXML(invoice);
  
  // TODO: إضافة التوقيع الرقمي الفعلي باستخدام:
  // - الشهادة الرقمية (certificate)
  // - المفتاح الخاص (private key)
  // - معيار XMLDSig
  
  return xmlContent;
}

/**
 * توليد UBL XML للفاتورة
 */
function generateUBLXML(invoice) {
  // استخدام نفس الدالة من generateZATCACompliantInvoice
  const timestamp = new Date(invoice.date + 'T' + (invoice.time || '00:00:00')).toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${invoice.invoice_number}</cbc:ID>
  <cbc:UUID>${invoice.zatca_uuid}</cbc:UUID>
  <cbc:IssueDate>${invoice.date}</cbc:IssueDate>
  <cbc:IssueTime>${invoice.time || '00:00:00'}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>${invoice.invoice_type === 'standard' ? '388' : '388'}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">1009073537</cbc:ID>
      </cac:PartyIdentification>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${invoice.tax_amount || 0}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="SAR">${invoice.subtotal || 0}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${invoice.total || 0}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${invoice.total || 0}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
}

/**
 * توليد TOTP للمصادقة الثنائية
 */
function generateTOTP(secret) {
  // TODO: تنفيذ خوارزمية TOTP
  // يتطلب مكتبة مثل otpauth
  return '000000'; // placeholder
}