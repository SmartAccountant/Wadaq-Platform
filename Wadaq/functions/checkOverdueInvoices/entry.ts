import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all unpaid invoices
    const invoices = await Wadaq.asServiceRole.entities.Invoice.filter({
      status: 'sent'
    });
    
    const overdueInvoices = invoices.filter(invoice => {
      if (!invoice.due_date) return false;
      const dueDate = new Date(invoice.due_date);
      return dueDate < today;
    });
    
    if (overdueInvoices.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No overdue invoices',
        count: 0
      });
    }
    
    // Update invoice status to overdue
    const updated = [];
    for (const invoice of overdueInvoices) {
      await Wadaq.asServiceRole.entities.Invoice.update(invoice.id, {
        status: 'overdue'
      });
      updated.push(invoice.invoice_number);
    }
    
    // Get all admin users
    const users = await Wadaq.asServiceRole.entities.User.filter({
      role: 'admin'
    });
    
    // Create notifications for admins
    for (const user of users) {
      await Wadaq.asServiceRole.entities.Notification.create({
        title: `تنبيه: فواتير متأخرة`,
        message: `يوجد ${overdueInvoices.length} فاتورة متأخرة السداد تحتاج إلى متابعة`,
        type: 'overdue_invoices',
        reference_id: overdueInvoices[0].id,
        user_email: user.email,
        is_read: false
      });
    }
    
    return Response.json({ 
      success: true, 
      message: `Updated ${updated.length} overdue invoices`,
      invoices: updated
    });
    
  } catch (error) {
    console.error('Error checking overdue invoices:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});