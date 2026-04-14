import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    
    // Get all organizations
    const organizations = await Wadaq.asServiceRole.entities.Organization.list();
    
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    for (const org of organizations) {
      if (!org.subscription_end_date || org.subscription_status !== 'active') {
        continue;
      }
      
      const endDate = new Date(org.subscription_end_date);
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      // Check if subscription expires in 7 days or less
      if (daysRemaining > 0 && daysRemaining <= 7) {
        // Check if we already sent a notification for this date
        const existingNotification = await Wadaq.asServiceRole.entities.Notification.filter({
          user_email: org.owner_email,
          type: 'subscription_expiring',
          reference_id: org.id,
        });
        
        const today = now.toISOString().split('T')[0];
        const alreadySentToday = existingNotification.some(n => 
          n.created_date && n.created_date.startsWith(today)
        );
        
        if (!alreadySentToday) {
          // Create notification
          await Wadaq.asServiceRole.entities.Notification.create({
            title: daysRemaining === 1 
              ? 'اشتراكك ينتهي غداً!' 
              : `اشتراكك ينتهي خلال ${daysRemaining} أيام`,
            message: `باقتك (${org.subscription_plan}) ستنتهي في ${endDate.toLocaleDateString('ar-SA')}. قم بالتجديد الآن لتجنب انقطاع الخدمة.`,
            type: 'subscription_expiring',
            reference_id: org.id,
            user_email: org.owner_email,
            is_read: false,
          });
          
          // Send email
          try {
            await Wadaq.asServiceRole.integrations.Core.SendEmail({
              from_name: 'ركاز - المحاسب الذكي',
              to: org.owner_email,
              subject: `تنبيه: اشتراكك ينتهي خلال ${daysRemaining} ${daysRemaining === 1 ? 'يوم' : 'أيام'}`,
              body: `
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                  <h2>مرحباً ${org.name || 'عزيزنا العميل'}</h2>
                  <p style="font-size: 16px; margin: 20px 0;">
                    نود تذكيرك بأن اشتراكك في نظام المحاسب الذكي سينتهي خلال <strong>${daysRemaining} ${daysRemaining === 1 ? 'يوم' : 'أيام'}</strong>.
                  </p>
                  <p style="font-size: 16px;">
                    باقتك الحالية: <strong>${org.subscription_plan}</strong><br>
                    تاريخ الانتهاء: <strong>${endDate.toLocaleDateString('ar-SA')}</strong>
                  </p>
                  <a href="https://rikazai.com/Subscription" style="display: inline-block; margin-top: 20px; padding: 15px 30px; background: white; color: #667eea; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    جدد اشتراكك الآن
                  </a>
                  <p style="margin-top: 30px; font-size: 14px; opacity: 0.8;">
                    فريق ركاز - المحاسب الذكي<br>
                    support@rikazai.com
                  </p>
                </div>
              `,
            });
          } catch (emailError) {
            console.error('Failed to send email:', emailError);
          }
        }
      }
      
      // Check if subscription has expired
      if (daysRemaining <= 0 && org.subscription_status === 'active') {
        await Wadaq.asServiceRole.entities.Organization.update(org.id, {
          subscription_status: 'expired',
        });
        
        // Create expiry notification
        await Wadaq.asServiceRole.entities.Notification.create({
          title: 'انتهى اشتراكك',
          message: 'اشتراكك في نظام المحاسب الذكي انتهى. قم بالتجديد لاستعادة الوصول الكامل.',
          type: 'subscription_expired',
          reference_id: org.id,
          user_email: org.owner_email,
          is_read: false,
        });
      }
    }
    
    return Response.json({ 
      success: true, 
      checked: organizations.length,
      timestamp: now.toISOString()
    });
    
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});