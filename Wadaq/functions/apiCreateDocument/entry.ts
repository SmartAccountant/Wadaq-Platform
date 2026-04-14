import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);

    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({
        error: 'Missing or invalid Authorization header. Use: Bearer YOUR_API_KEY'
      }, { status: 401 });
    }

    const apiKey = authHeader.replace('Bearer ', '').trim();
    if (!apiKey) {
      return Response.json({ error: 'API key is required' }, { status: 401 });
    }

    // Find user by API key
    const users = await Wadaq.asServiceRole.entities.User.filter({ api_key: apiKey });
    if (!users || users.length === 0) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const user = users[0];

    // Check subscription plan - only founder and enterprise allowed
    const allowedPlans = ['founder', 'enterprise'];
    if (!allowedPlans.includes(user.subscription_status)) {
      return Response.json({
        error: 'API access is restricted to Founder\'s Club and Enterprise plans only',
        current_plan: user.subscription_status,
        required_plans: allowedPlans
      }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return Response.json({
        error: 'Missing required fields: type and data',
        example: {
          type: 'invoice', // or 'quotation'
          data: {
            customer_name: 'Customer Name',
            date: '2026-01-31',
            items: [],
            total: 0
          }
        }
      }, { status: 400 });
    }

    // Validate document type
    if (!['invoice', 'quotation'].includes(type)) {
      return Response.json({
        error: 'Invalid document type. Must be "invoice" or "quotation"'
      }, { status: 400 });
    }

    // Add created_by to data
    const documentData = {
      ...data,
      created_by: user.email
    };

    // Create document
    let createdDocument;
    if (type === 'invoice') {
      createdDocument = await Wadaq.asServiceRole.entities.Invoice.create(documentData);
    } else {
      createdDocument = await Wadaq.asServiceRole.entities.Quotation.create(documentData);
    }

    return Response.json({
      success: true,
      type,
      document: createdDocument
    }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
});