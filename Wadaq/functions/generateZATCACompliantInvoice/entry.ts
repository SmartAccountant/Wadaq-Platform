import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceData } = await req.json();

    // 1. توليد UUID فريد
    const zatca_uuid = crypto.randomUUID();

    // 2. الحصول على الرقم التسلسلي
    const allInvoices = await Wadaq.entities.Invoice.list();
    const invoice_counter_number = allInvoices.length + 1;

    // 3. الحصول على hash الفاتورة السابقة
    const sortedInvoices = allInvoices
      .filter(inv => inv.invoice_counter_number)
      .sort((a, b) => b.invoice_counter_number - a.invoice_counter_number);
    
    const previous_invoice_hash = sortedInvoices.length > 0 
      ? sortedInvoices[0].invoice_hash 
      : '0'.repeat(64); // Genesis hash

    // 4. إنشاء hash لهذه الفاتورة
    const invoiceString = JSON.stringify({
      invoice_number: invoiceData.invoice_number,
      date: invoiceData.date,
      time: invoiceData.time,
      total: invoiceData.total,
      vat: invoiceData.tax_amount,
      counter: invoice_counter_number,
      previous: previous_invoice_hash
    });
    
    const invoice_hash = createHash('sha256')
      .update(invoiceString)
      .digest('hex');

    // 5. توليد الختم التشفيري (Cryptographic Stamp)
    // في المرحلة الأولى، نستخدم HMAC-SHA256
    const secret = Deno.env.get('ZATCA_SECRET') || 'default-zatca-secret-key';
    const cryptographic_stamp = createHash('sha256')
      .update(invoice_hash + secret)
      .digest('base64');

    // 6. معرف الجهاز
    const device_id = user.email.replace(/[@.]/g, '_') + '_POS_01';

    // 7. توليد QR Code حسب معيار ZATCA TLV
    const qrData = generateZATCAQRCode({
      sellerName: invoiceData.seller_name,
      vatNumber: invoiceData.vat_number,
      timestamp: new Date(invoiceData.date + 'T' + (invoiceData.time || '00:00:00')).toISOString(),
      total: invoiceData.total,
      vat: invoiceData.tax_amount
    });

    // 8. توليد XML (UBL 2.1)
    const xmlContent = generateUBLXML({
      ...invoiceData,
      zatca_uuid,
      invoice_counter_number,
      previous_invoice_hash,
      invoice_hash,
      cryptographic_stamp,
      device_id
    });

    return Response.json({
      success: true,
      zatca_fields: {
        zatca_uuid,
        invoice_counter_number,
        previous_invoice_hash,
        invoice_hash,
        cryptographic_stamp,
        device_id,
        qr_code: qrData,
        xml_content: xmlContent
      }
    });

  } catch (error) {
    console.error('Error generating ZATCA compliant invoice:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

function generateZATCAQRCode(data) {
  // ZATCA TLV Format
  const encodeTLV = (tag, value) => {
    const tagByte = tag.toString(16).padStart(2, '0');
    const valueBytes = new TextEncoder().encode(value);
    const lengthByte = valueBytes.length.toString(16).padStart(2, '0');
    return tagByte + lengthByte + Array.from(valueBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const tlvData = [
    encodeTLV(1, data.sellerName),
    encodeTLV(2, data.vatNumber),
    encodeTLV(3, data.timestamp),
    encodeTLV(4, data.total.toFixed(2)),
    encodeTLV(5, data.vat.toFixed(2))
  ].join('');

  const hexToBytes = tlvData.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
  return btoa(String.fromCharCode(...hexToBytes));
}

function generateUBLXML(invoice) {
  const now = new Date().toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${invoice.invoice_number}</cbc:ID>
  <cbc:UUID>${invoice.zatca_uuid}</cbc:UUID>
  <cbc:IssueDate>${invoice.date}</cbc:IssueDate>
  <cbc:IssueTime>${invoice.time || '00:00:00'}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0${invoice.invoice_type === 'standard' ? '1' : '2'}00">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${invoice.invoice_counter_number}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${invoice.previous_invoice_hash}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  
  <cac:Signature>
    <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
    <cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>
  </cac:Signature>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${invoice.commercial_registration || ''}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${invoice.seller_address || ''}</cbc:StreetName>
        <cbc:CityName>Riyadh</cbc:CityName>
        <cbc:PostalZone>12345</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${invoice.vat_number}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${invoice.seller_name}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${invoice.customer_name}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${invoice.tax_amount.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${invoice.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${invoice.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${invoice.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${invoice.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
  ${invoice.items.map((item, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${item.total.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${item.product_name}</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="SAR">${item.price.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
  `).join('')}
</Invoice>`;
}