import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.20';
import Groq from 'npm:groq-sdk@0.7.0';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, language } = await req.json();

    if (!question) {
      return Response.json({ error: 'Question is required' }, { status: 400 });
    }

    const groq = new Groq({ apiKey: Deno.env.get("GROQ_API_KEY") });

    if (!Deno.env.get("GROQ_API_KEY")) {
      return Response.json({
        error: language === 'ar' ? 'لم يتم تكوين مفتاح API' : 'API key not configured'
      }, { status: 500 });
    }

    // كلمات مفتاحية للمحاسبة
    const accountingKeywords = language === 'ar'
      ? ['مبيعات', 'أرباح', 'خسارة', 'تحليل', 'تقرير', 'أداء', 'منتج', 'عميل', 'مخزون', 'فاتورة', 'مصروف', 'ربح', 'إيراد', 'نمو', 'استراتيجية', 'ملخص', 'اعطني', 'أعطني']
      : ['sales', 'profit', 'loss', 'analysis', 'report', 'performance', 'product', 'customer', 'inventory', 'invoice', 'expense', 'revenue', 'growth', 'strategy', 'summary'];

    const questionLower = question.toLowerCase();
    const isAccountingQuestion = accountingKeywords.some(kw => questionLower.includes(kw));

    let systemPrompt = '';

    if (isAccountingQuestion) {
      // جلب بيانات الأعمال
      const [invoices, expenses, products, customers, stockMovements] = await Promise.all([
        Wadaq.entities.Invoice.filter({ created_by: user.email }).catch(() => []),
        Wadaq.entities.Expense.filter({ created_by: user.email }).catch(() => []),
        Wadaq.entities.Product.filter({ created_by: user.email }).catch(() => []),
        Wadaq.entities.Customer.filter({ created_by: user.email }).catch(() => []),
        Wadaq.entities.StockMovement.filter({ created_by: user.email }).catch(() => [])
      ]);

      const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const netProfit = totalSales - totalExpenses;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentMonthInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      const monthlyRevenue = currentMonthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

      // أفضل المنتجات
      const productSales = {};
      invoices.forEach(inv => {
        inv.items?.forEach(item => {
          if (item.product_name) {
            if (!productSales[item.product_name]) productSales[item.product_name] = { qty: 0, rev: 0 };
            productSales[item.product_name].qty += item.quantity || 0;
            productSales[item.product_name].rev += item.total || 0;
          }
        });
      });
      const topProducts = Object.entries(productSales).sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);

      // أفضل العملاء
      const customerStats = {};
      invoices.forEach(inv => {
        if (inv.customer_name) {
          if (!customerStats[inv.customer_name]) customerStats[inv.customer_name] = { count: 0, rev: 0 };
          customerStats[inv.customer_name].count++;
          customerStats[inv.customer_name].rev += inv.total || 0;
        }
      });
      const topCustomers = Object.entries(customerStats).sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);

      const lowStock = products.filter(p => !p.has_variants && p.quantity > 0 && p.quantity <= (p.min_stock_level || 5));
      const outOfStock = products.filter(p => !p.has_variants && p.quantity === 0);

      systemPrompt = language === 'ar' ? `
أنت مستشار محاسبي ومالي ذكي مدمج في نظام (برنامج ودق المحاسبي).

## قواعد الإجابة الصارمة:

### 1. الأولوية المطلقة لبيانات العميل:
عند طرح أي سؤال، ابحث أولاً في الأرقام المالية، الفواتير، والعملاء الخاصين بالمستخدم للإجابة.

### 2. دمج المعلومات الخارجية بالبيانات الداخلية:
إذا سأل المستخدم سؤالاً عاماً (مثلاً: كيف أزيد مبيعاتي؟)، لا تعطه نصائح إنشائية فقط؛ بل حلل بياناته أولاً ثم قدم النصيحة بناءً عليها.

### 3. منع المعلومات التجارية للبرنامج:
لا تذكر أسعار باقات "المحاسب الذكي" أو روابط التواصل أو البريد الإلكتروني الخاص بالمؤسسة نهائياً، إلا إذا سأل المستخدم سؤالاً صريحاً جداً (مثال: كم سعر الاشتراك؟).

### 4. الدقة الرقمية:
يمنع تخمين الأرقام. اعتمد فقط على الأرقام المتوفرة في البيانات أدناه.

### 5. أسلوب الرد:
مهني، عملي، ومختصر، مع تقديم توصيات قابلة للتنفيذ.

## البيانات المالية الفعلية للمستخدم:
- إجمالي المبيعات: ${totalSales.toLocaleString()} ر.س (${invoices.length} فاتورة)
- مدفوعة: ${paidInvoices.length} فاتورة
- غير مدفوعة: ${unpaidInvoices.length} فاتورة (${unpaidInvoices.reduce((s,i) => s+(i.total||0), 0).toLocaleString()} ر.س)
- إجمالي المصروفات: ${totalExpenses.toLocaleString()} ر.س
- صافي الربح: ${netProfit.toLocaleString()} ر.س
- مبيعات هذا الشهر: ${monthlyRevenue.toLocaleString()} ر.س (${currentMonthInvoices.length} فاتورة)
- عدد المنتجات: ${products.length} | العملاء: ${customers.length}
- منخفض المخزون: ${lowStock.length} منتج | نفد: ${outOfStock.length} منتج

## أفضل المنتجات:
${topProducts.map((p,i) => `${i+1}. ${p[0]}: ${p[1].rev.toLocaleString()} ر.س (${p[1].qty} وحدة)`).join('\n') || 'لا توجد مبيعات بعد'}

## أفضل العملاء:
${topCustomers.map((c,i) => `${i+1}. ${c[0]}: ${c[1].rev.toLocaleString()} ر.س (${c[1].count} فاتورة)`).join('\n') || 'لا يوجد عملاء بعد'}
` : `
You are a smart accounting and financial advisor integrated into the (Wadq Accounting Software).

## Strict Response Rules:

### 1. Absolute Priority for Client Data:
When any question is asked, first search the user's financial figures, invoices, and customers to answer.

### 2. Combine External Knowledge with Internal Data:
If the user asks a general question (e.g., how do I increase sales?), don't just give generic advice — analyze their data first, then provide recommendations based on it.

### 3. No Commercial Info for the Software:
Never mention Smart Accountant plan prices, contact links, or institutional email, unless the user explicitly asks (e.g., what is the subscription price?).

### 4. Numerical Accuracy:
Never guess numbers. Only rely on figures available in the data below.

### 5. Response Style:
Professional, practical, and concise, with actionable recommendations.

## User's Actual Financial Data:
- Total Sales: ${totalSales.toLocaleString()} SAR (${invoices.length} invoices)
- Paid: ${paidInvoices.length} | Unpaid: ${unpaidInvoices.length}
- Total Expenses: ${totalExpenses.toLocaleString()} SAR
- Net Profit: ${netProfit.toLocaleString()} SAR
- This Month: ${monthlyRevenue.toLocaleString()} SAR
- Products: ${products.length} | Customers: ${customers.length}

## Top Products:
${topProducts.map((p,i) => `${i+1}. ${p[0]}: ${p[1].rev.toLocaleString()} SAR (${p[1].qty} units)`).join('\n') || 'No sales yet'}

Answer based strictly on this data.
`;
    } else {
      // دعم فني / أسئلة عامة
      systemPrompt = language === 'ar' ? `
أنت مستشار محاسبي ومالي ذكي مدمج في نظام (برنامج ودق المحاسبي).

## قواعد صارمة:
- أجب على الأسئلة المحاسبية والمالية والإدارية بشكل مهني ومختصر.
- لا تذكر أسعار الباقات أو بيانات التواصل مع الشركة إلا إذا سأل المستخدم صراحةً.
- لا تخترع أرقاماً أو معلومات غير موجودة في السياق.
- قدم توصيات قابلة للتنفيذ.

إذا سأل المستخدم عن الاشتراك أو الأسعار أو التواصل صراحةً، يمكنك حينها الإشارة إلى:
- واتساب: 0500070065
- بريد: support@rikazai.com

كن مهنياً وعملياً ومباشراً.
` : `
You are a smart accounting and financial advisor integrated into the (Wadq Accounting Software).

## Strict Rules:
- Answer accounting, financial, and business questions professionally and concisely.
- Do not mention plan prices or company contact info unless the user explicitly asks.
- Never invent numbers or information not present in context.
- Provide actionable recommendations.

If the user explicitly asks about subscription or contact, you may refer to:
- WhatsApp: 0500070065
- Email: support@rikazai.com

Be professional, practical, and direct.
`;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1500,
    });

    return Response.json({
      success: true,
      answer: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error('Smart AI Router Error:', error);
    return Response.json({
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
});