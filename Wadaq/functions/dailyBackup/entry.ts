import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('Starting daily backup...');

    // Fetch all data
    const [
      invoices,
      customers,
      products,
      expenses,
      quotations,
      creditNotes,
      movements,
      batches
    ] = await Promise.all([
      Wadaq.asServiceRole.entities.Invoice.list(),
      Wadaq.asServiceRole.entities.Customer.list(),
      Wadaq.asServiceRole.entities.Product.list(),
      Wadaq.asServiceRole.entities.Expense.list(),
      Wadaq.asServiceRole.entities.Quotation.list(),
      Wadaq.asServiceRole.entities.CreditNote.list(),
      Wadaq.asServiceRole.entities.StockMovement.list(),
      Wadaq.asServiceRole.entities.ProductBatch.list()
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      app_id: Deno.env.get("Wadaq_APP_ID"),
      data: {
        invoices,
        customers,
        products,
        expenses,
        quotations,
        creditNotes,
        movements,
        batches
      },
      stats: {
        invoicesCount: invoices.length,
        customersCount: customers.length,
        productsCount: products.length,
        totalRecords: invoices.length + customers.length + products.length + expenses.length
      }
    };

    // Convert to JSON
    const jsonData = JSON.stringify(backupData, null, 2);
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonData);

    // Create filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `backup-${date}.json`;

    console.log(`Backup completed: ${backupData.stats.totalRecords} records`);

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Backup error:', error);
    return Response.json({ 
      error: 'Backup failed', 
      details: error.message 
    }, { status: 500 });
  }
});