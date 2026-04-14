import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    
    // Authenticate user
    const user = await Wadaq.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { invoice_id, customer_email } = body;

    if (!invoice_id || !customer_email) {
      return Response.json({ 
        error: 'Missing required fields: invoice_id and customer_email' 
      }, { status: 400 });
    }

    // Get invoice details
    const invoice = await Wadaq.entities.Invoice.get(invoice_id);
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get company info
    const companyName = user.company_name || 'شركتك';
    const companyEmail = user.company_email || user.email;

    // Create invoice summary
    const itemsList = invoice.items?.map((item, index) => 
      `${index + 1}. ${item.product_name} - الكمية: ${item.quantity} - السعر: ${item.price} ر.س - الإجمالي: ${item.total} ر.س`
    ).join('\n') || '';

    // Construct email body
    const emailBody = `
مرحباً،

نشكرك على تعاملك معنا. إليك تفاصيل فاتورتك:

━━━━━━━━━━━━━━━━━━━━━━━━
📄 تفاصيل الفاتورة
━━━━━━━━━━━━━━━━━━━━━━━━

رقم الفاتورة: ${invoice.invoice_number}
التاريخ: ${invoice.date}
اسم العميل: ${invoice.customer_name}
${invoice.due_date ? `تاريخ الاستحقاق: ${invoice.due_date}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━
📦 البنود
━━━━━━━━━━━━━━━━━━━━━━━━

${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━━
💰 الملخص المالي
━━━━━━━━━━━━━━━━━━━━━━━━

المجموع الفرعي: ${invoice.subtotal} ر.س
${invoice.apply_vat ? `ضريبة القيمة المضافة (${invoice.tax_rate}%): ${invoice.tax_amount} ر.س` : 'ضريبة القيمة المضافة: معفى'}
${invoice.discount > 0 ? `الخصم: ${invoice.discount} ر.س` : ''}
${invoice.shipping_cost > 0 ? `الشحن: ${invoice.shipping_cost} ر.س` : ''}

الإجمالي النهائي: ${invoice.total} ر.س

${invoice.notes ? `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📝 ملاحظات\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n${invoice.notes}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━

يمكنك التواصل معنا عبر:
📧 البريد الإلكتروني: ${companyEmail}
${user.company_phone ? `📱 الهاتف: ${user.company_phone}` : ''}

مع تحيات،
${companyName}
    `.trim();

    // Send email
    await Wadaq.integrations.Core.SendEmail({
      from_name: companyName,
      to: customer_email,
      subject: `فاتورة رقم ${invoice.invoice_number} من ${companyName}`,
      body: emailBody
    });

    return Response.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    return Response.json({
      error: 'Failed to send email',
      message: error.message
    }, { status: 500 });
  }
});