import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoice_id } = await req.json();

    if (!invoice_id) {
      return Response.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get invoice details
    const invoice = await Wadaq.entities.Invoice.get(invoice_id);
    
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return Response.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // Get user's company info for success URL
    const appUrl = req.headers.get('origin') || 'https://app.Wadaq.com';
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: `${invoice.invoice_number} - ${invoice.customer_name}`,
              description: invoice.notes || 'Invoice payment',
            },
            unit_amount: Math.round(invoice.total * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/invoices?payment=success&invoice_id=${invoice_id}`,
      cancel_url: `${appUrl}/invoices?payment=cancelled&invoice_id=${invoice_id}`,
      metadata: {
        Wadaq_app_id: Deno.env.get('Wadaq_APP_ID'),
        invoice_id: invoice_id,
        invoice_number: invoice.invoice_number,
        customer_email: invoice.customer_email || user.email,
      },
      customer_email: invoice.customer_email || user.email,
    });

    console.log('Checkout session created:', session.id, 'for invoice:', invoice.invoice_number);

    return Response.json({ 
      checkout_url: session.url,
      session_id: session.id
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
});