import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);

    // Get all quotations that are about to expire in 3 days
    const quotations = await Wadaq.asServiceRole.entities.Quotation.filter({
      status: { $in: ["draft", "sent"] }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiringQuotations = quotations.filter(q => {
      if (!q.valid_until) return false;
      const validUntil = new Date(q.valid_until);
      validUntil.setHours(0, 0, 0, 0);
      return validUntil <= threeDaysFromNow && validUntil >= today;
    });

    // Create notifications for expiring quotations
    for (const quotation of expiringQuotations) {
      const daysUntilExpiry = Math.ceil(
        (new Date(quotation.valid_until).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if notification already exists for this quotation today
      const existingNotifications = await Wadaq.asServiceRole.entities.Notification.filter({
        reference_id: quotation.id,
        type: "quotation_expiring",
        user_email: quotation.created_by
      });

      const hasRecentNotification = existingNotifications.some(n => {
        const notifDate = new Date(n.created_date);
        notifDate.setHours(0, 0, 0, 0);
        return notifDate.getTime() === today.getTime();
      });

      if (!hasRecentNotification) {
        await Wadaq.asServiceRole.entities.Notification.create({
          title: `عرض السعر ${quotation.quote_number} على وشك الانتهاء`,
          message: `عرض السعر للعميل ${quotation.customer_name} سينتهي خلال ${daysUntilExpiry} يوم`,
          type: "quotation_expiring",
          reference_id: quotation.id,
          user_email: quotation.created_by,
          is_read: false
        });
      }
    }

    return Response.json({
      success: true,
      checked: quotations.length,
      expiring: expiringQuotations.length
    });

  } catch (error) {
    console.error('Error checking expiring quotations:', error);
    return Response.json({
      error: 'Failed to check expiring quotations',
      message: error.message
    }, { status: 500 });
  }
});