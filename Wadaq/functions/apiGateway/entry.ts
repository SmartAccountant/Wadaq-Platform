import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Get API key from header
    const apiKey = req.headers.get('X-API-Key');
    
    if (!apiKey) {
      return Response.json({ 
        error: 'Missing API key. Include X-API-Key header.' 
      }, { status: 401 });
    }

    // Verify API key and get user
    const Wadaq = createClientFromRequest(req);
    const users = await Wadaq.asServiceRole.entities.User.filter({ api_key: apiKey });
    
    if (users.length === 0) {
      return Response.json({ 
        error: 'Invalid API key' 
      }, { status: 401 });
    }

    const user = users[0];

    // Check if user has API access based on subscription
    if (!user.has_api_access) {
      return Response.json({ 
        error: 'API access not enabled for your subscription plan' 
      }, { status: 403 });
    }

    // Parse request
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const method = req.method;
    const body = method !== 'GET' ? await req.json() : null;

    // Route API requests
    switch (path) {
      case 'invoices':
        return handleInvoices(Wadaq, method, body, user);
      
      case 'customers':
        return handleCustomers(Wadaq, method, body, user);
      
      case 'products':
        return handleProducts(Wadaq, method, body, user);
      
      case 'vouchers':
        return handleVouchers(Wadaq, method, body, user);
      
      default:
        return Response.json({ 
          error: 'Invalid endpoint',
          available: [
            'GET /invoices - List all invoices',
            'POST /invoices - Create invoice',
            'GET /customers - List customers',
            'POST /customers - Create customer',
            'GET /products - List products',
            'POST /products - Create product',
            'GET /vouchers - List vouchers',
            'POST /vouchers - Create voucher'
          ]
        }, { status: 404 });
    }

  } catch (error) {
    console.error('API Gateway Error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});

async function handleInvoices(Wadaq, method, body, user) {
  if (method === 'GET') {
    const invoices = await Wadaq.asServiceRole.entities.Invoice.filter({ 
      created_by: user.email 
    }, '-created_date', 100);
    return Response.json({ data: invoices });
  }
  
  if (method === 'POST') {
    // Generate invoice number if not provided
    if (!body.invoice_number) {
      const lastInvoice = await Wadaq.asServiceRole.entities.Invoice.list('-created_date', 1);
      const lastNumber = lastInvoice[0]?.invoice_number?.match(/INV-(\d+)/)?.[1] || 0;
      body.invoice_number = `INV-${String(parseInt(lastNumber) + 1).padStart(6, '0')}`;
    }

    const invoice = await Wadaq.asServiceRole.entities.Invoice.create(body);
    return Response.json({ 
      success: true,
      data: invoice 
    }, { status: 201 });
  }
  
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

async function handleCustomers(Wadaq, method, body, user) {
  if (method === 'GET') {
    const customers = await Wadaq.asServiceRole.entities.Customer.filter({ 
      created_by: user.email 
    });
    return Response.json({ data: customers });
  }
  
  if (method === 'POST') {
    const customer = await Wadaq.asServiceRole.entities.Customer.create(body);
    return Response.json({ 
      success: true,
      data: customer 
    }, { status: 201 });
  }
  
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

async function handleProducts(Wadaq, method, body, user) {
  if (method === 'GET') {
    const products = await Wadaq.asServiceRole.entities.Product.filter({ 
      created_by: user.email 
    });
    return Response.json({ data: products });
  }
  
  if (method === 'POST') {
    const product = await Wadaq.asServiceRole.entities.Product.create(body);
    return Response.json({ 
      success: true,
      data: product 
    }, { status: 201 });
  }
  
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

async function handleVouchers(Wadaq, method, body, user) {
  if (method === 'GET') {
    const type = body?.type || 'both';
    let data = {};
    
    if (type === 'payment' || type === 'both') {
      const payments = await Wadaq.asServiceRole.entities.PaymentVoucher.filter({ 
        created_by: user.email 
      }, '-created_date', 50);
      data.payment_vouchers = payments;
    }
    
    if (type === 'receipt' || type === 'both') {
      const receipts = await Wadaq.asServiceRole.entities.ReceiptVoucher.filter({ 
        created_by: user.email 
      }, '-created_date', 50);
      data.receipt_vouchers = receipts;
    }
    
    return Response.json({ data });
  }
  
  if (method === 'POST') {
    const voucherType = body.voucher_type; // 'payment' or 'receipt'
    
    if (!voucherType) {
      return Response.json({ 
        error: 'voucher_type is required (payment or receipt)' 
      }, { status: 400 });
    }
    
    if (voucherType === 'payment') {
      const voucher = await Wadaq.asServiceRole.entities.PaymentVoucher.create(body);
      return Response.json({ 
        success: true,
        data: voucher 
      }, { status: 201 });
    }
    
    if (voucherType === 'receipt') {
      const voucher = await Wadaq.asServiceRole.entities.ReceiptVoucher.create(body);
      return Response.json({ 
        success: true,
        data: voucher 
      }, { status: 201 });
    }
    
    return Response.json({ 
      error: 'Invalid voucher_type. Use payment or receipt' 
    }, { status: 400 });
  }
  
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}