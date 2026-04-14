import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, full_name } = user;

    if (!email) {
      return Response.json({ error: 'No email found' }, { status: 400 });
    }

    // إرسال إيميل ترحيبي
    await Wadaq.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: '🎉 مرحباً بك في برنامج ودق المحاسبي!',
      body: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 مرحباً ${full_name || 'بك'}!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
              نحن سعداء بانضمامك إلى <strong>برنامج ودق المحاسبي</strong>!
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #10b981;">
              <h3 style="color: #10b981; margin-top: 0;">✅ بدأت فترتك التجريبية المجانية</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>مدة التجربة: <strong>10 أيام كاملة</strong></li>
                <li>وصول كامل لجميع الميزات</li>
                <li>لا حاجة لبطاقة ائتمان</li>
                <li>دعم فني متكامل</li>
              </ul>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #3b82f6; margin-top: 0;">🚀 خطواتك الأولى</h3>
              <ol style="color: #4b5563; line-height: 1.8;">
                <li>أضف منتجاتك الأولى</li>
                <li>سجل بيانات عملائك</li>
                <li>أنشئ أول فاتورة إلكترونية</li>
                <li>استكشف التقارير والتحليلات</li>
              </ol>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="color: white; margin: 0; font-size: 14px;">
                💡 <strong>نصيحة:</strong> ابدأ بإنشاء فاتورة تجريبية لتتعرف على النظام
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${req.headers.get('origin') || 'https://your-app.Wadaq.app'}/Dashboard" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                ابدأ الآن
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              هل تحتاج مساعدة؟ نحن هنا دائماً لدعمك!<br/>
              <a href="mailto:support@rikazai.com" style="color: #3b82f6;">support@rikazai.com</a>
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              © 2026 مؤسسة رِكاز | جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      `
    });

    return Response.json({ 
      success: true,
      message: 'Welcome email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});