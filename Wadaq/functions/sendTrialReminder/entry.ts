import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';
import { differenceInDays, parseISO } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    
    // جلب جميع المستخدمين في الفترة التجريبية
    const allUsers = await Wadaq.asServiceRole.entities.User.list();
    
    const trialUsers = allUsers.filter(u => 
      u.subscription_status === 'trial' && 
      u.trial_end_date &&
      u.email
    );

    let sentCount = 0;
    const results = [];

    for (const user of trialUsers) {
      try {
        const daysLeft = differenceInDays(parseISO(user.trial_end_date), new Date());
        
        // إرسال تذكير عند 3، 2، 1 يوم
        if (daysLeft === 3 || daysLeft === 2 || daysLeft === 1) {
          // تحقق من آخر إيميل تم إرساله (لتجنب الإرسال المتكرر)
          const lastReminderKey = `last_reminder_${daysLeft}days`;
          const lastReminder = user[lastReminderKey];
          const today = new Date().toISOString().split('T')[0];
          
          if (lastReminder === today) {
            results.push({ user: user.email, status: 'skipped', reason: 'Already sent today' });
            continue;
          }

          let subject, urgencyColor, urgencyText;
          
          if (daysLeft === 3) {
            subject = '⏰ باقي 3 أيام على انتهاء الفترة التجريبية';
            urgencyColor = '#f59e0b';
            urgencyText = 'لا تفوت الفرصة';
          } else if (daysLeft === 2) {
            subject = '⚠️ باقي يومان فقط على انتهاء الفترة التجريبية';
            urgencyColor = '#f97316';
            urgencyText = 'الوقت ينفد';
          } else {
            subject = '🚨 آخر يوم في الفترة التجريبية!';
            urgencyColor = '#ef4444';
            urgencyText = 'اليوم الأخير';
          }

          await Wadaq.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject,
            body: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="margin: 0; font-size: 32px;">⏰</h1>
                  <h2 style="margin: 10px 0 0 0; font-size: 24px;">${urgencyText}</h2>
                </div>
                
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
                    مرحباً ${user.full_name || 'عزيزي المستخدم'}،
                  </p>
                  
                  <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-right: 4px solid ${urgencyColor}; text-align: center;">
                    <h3 style="color: ${urgencyColor}; margin-top: 0; font-size: 28px;">
                      باقي <strong>${daysLeft}</strong> ${daysLeft === 1 ? 'يوم' : 'أيام'}
                    </h3>
                    <p style="color: #6b7280; margin: 0;">على انتهاء فترتك التجريبية المجانية</p>
                  </div>
                  
                  <p style="color: #4b5563; line-height: 1.8;">
                    لا تفوت فرصة الاستمرار في استخدام <strong>المحاسب الذكي</strong> وجميع ميزاته المتقدمة.
                  </p>
                  
                  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; margin: 20px 0; color: white;">
                    <h3 style="margin-top: 0; font-size: 20px;">🎁 عرض خاص لك</h3>
                    <ul style="line-height: 1.8; margin: 0; padding-right: 20px;">
                      <li>خصم حصري للمشتركين الأوائل</li>
                      <li>وصول مدى الحياة لجميع التحديثات</li>
                      <li>دعم فني VIP على مدار الساعة</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${req.headers.get('origin') || 'https://your-app.Wadaq.app'}/Subscription" 
                       style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 18px;">
                      اشترك الآن
                    </a>
                  </div>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                  
                  <p style="color: #6b7280; font-size: 14px; text-align: center;">
                    لديك أسئلة؟ نحن هنا للمساعدة<br/>
                    <a href="mailto:support@rikazai.com" style="color: #3b82f6;">support@rikazai.com</a>
                  </p>
                  
                  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
                    © 2026 مؤسسة رِكاز | جميع الحقوق محفوظة
                  </p>
                </div>
              </div>
            `
          });

          // تحديث آخر موعد للتذكير
          await Wadaq.asServiceRole.entities.User.update(user.id, {
            [lastReminderKey]: today
          });

          sentCount++;
          results.push({ user: user.email, daysLeft, status: 'sent' });
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        results.push({ user: user.email, status: 'error', error: error.message });
      }
    }

    return Response.json({ 
      success: true,
      sentCount,
      totalTrialUsers: trialUsers.length,
      results
    });
  } catch (error) {
    console.error('Error in trial reminder:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});