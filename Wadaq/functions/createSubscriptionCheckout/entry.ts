import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planName, planPrice, billingCycle, userEmail, features } = await req.json();

    if (!planName || !planPrice || !billingCycle) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Build features description
    let featuresText = '';
    if (features && features.length > 0) {
      featuresText = '\n\nالمميزات:\n' + features.map(f => `• ${f}`).join('\n');
    }

    // Convert SAR to halalas (smallest currency unit)
    const amountInHalalas = Math.round(planPrice * 100);
    
    // Determine plan type from planName
    let planType = 'basic';
    const nameLower = (planName || '').toLowerCase();
    if (nameLower.includes('ذكية') || nameLower.includes('smart')) planType = 'smart';
    else if (nameLower.includes('متقدمة') || nameLower.includes('advanced')) planType = 'advanced';
    else if (nameLower.includes('ذهبي') || nameLower.includes('golden')) planType = 'golden';
    else planType = 'basic';

    console.log(`Plan determination: price=${planPrice}, planType=${planType}, planName=${planName}`);

    // Create or retrieve customer
    let customer;
    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          Wadaq_user_id: user.id,
          Wadaq_app_id: Deno.env.get("Wadaq_APP_ID")
        }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: planName,
              description: `اشتراك ${billingCycle === 'monthly' ? 'شهري' : 'سنوي'} في نظام المحاسب الذكي${featuresText}`,
            },
            unit_amount: amountInHalalas,
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/SubscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/Subscription`,
      metadata: {
        Wadaq_app_id: Deno.env.get("Wadaq_APP_ID"),
        Wadaq_user_id: user.id,
        plan_type: planType,
        user_email: userEmail,
        billing_cycle: billingCycle
      },
      subscription_data: {
        metadata: {
          Wadaq_app_id: Deno.env.get("Wadaq_APP_ID"),
          Wadaq_user_id: user.id,
          plan_type: planType,
          billing_cycle: billingCycle
        }
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return Response.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
});