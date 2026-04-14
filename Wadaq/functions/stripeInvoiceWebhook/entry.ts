import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeKey) {
      console.error('Stripe secret key not configured');
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // Get the signature
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(
          body,
          signature,
          webhookSecret
        );
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return Response.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // Parse event without verification (for testing)
      event = JSON.parse(body);
      console.warn('Processing webhook without signature verification');
    }

    console.log('Received webhook event:', event.type);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      console.log('Checkout completed for session:', session.id);
      console.log('Metadata:', session.metadata);

      const invoiceId = session.metadata?.invoice_id;
      
      if (!invoiceId) {
        console.error('No invoice_id in session metadata');
        return Response.json({ error: 'No invoice_id in metadata' }, { status: 400 });
      }

      // Initialize Wadaq client with service role
      const Wadaq = createClientFromRequest(req);

      try {
        // Get invoice
        const invoice = await Wadaq.asServiceRole.entities.Invoice.get(invoiceId);
        
        if (!invoice) {
          console.error('Invoice not found:', invoiceId);
          return Response.json({ error: 'Invoice not found' }, { status: 404 });
        }

        console.log('Found invoice:', invoice.invoice_number, 'Current status:', invoice.status);

        // Update invoice status to paid
        await Wadaq.asServiceRole.entities.Invoice.update(invoiceId, {
          ...invoice,
          status: 'paid',
          payment_method: 'credit_card',
          notes: `${invoice.notes || ''}\n\nDفع عبر Stripe - Session ID: ${session.id}`.trim()
        });

        console.log('Invoice updated successfully to paid status');

        // Send confirmation email to customer
        if (session.customer_email) {
          try {
            await Wadaq.asServiceRole.integrations.Core.SendEmail({
              from_name: invoice.created_by || 'Smart Accountant',
              to: session.customer_email,
              subject: `تأكيد الدفع - ${invoice.invoice_number}`,
              body: `تم استلام دفعتك بنجاح!\n\nرقم الفاتورة: ${invoice.invoice_number}\nالمبلغ المدفوع: ${invoice.total} ر.س\n\nشكراً لك!`
            });
            console.log('Confirmation email sent to:', session.customer_email);
          } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
          }
        }

      } catch (dbError) {
        console.error('Database error:', dbError);
        return Response.json({ 
          error: 'Failed to update invoice',
          details: dbError.message 
        }, { status: 500 });
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: 'Webhook handler failed',
      details: error.message 
    }, { status: 500 });
  }
});