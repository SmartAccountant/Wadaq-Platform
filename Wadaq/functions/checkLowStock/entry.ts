import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    
    // Get all products with low stock
    const products = await Wadaq.asServiceRole.entities.Product.filter({
      is_active: true
    });
    
    const lowStockProducts = products.filter(product => {
      const minStock = product.min_stock_level || 5;
      return product.quantity <= minStock;
    });
    
    if (lowStockProducts.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No low stock products',
        count: 0
      });
    }
    
    // Get all admin users
    const users = await Wadaq.asServiceRole.entities.User.filter({
      role: 'admin'
    });
    
    // Create notifications for each admin
    const notifications = [];
    for (const user of users) {
      for (const product of lowStockProducts) {
        await Wadaq.asServiceRole.entities.Notification.create({
          title: `تنبيه: مخزون منخفض`,
          message: `المنتج "${product.name}" وصل إلى الحد الأدنى. الكمية المتبقية: ${product.quantity}`,
          type: 'low_stock',
          reference_id: product.id,
          user_email: user.email,
          is_read: false
        });
        notifications.push(product.name);
      }
    }
    
    return Response.json({ 
      success: true, 
      message: `Created ${notifications.length} notifications for ${lowStockProducts.length} products`,
      products: lowStockProducts.map(p => ({ name: p.name, quantity: p.quantity }))
    });
    
  } catch (error) {
    console.error('Error checking low stock:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});