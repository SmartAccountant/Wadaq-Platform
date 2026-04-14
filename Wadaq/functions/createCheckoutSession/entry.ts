import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success_url, cancel_url } = await req.json();

    // Check if running in iframe
    const referer = req.headers.get('referer') || '';
    if (referer.includes('Wadaq.app/preview')) {
      return Response.json({ 
        error: 'Checkout is not available in preview mode. Please publish your app first.' 
      }, { status: 400 });
    }

    // Create Stripe checkout session (ONE-TIME PAYMENT)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // ONE-TIME payment (not subscription)
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1Ste46ARRDwro9FyL4mttSyX', // Founder's Club price ID
          quantity: 1,
        },
      ],
      success_url: success_url || `${req.headers.get('origin')}/Checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/Landing?canceled=true`,
      metadata: {
        Wadaq_app_id: Deno.env.get("Wadaq_APP_ID"),
        user_email: user.email,
        subscription_type: 'founder',
        subscription_duration: '3_years',
        payment_type: 'one_time'
      },
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      payment_intent_data: {
        description: 'باقة شركاء التأسيس - دفع لمرة واحدة لـ 3 سنوات',
      },
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});