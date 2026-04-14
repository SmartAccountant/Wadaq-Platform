import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only process updates
    if (event.type !== 'update' || !data || !old_data) {
      return Response.json({ success: true, message: 'Not an update event' });
    }

    // Check if status changed
    if (!data.status || data.status === old_data.status) {
      return Response.json({ success: true, message: 'Status unchanged' });
    }

    // Don't send notification if no customer email
    if (!data.customer_email) {
      return Response.json({ success: true, message: 'No customer email' });
    }

    // Get company info
    const user = await Wadaq.asServiceRole.entities.User.filter({ 
      email: data.created_by 
    });
    const companyName = user[0]?.company_name || 'الشركة';

    // Prepare notification based on new status
    let subject = '';
    let body = '';

    const statusLabels = {
      draft: 'مسودة',
      sent: 'مرسلة',
      paid: 'مدفوعة',
      overdue: 'متأخرة',
      cancelled: 'ملغاة'
    };

    const statusColors = {
      draft: '#64748b',
      sent: '#3b82f6',
      paid: '#10b981',
      overdue: '#ef4444',
      cancelled: '#f97316'
    };

    switch (data.status) {
      case 'paid':
        subject = `✓ تم استلام دفعة الفاتورة رقم ${data.invoice_number}`;
        body = `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="margin: 0;">✓ تم استلام الدفعة بنجاح</h2>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>عزيزي/عزيزتي <strong>${data.customer_name}</strong>،</p>
              
              <p>نشكركم على سداد الفاتورة. تم استلام دفعتكم بنجاح.</p>
              
              <div style="background-color: white; padding: 15px; border-radius: 8px; border-right: 4px solid #10b981; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>رقم الفاتورة:</strong> ${data.invoice_number}</p>
                <p style="margin: 5px 0;"><strong>المبلغ المدفوع:</strong> <span style="color: #10b981; font-size: 1.2em;">${data.total.toLocaleString()} ر.س</span></p>
                <p style="margin: 5px 0;"><strong>تاريخ الدفع:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
              </div>
              
              <p>نقدر ثقتكم ونتطلع لخدمتكم مجدداً.</p>
              
              <p style="margin-top: 30px;">مع أطيب التحيات،<br><strong>${companyName}</strong></p>
            </div>
          </div>
        `;
        break;

      case 'sent':
        subject = `فاتورة جديدة رقم ${data.invoice_number}`;
        body = `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">فاتورة جديدة</h2>
            
            <p>عزيزي/عزيزتي <strong>${data.customer_name}</strong>،</p>
            
            <p>تم إصدار فاتورة جديدة لكم. التفاصيل أدناه:</p>
            
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>رقم الفاتورة:</strong> ${data.invoice_number}</p>
              <p style="margin: 5px 0;"><strong>تاريخ الإصدار:</strong> ${new Date(data.date).toLocaleDateString('ar-SA')}</p>
              ${data.due_date ? `<p style="margin: 5px 0;"><strong>تاريخ الاستحقاق:</strong> ${new Date(data.due_date).toLocaleDateString('ar-SA')}</p>` : ''}
              <p style="margin: 5px 0;"><strong>المبلغ المستحق:</strong> <span style="color: #3b82f6; font-size: 1.2em;">${data.total.toLocaleString()} ر.س</span></p>
            </div>
            
            <p>نرجو منكم المبادرة بالسداد في الموعد المحدد.</p>
            
            <p style="margin-top: 30px;">مع أطيب التحيات،<br><strong>${companyName}</strong></p>
          </div>
        `;
        break;

      case 'cancelled':
        subject = `تم إلغاء الفاتورة رقم ${data.invoice_number}`;
        body = `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b; border-bottom: 2px solid #f97316; padding-bottom: 10px;">إلغاء فاتورة</h2>
            
            <p>عزيزي/عزيزتي <strong>${data.customer_name}</strong>،</p>
            
            <p>نود إعلامكم بأنه تم إلغاء الفاتورة التالية:</p>
            
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-right: 4px solid #f97316; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>رقم الفاتورة:</strong> ${data.invoice_number}</p>
              <p style="margin: 5px 0;"><strong>تاريخ الإصدار:</strong> ${new Date(data.date).toLocaleDateString('ar-SA')}</p>
            </div>
            
            <p>لا يلزم اتخاذ أي إجراء من جانبكم.</p>
            
            <p style="margin-top: 30px;">مع أطيب التحيات،<br><strong>${companyName}</strong></p>
          </div>
        `;
        break;

      default:
        return Response.json({ success: true, message: 'Status not handled' });
    }

    // Send email notification
    await Wadaq.asServiceRole.integrations.Core.SendEmail({
      from_name: companyName,
      to: data.customer_email,
      subject,
      body
    });

    return Response.json({
      success: true,
      notification_sent: true,
      invoice_number: data.invoice_number,
      new_status: data.status,
      customer_email: data.customer_email
    });

  } catch (error) {
    console.error('Invoice status notification error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});