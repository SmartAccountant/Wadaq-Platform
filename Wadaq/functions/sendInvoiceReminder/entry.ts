import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get company info
    const companyName = user.company_name || 'الشركة';
    
    // Get all unpaid invoices
    const invoices = await Wadaq.asServiceRole.entities.Invoice.filter({
      status: 'sent'
    });

    const today = new Date();
    const remindersSent = [];
    const errors = [];

    for (const invoice of invoices) {
      try {
        if (!invoice.due_date || !invoice.customer_email) {
          continue;
        }

        const dueDate = new Date(invoice.due_date);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        // Send reminder if due in 3 days or less (but not overdue)
        if (daysUntilDue > 0 && daysUntilDue <= 3) {
          const subject = `تذكير: فاتورة رقم ${invoice.invoice_number} تستحق خلال ${daysUntilDue} ${daysUntilDue === 1 ? 'يوم' : 'أيام'}`;
          
          const body = `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">تذكير بموعد استحقاق الفاتورة</h2>
              
              <p>عزيزي/عزيزتي <strong>${invoice.customer_name}</strong>،</p>
              
              <p>نذكركم بأن الفاتورة التالية تستحق خلال <strong>${daysUntilDue} ${daysUntilDue === 1 ? 'يوم' : 'أيام'}</strong>:</p>
              
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>رقم الفاتورة:</strong> ${invoice.invoice_number}</p>
                <p style="margin: 5px 0;"><strong>تاريخ الإصدار:</strong> ${new Date(invoice.date).toLocaleDateString('ar-SA')}</p>
                <p style="margin: 5px 0;"><strong>تاريخ الاستحقاق:</strong> ${dueDate.toLocaleDateString('ar-SA')}</p>
                <p style="margin: 5px 0;"><strong>المبلغ المستحق:</strong> <span style="color: #3b82f6; font-size: 1.2em;">${invoice.total.toLocaleString()} ر.س</span></p>
              </div>
              
              <p>نرجو منكم المبادرة بسداد المبلغ في الموعد المحدد.</p>
              
              <p style="margin-top: 30px;">مع أطيب التحيات،<br><strong>${companyName}</strong></p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p style="font-size: 0.85em; color: #64748b; text-align: center;">
                هذه رسالة تلقائية، يرجى عدم الرد عليها مباشرة
              </p>
            </div>
          `;

          await Wadaq.asServiceRole.integrations.Core.SendEmail({
            from_name: companyName,
            to: invoice.customer_email,
            subject,
            body
          });

          remindersSent.push({
            invoice_number: invoice.invoice_number,
            customer: invoice.customer_name,
            days_until_due: daysUntilDue
          });
        }
      } catch (error) {
        errors.push({
          invoice_number: invoice.invoice_number,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      reminders_sent: remindersSent.length,
      details: remindersSent,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Send invoice reminder error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});