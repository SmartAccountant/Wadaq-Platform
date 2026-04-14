import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planName, planPrice, billingCycle, userEmail } = await req.json();

    if (!planName || !planPrice || !billingCycle) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get admin's Moyasar keys
    const admins = await Wadaq.asServiceRole.entities.User.filter({ role: 'admin' });
    if (!admins || admins.length === 0) {
      console.error('No admin found');
      return Response.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const admin = admins[0];
    const moyasarSecretKey = admin.moyasar_live_secret_key;
    const moyasarPublishableKey = admin.moyasar_live_publishable_key;

    if (!moyasarSecretKey || !moyasarPublishableKey) {
      console.error('Moyasar keys not configured');
      return Response.json({ error: 'Payment gateway not configured. Please contact admin.' }, { status: 500 });
    }

    // Convert SAR to halalas (smallest currency unit)
    const amountInHalalas = Math.round(planPrice * 100);
    
    // Determine plan type for metadata
    let planType = 'basic';
    if (planName.includes('متقدمة') || planName.includes('Advanced')) planType = 'advanced';
    if (planName.includes('ذكية') || planName.includes('Smart')) planType = 'smart';
    if (planName.includes('ذهبي') || planName.includes('Golden')) planType = 'golden';

    // Create Moyasar payment
    const moyasarPayment = {
      amount: amountInHalalas,
      currency: 'SAR',
      description: `اشتراك ${billingCycle === 'monthly' ? 'شهري' : 'سنوي'} - ${planName}`,
      callback_url: `${req.headers.get('origin')}/SubscriptionSuccess`,
      source: {
        type: 'creditcard',
        // Enable all payment methods: Mada, Apple Pay, Visa/Mastercard, STC Pay
        company: 'mada,visa,mastercard,applepay,stcpay'
      },
      metadata: {
        Wadaq_app_id: Deno.env.get("Wadaq_APP_ID"),
        Wadaq_user_id: user.id,
        plan_type: planType,
        user_email: userEmail,
        billing_cycle: billingCycle,
        plan_name: planName
      }
    };

    // Create payment with Moyasar API
    const moyasarResponse = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(moyasarSecretKey + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(moyasarPayment)
    });

    if (!moyasarResponse.ok) {
      const errorData = await moyasarResponse.json();
      console.error('Moyasar API error:', errorData);
      return Response.json({ 
        error: 'Failed to create payment session',
        details: errorData.message || 'Unknown error'
      }, { status: 500 });
    }

    const paymentData = await moyasarResponse.json();
    
    // Return the payment URL
    return Response.json({ 
      url: paymentData.source.transaction_url,
      payment_id: paymentData.id
    });

  } catch (error) {
    console.error('Moyasar checkout error:', error);
    return Response.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
});