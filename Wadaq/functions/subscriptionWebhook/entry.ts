import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;

  try {
    // Verify webhook signature
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return Response.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // Initialize Wadaq client
  const Wadaq = createClientFromRequest(req);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userEmail = session.metadata.user_email;
        const planType = session.metadata.plan_type;
        const billingCycle = session.metadata.billing_cycle;

        console.log(`Checkout completed: planType=${planType}, billingCycle=${billingCycle}, email=${userEmail}`);

        // Validate plan type
        if (!['basic', 'advanced', 'smart', 'golden'].includes(planType)) {
          console.error(`Invalid plan type: ${planType}`);
          return Response.json({ error: 'Invalid plan type' }, { status: 400 });
        }

        // Calculate subscription end date based on billing cycle
        const endDate = new Date();
        if (billingCycle === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (billingCycle === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else if (planType === 'golden') {
          // Golden offer is 3 years
          endDate.setFullYear(endDate.getFullYear() + 3);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1); // Default to yearly
        }

        // Get user by email
        const users = await Wadaq.asServiceRole.entities.User.filter({ email: userEmail });
        if (users.length > 0) {
          const userId = users[0].id;
          
          // Map planType to subscription_plan enum and set AI credits & features
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
              max_invoices: -1, // unlimited
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
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
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

          console.log(`Subscription activated for user ${userEmail}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find user by stripe customer ID
        const users = await Wadaq.asServiceRole.entities.User.filter({ 
          stripe_customer_id: customerId 
        });

        if (users.length > 0) {
          const userId = users[0].id;
          const endDate = new Date(subscription.current_period_end * 1000);

          await Wadaq.asServiceRole.entities.User.update(userId, {
            subscription_status: subscription.status === 'active' ? 'active' : 'expired',
            subscription_end_date: endDate.toISOString()
          });

          console.log(`Subscription updated for customer ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const users = await Wadaq.asServiceRole.entities.User.filter({ 
          stripe_customer_id: customerId 
        });

        if (users.length > 0) {
          const userId = users[0].id;
          
          await Wadaq.asServiceRole.entities.User.update(userId, {
            subscription_status: 'expired'
          });

          console.log(`Subscription cancelled for customer ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const users = await Wadaq.asServiceRole.entities.User.filter({ 
          stripe_customer_id: customerId 
        });

        if (users.length > 0) {
          const userId = users[0].id;
          
          await Wadaq.asServiceRole.entities.User.update(userId, {
            subscription_status: 'payment_failed'
          });

          console.log(`Payment failed for customer ${customerId}`);
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});