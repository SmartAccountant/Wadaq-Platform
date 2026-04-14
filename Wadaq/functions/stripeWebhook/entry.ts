import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  const Wadaq = createClientFromRequest(req);
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return Response.json({ error: 'Webhook Error' }, { status: 400 });
    }

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event type:', event.type);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);

      const userEmail = session.metadata?.user_email || session.customer_email;
      
      if (!userEmail) {
        console.error('No user email found in session');
        return Response.json({ error: 'No user email' }, { status: 400 });
      }

      // Create subscription record
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);

      await Wadaq.asServiceRole.entities.FounderSubscription.create({
        user_email: userEmail,
        subscription_date: today.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        payment_status: 'completed',
        amount_paid: 750,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent
      });

      console.log('Subscription created for:', userEmail);

      // Update user subscription status
      try {
        const users = await Wadaq.asServiceRole.entities.User.filter({ email: userEmail });
        if (users.length > 0) {
          const expiryDate3yr = new Date();
          expiryDate3yr.setFullYear(expiryDate3yr.getFullYear() + 3);
          await Wadaq.asServiceRole.entities.User.update(users[0].id, {
            subscription_status: 'active',
            subscription_plan: 'golden',
            subscription_end_date: expiryDate3yr.toISOString(),
            ai_credits_limit: 999999,
            ai_credits_used: 0
          });
          console.log('User subscription status updated for:', userEmail);
        }
      } catch (err) {
        console.error('Error updating user subscription:', err);
      }

      // Send invoice email
      await sendInvoiceEmail(Wadaq, userEmail, session.id);

      // Create notification for new subscription
      await Wadaq.asServiceRole.entities.Notification.create({
        title: "اشتراك جديد!",
        message: `مستخدم جديد اشترك في باقة شركاء التأسيس: ${userEmail}`,
        type: "new_subscription",
        reference_id: userEmail,
        user_email: userEmail,
        is_read: false
      });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: error.message || 'Webhook handler failed' 
    }, { status: 400 });
  }
});

async function sendInvoiceEmail(Wadaq, userEmail, sessionId) {
  try {
    const invoiceDate = new Date().toLocaleDateString('ar-SA');
    const invoiceNumber = `INV-FOUNDER-${Date.now()}`;
    
    // Generate QR code data for ZATCA compliance
    const qrData = generateQRCode(invoiceNumber);

    const emailBody = `
      <div dir="rtl" style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">⭐ فاتورة ضريبية</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">باقة شركاء التأسيس - Founder's Club</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin: 0 0 10px 0;">المحاسب الذكي</h2>
            <p style="color: #6b7280; margin: 5px 0;">الرقم الضريبي: 300000000000003</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="color: #6b7280; margin: 5px 0;"><strong>رقم الفاتورة:</strong> ${invoiceNumber}</p>
            <p style="color: #6b7280; margin: 5px 0;"><strong>التاريخ:</strong> ${invoiceDate}</p>
            <p style="color: #6b7280; margin: 5px 0;"><strong>العميل:</strong> ${userEmail}</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">الوصف</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">المدة</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb;">باقة شركاء التأسيس - Founder's Club</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb;">3 سنوات</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">652.17 ر.س</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;"><strong>ضريبة القيمة المضافة (15%)</strong></td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">97.83 ر.س</td>
              </tr>
              <tr style="background-color: #fef3c7;">
                <td colspan="2" style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;"><strong>الإجمالي</strong></td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 18px; color: #f59e0b;">750.00 ر.س</td>
              </tr>
            </tbody>
          </table>
          
          <div style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="color: #92400e; margin: 0 0 10px 0;">🎉 مبروك! تم تفعيل اشتراكك</h3>
            <p style="color: #92400e; margin: 5px 0;">صالح حتى: ${new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toLocaleDateString('ar-SA')}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; margin: 10px 0; font-size: 14px;">رمز الاستجابة السريع (QR Code)</p>
            <div style="background-color: #f3f4f6; padding: 20px; display: inline-block; border-radius: 8px;">
              <p style="font-family: monospace; font-size: 10px; word-break: break-all; max-width: 300px; margin: 0;">${qrData}</p>
            </div>
          </div>
          
          <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">شكراً لكم على ثقتكم بنا</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">© 2026 المحاسب الذكي - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </div>
    `;

    await Wadaq.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject: `فاتورة ضريبية - باقة شركاء التأسيس - ${invoiceNumber}`,
      body: emailBody,
      from_name: 'المحاسب الذكي'
    });

    console.log('Invoice email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending invoice email:', error);
  }
}

function generateQRCode(invoiceNumber) {
  const sellerName = "المحاسب الذكي";
  const vatNumber = "300000000000003";
  const timestamp = new Date().toISOString();
  const totalWithVAT = "750.00";
  const vatAmount = "97.83";

  const qrString = `${sellerName}|${vatNumber}|${timestamp}|${totalWithVAT}|${vatAmount}|${invoiceNumber}`;
  
  // Base64 encode for QR
  const encoder = new TextEncoder();
  const data = encoder.encode(qrString);
  return btoa(String.fromCharCode(...data));
}