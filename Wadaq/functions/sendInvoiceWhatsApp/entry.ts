import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    
    const user = await Wadaq.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { invoice_id } = body;

    if (!invoice_id) {
      return Response.json({ error: 'Missing invoice_id' }, { status: 400 });
    }

    // Get invoice
    const invoice = await Wadaq.entities.Invoice.get(invoice_id);
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get company info
    const organizations = await Wadaq.entities.Organization.filter({ owner_email: user.email });
    const org = organizations[0] || {};
    const companyName = org.name || user.company_name || 'مؤسسة ركاز';

    // Generate PDF
    const doc = new jsPDF();
    
    doc.setLanguage("ar");
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(companyName, 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('INVOICE - فاتورة', 105, 35, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 50);
    doc.text(`Date: ${invoice.date}`, 20, 57);
    if (invoice.due_date) {
      doc.text(`Due: ${invoice.due_date}`, 20, 64);
    }
    
    doc.text(`Customer: ${invoice.customer_name}`, 120, 50);
    if (invoice.customer_phone) {
      doc.text(`Phone: ${invoice.customer_phone}`, 120, 57);
    }
    
    let y = 80;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y, 170, 8, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('Item', 25, y + 5);
    doc.text('Qty', 120, y + 5);
    doc.text('Price', 145, y + 5);
    doc.text('Total', 170, y + 5);
    
    y += 12;
    doc.setFont(undefined, 'normal');
    invoice.items?.forEach((item) => {
      doc.text(item.product_name || 'Item', 25, y);
      doc.text(String(item.quantity || 0), 120, y);
      doc.text(String(item.price || 0), 145, y);
      doc.text(String(item.total || 0), 170, y);
      y += 7;
    });
    
    y += 10;
    doc.text(`Subtotal: ${invoice.subtotal || 0} SAR`, 140, y, { align: 'right' });
    y += 7;
    if (invoice.apply_vat) {
      doc.text(`VAT (${invoice.tax_rate}%): ${invoice.tax_amount || 0} SAR`, 140, y, { align: 'right' });
      y += 7;
    }
    if (invoice.discount > 0) {
      doc.text(`Discount: -${invoice.discount} SAR`, 140, y, { align: 'right' });
      y += 7;
    }
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL: ${invoice.total || 0} SAR`, 140, y + 5, { align: 'right' });
    
    if (invoice.notes) {
      y += 20;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Notes:', 20, y);
      y += 7;
      const lines = doc.splitTextToSize(invoice.notes, 170);
      doc.text(lines, 20, y);
    }
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Smart Accountant - RikazAi.com', 105, 280, { align: 'center' });

    // Convert PDF to base64
    const pdfBase64 = doc.output('datauristring');
    
    const customerPhone = invoice.customer_phone?.replace(/[^0-9]/g, '') || "";
    
    if (!customerPhone) {
      return Response.json({ 
        error: 'لا يوجد رقم هاتف للعميل. الرجاء إضافة رقم الهاتف أولاً.',
        error_en: 'Customer phone number is missing. Please add it first.'
      }, { status: 400 });
    }
    
    const whatsappUrl = `https://wa.me/${customerPhone}`;
    
    return Response.json({
      success: true,
      whatsapp_url: whatsappUrl,
      pdf_base64: pdfBase64,
      invoice_number: invoice.invoice_number,
      customer_phone: customerPhone
    });

  } catch (error) {
    console.error('Error generating invoice WhatsApp:', error);
    return Response.json({
      error: 'فشل إنشاء رابط الواتساب',
      error_en: 'Failed to create WhatsApp link',
      details: error.message
    }, { status: 500 });
  }
});