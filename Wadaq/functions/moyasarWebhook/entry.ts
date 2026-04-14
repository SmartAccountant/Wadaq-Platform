import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const body = await req.json();

    console.log('Moyasar webhook received:', body);

    // Verify webhook signature (if you configure webhook secret in Moyasar)
    // const signature = req.headers.get('x-moyasar-signature');
    
    const paymentData = body;

    // Check payment status
    if (paymentData.status !== 'paid') {
      console.log('Payment not completed:', paymentData.status);
      return Response.json({ received: true });
    }

    // Extract metadata
    const metadata = paymentData.metadata || {};
    const userEmail = metadata.user_email;
    const planType = metadata.plan_type;
    const billingCycle = metadata.billing_cycle;

    if (!userEmail || !planType) {
      console.error('Missing metadata in payment:', metadata);
      return Response.json({ error: 'Invalid payment metadata' }, { status: 400 });
    }

    // Calculate subscription end date
    const endDate = new Date();
    if (planType === 'golden') {
      endDate.setFullYear(endDate.getFullYear() + 3);
    } else if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Get user by email
    const users = await Wadaq.asServiceRole.entities.User.filter({ email: userEmail });
    if (users.length === 0) {
      console.error('User not found:', userEmail);
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;

    // Map planType to subscription features
    const planFeatures = {
      'basic': {
        ai_credits: 5,
        max_invoices: 50,
        max_products: 100,
        max_customers: 50,
        has_api_access: false,
        has_advanced_reports: false,
        has_multi_language: false,
        has_custom_fields: false
      },
      'advanced': {
        ai_credits: 50,
        max_invoices: -1,
        max_products: -1,
        max_customers: -1,
        has_api_access: true,
        has_advanced_reports: true,
        has_multi_language: true,
        has_custom_fields: true
      },
      'smart': {
        ai_credits: 999999,
        max_invoices: -1,
        max_products: -1,
        max_customers: -1,
        has_api_access: true,
        has_advanced_reports: true,
        has_multi_language: true,
        has_custom_fields: true
      },
      'golden': {
        ai_credits: 999999,
        max_invoices: -1,
        max_products: -1,
        max_customers: -1,
        has_api_access: true,
        has_advanced_reports: true,
        has_multi_language: true,
        has_custom_fields: true
      }
    };

    const features = planFeatures[planType] || planFeatures['basic'];

    // Update user subscription status
    await Wadaq.asServiceRole.entities.User.update(userId, {
      subscription_status: 'active',
      subscription_plan: planType,
      subscription_end_date: endDate.toISOString(),
      moyasar_payment_id: paymentData.id,
      ai_credits_limit: features.ai_credits,
      ai_credits_used: 0,
      has_api_access: features.has_api_access,
      max_invoices: features.max_invoices,
      max_products: features.max_products,
      max_customers: features.max_customers,
      has_advanced_reports: features.has_advanced_reports,
      has_multi_language: features.has_multi_language,
      has_custom_fields: features.has_custom_fields
    });

    console.log(`Subscription activated for user ${userEmail} - Plan: ${planType}`);

    return Response.json({ received: true });
  } catch (error) {
    console.error('Moyasar webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});