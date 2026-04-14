import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only process create events
    if (event.type !== 'create' || !data) {
      return Response.json({ success: true, message: 'Not a create event' });
    }

    // Don't send if no email
    if (!data.email) {
      return Response.json({ success: true, message: 'No customer email' });
    }

    // Get company info
    const user = await Wadaq.asServiceRole.entities.User.filter({ 
      email: data.created_by 
    });
    const companyName = user[0]?.company_name || 'الشركة';
    const companyPhone = user[0]?.company_phone || '';
    const companyEmail = user[0]?.company_email || '';

    const subject = `مرحباً بك في ${companyName}`;
    
    const body = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 2em;">مرحباً بك!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">نحن سعداء بانضمامك إلينا</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 1.1em;">عزيزي/عزيزتي <strong>${data.name}</strong>،</p>
          
          <p>يسعدنا أن نرحب بك كعميل جديد لدى <strong>${companyName}</strong>!</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border-right: 4px solid #3b82f6; margin: 25px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">معلومات حسابك</h3>
            <p style="margin: 8px 0;"><strong>الاسم:</strong> ${data.name}</p>
            ${data.phone ? `<p style="margin: 8px 0;"><strong>الهاتف:</strong> ${data.phone}</p>` : ''}
            <p style="margin: 8px 0;"><strong>البريد الإلكتروني:</strong> ${data.email}</p>
            ${data.address ? `<p style="margin: 8px 0;"><strong>العنوان:</strong> ${data.address}</p>` : ''}
          </div>
          
          <div style="background: linear-gradient(to bottom, #eff6ff, #dbeafe); padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">💡 نصائح سريعة</h3>
            <ul style="margin: 10px 0; padding-right: 20px;">
              <li style="margin: 8px 0;">سنرسل لك فواتيرك على بريدك الإلكتروني</li>
              <li style="margin: 8px 0;">يمكنك التواصل معنا في أي وقت</li>
              <li style="margin: 8px 0;">نوفر طرق دفع متعددة لراحتك</li>
            </ul>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">تواصل معنا</h3>
            ${companyPhone ? `<p style="margin: 8px 0;">📞 <strong>الهاتف:</strong> ${companyPhone}</p>` : ''}
            ${companyEmail ? `<p style="margin: 8px 0;">📧 <strong>البريد:</strong> ${companyEmail}</p>` : ''}
          </div>
          
          <p style="font-size: 1.1em; color: #1e293b; text-align: center; margin-top: 30px;">
            نتطلع للعمل معك! 🎉
          </p>
          
          <p style="margin-top: 30px;">مع أطيب التحيات،<br><strong>${companyName}</strong></p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #64748b; font-size: 0.85em;">
          <p>هذه رسالة تلقائية، يرجى عدم الرد عليها مباشرة</p>
        </div>
      </div>
    `;

    // Send welcome email
    await Wadaq.asServiceRole.integrations.Core.SendEmail({
      from_name: companyName,
      to: data.email,
      subject,
      body
    });

    return Response.json({
      success: true,
      welcome_sent: true,
      customer_name: data.name,
      customer_email: data.email
    });

  } catch (error) {
    console.error('Welcome message error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});