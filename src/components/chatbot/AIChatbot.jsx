import React, { useState, useRef, useEffect } from "react";
import { Wadaq } from "@/api/WadaqClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Loader2, History, Trash2, Download, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageContext";
import { Badge } from "@/components/ui/badge";

export default function AIChatbot() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    Wadaq.auth.me().then(currentUser => {
      setUser(currentUser);
      if (currentUser?.subscription_status === 'trial') {
        const dailyUses = currentUser.ai_daily_uses || 0;
        const dailyLimit = currentUser.ai_daily_limit || 10;
        setCreditsRemaining(dailyLimit - dailyUses);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadOrCreateSession();
  }, [language]);

  const loadOrCreateSession = () => {
    const savedSessionId = localStorage.getItem('ai_current_session');
    
    if (savedSessionId) {
      const savedSession = localStorage.getItem(`ai_session_${savedSessionId}`);
      if (savedSession) {
        const session = JSON.parse(savedSession);
        setMessages(session.messages);
        setCurrentSessionId(savedSessionId);
        return;
      }
    }
    
    startNewSession();
  };

  const startNewSession = () => {
    const sessionId = Date.now().toString();
    const welcomeMessage = language === 'ar' 
      ? "👋 أهلاً بك! أنا كبير مستشاريك المالي في برنامج ودق المحاسبي\n\n🎯 **تخصصي**:\n• تحليل الأداء المالي بدقة احترافية\n• استخراج رؤى استراتيجية من بياناتك\n• تقديم توصيات عملية لزيادة الأرباح\n• مساعدتك في اتخاذ قرارات مالية ذكية\n\n💡 **جرّب هذه الأسئلة**:\n\"أعطني تقرير شامل عن أداء عملي\"\n\"حلل ربحية منتجاتي وأعطني توصيات\"\n\"لماذا نفذت بعض المنتجات من المخزون؟\"\n\"كيف أحسّن التدفق النقدي؟\"\n\n📊 جاهز لتحليل عملك بعمق!"
      : "👋 Welcome! I'm your Chief Financial Advisor in Wadq Accounting Software\n\n🎯 **My Expertise**:\n• Professional financial performance analysis\n• Extracting strategic insights from your data\n• Practical recommendations to increase profits\n• Smart financial decision support\n\n💡 **Try these questions**:\n\"Give me a comprehensive business report\"\n\"Analyze product profitability with recommendations\"\n\"Why did some products run out of stock?\"\n\"How to improve cash flow?\"\n\n📊 Ready to analyze your business!";
    
    const initialMessages = [{ role: "assistant", content: welcomeMessage }];
    setMessages(initialMessages);
    setCurrentSessionId(sessionId);
    
    saveSession(sessionId, initialMessages);
  };

  const saveSession = (sessionId, msgs) => {
    const session = {
      id: sessionId,
      messages: msgs,
      timestamp: new Date().toISOString(),
      title: msgs.find(m => m.role === 'user')?.content.substring(0, 50) || (language === 'ar' ? 'محادثة جديدة' : 'New chat')
    };
    
    localStorage.setItem(`ai_session_${sessionId}`, JSON.stringify(session));
    localStorage.setItem('ai_current_session', sessionId);
    
    const sessions = JSON.parse(localStorage.getItem('ai_sessions') || '[]');
    const existingIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = { id: sessionId, title: session.title, timestamp: session.timestamp };
    } else {
      sessions.unshift({ id: sessionId, title: session.title, timestamp: session.timestamp });
    }
    
    if (sessions.length > 50) {
      const removed = sessions.splice(50);
      removed.forEach(s => localStorage.removeItem(`ai_session_${s.id}`));
    }
    
    localStorage.setItem('ai_sessions', JSON.stringify(sessions));
  };

  const loadSession = (sessionId) => {
    const savedSession = localStorage.getItem(`ai_session_${sessionId}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      localStorage.setItem('ai_current_session', sessionId);
      setShowHistory(false);
    }
  };

  const deleteSession = (sessionId, e) => {
    e.stopPropagation();
    localStorage.removeItem(`ai_session_${sessionId}`);
    const sessions = JSON.parse(localStorage.getItem('ai_sessions') || '[]');
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem('ai_sessions', JSON.stringify(filtered));
    
    if (currentSessionId === sessionId) {
      startNewSession();
    }
    
    setShowHistory(false);
  };

  const exportChat = () => {
    const text = messages.map(m => `${m.role === 'user' ? (language === 'ar' ? 'أنت' : 'You') : (language === 'ar' ? 'ودق المحاسبي' : 'Wadq')}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      saveSession(currentSessionId, messages);
    }
    // Scroll after a short delay to ensure DOM has updated
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [messages]);

  const quickQuestions = language === 'ar' ? [
    "أعطني تقرير شامل عن أداء عملي",
    "حلل ربحية منتجاتي بالتفصيل",
    "ما أفضل استراتيجية لزيادة الأرباح؟",
    "لماذا نفذت بعض المنتجات وكيف أتجنب ذلك؟",
    "من هم عملائي الأفضل وكيف أحافظ عليهم؟"
  ] : [
    "Give me a comprehensive business report",
    "Analyze product profitability in detail",
    "Best strategy to increase profits?",
    "Why stock-outs and how to prevent?",
    "Top customers and retention strategy?"
  ];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const currentUser = await Wadaq.auth.me();
      
      // التحقق من حالة الاشتراك - فقط للمنتهي
      if (currentUser.subscription_status === 'expired') {
        const errorMsg = language === 'ar'
          ? `🎯 **للاستفادة من الذكاء الاصطناعي**\n\nاشتراكك منتهي. يرجى التجديد.\n\n💎 جدد الآن للحصول على:\n• تحليلات مالية متقدمة\n• توصيات ذكية غير محدودة\n• دعم استراتيجي فوري\n\n📱 اختر الباقة المناسبة: القائمة ← الباقات`
          : `🎯 **To Use AI Features**\n\nYour subscription expired. Please renew.\n\n💎 Renew now to get:\n• Advanced financial analysis\n• Unlimited smart recommendations\n• Instant strategic support\n\n📱 Choose your plan: Menu → Plans`;
        
        setMessages(prev => [...prev, {
          role: "assistant",
          content: errorMsg
        }]);
        setLoading(false);
        return;
      }
      
      // للتجربة والمشتركين: تتبع الاستهلاك
      if (currentUser.subscription_status === 'trial' || currentUser.subscription_status === 'active') {
        const plan = currentUser.subscription_plan || 'basic';
        const limits = {
          basic: 0,
          advanced: 50,
          smart: -1,
          golden: 15
        };
        
        const monthlyLimit = limits[plan];
        
        // غير محدود للباقة الذكية
        if (monthlyLimit !== -1) {
          const creditsUsed = currentUser.ai_credits_used || 0;
          
          // التحقق من تجاوز الحد
          if (creditsUsed >= monthlyLimit) {
            const errorMsg = language === 'ar'
              ? `⚠️ استنفدت رصيدك الشهري (${monthlyLimit} عملية)\n\n💎 للترقية لباقة أعلى:\nالقائمة ← الباقات`
              : `⚠️ Monthly limit reached (${monthlyLimit} operations)\n\n💎 To upgrade:\nMenu → Plans`;
            
            setMessages(prev => [...prev, {
              role: "assistant",
              content: errorMsg
            }]);
            setLoading(false);
            return;
          }
          
          // زيادة العداد الشهري (بدون عرضه)
          await Wadaq.auth.updateMe({
            ai_credits_used: creditsUsed + 1
          });
        }
      }

      // جلب جميع البيانات بشكل شامل
      const [invoices, expenses, products, customers, stockMovements, quotations, creditNotes, vouchers] = await Promise.all([
        Wadaq.entities.Invoice.filter({ created_by: currentUser.email }),
        Wadaq.entities.Expense.filter({ created_by: currentUser.email }),
        Wadaq.entities.Product.filter({ created_by: currentUser.email }),
        Wadaq.entities.Customer.filter({ created_by: currentUser.email }),
        Wadaq.entities.StockMovement.filter({ created_by: currentUser.email }).catch(() => []),
        Wadaq.entities.Quotation.filter({ created_by: currentUser.email }).catch(() => []),
        Wadaq.entities.CreditNote.filter({ created_by: currentUser.email }).catch(() => []),
        Wadaq.entities.ReceiptVoucher.filter({ created_by: currentUser.email }).catch(() => [])
      ]);

      // 📊 تحليلات شاملة ومتقدمة
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // تحليل المنتجات والمبيعات
      const productSales = {};
      const productProfit = {};
      invoices.forEach(inv => {
        inv.items?.forEach(item => {
          if (item.product_name) {
            if (!productSales[item.product_name]) {
              productSales[item.product_name] = { quantity: 0, revenue: 0, count: 0 };
            }
            productSales[item.product_name].quantity += item.quantity || 0;
            productSales[item.product_name].revenue += item.total || 0;
            productSales[item.product_name].count += 1;
            
            // حساب الربح
            const product = products.find(p => p.name === item.product_name);
            if (product && product.cost_price) {
              const profit = (item.price - product.cost_price) * item.quantity;
              productProfit[item.product_name] = (productProfit[item.product_name] || 0) + profit;
            }
          }
        });
      });

      const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([name, data]) => ({
          name,
          revenue: data.revenue,
          quantity: data.quantity,
          profit: productProfit[name] || 0,
          margin: productProfit[name] ? ((productProfit[name] / data.revenue) * 100).toFixed(1) : 0
        }));

      const totalVAT = invoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
      const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalSalesPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);

      // تحليل شهري ومقارنات
      const currentMonthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      });
      const lastMonthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
      });

      const monthlyRevenue = currentMonthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const monthlyGrowth = lastMonthRevenue > 0 ? (((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : 0;

      // تحليل المصروفات
      const expenseByCategory = {};
      const currentMonthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      });
      currentMonthExpenses.forEach(exp => {
        expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + (exp.amount || 0);
      });
      const topExpenses = Object.entries(expenseByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const detectLanguage = (text) => {
        const arabicPattern = /[\u0600-\u06FF]/;
        return arabicPattern.test(text) ? 'ar' : 'en';
      };
      const detectedLang = detectLanguage(userMessage);

      // تحليل العملاء المتقدم
      const customerStats = {};
      invoices.forEach(inv => {
        if (inv.customer_name) {
          if (!customerStats[inv.customer_name]) {
            customerStats[inv.customer_name] = { count: 0, revenue: 0, lastPurchase: null };
          }
          customerStats[inv.customer_name].count += 1;
          customerStats[inv.customer_name].revenue += inv.total || 0;
          const invDate = new Date(inv.date);
          if (!customerStats[inv.customer_name].lastPurchase || invDate > new Date(customerStats[inv.customer_name].lastPurchase)) {
            customerStats[inv.customer_name].lastPurchase = inv.date;
          }
        }
      });
      const topCustomers = Object.entries(customerStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([name, data]) => ({
          name,
          count: data.count,
          revenue: data.revenue,
          avgOrder: (data.revenue / data.count).toFixed(0),
          lastPurchase: data.lastPurchase
        }));

      // تحليل المخزون المتقدم
      const lowStockProducts = products.filter(p => !p.has_variants && p.quantity > 0 && p.quantity <= (p.min_stock_level || 5))
        .slice(0, 10);
      const outOfStockProducts = products.filter(p => !p.has_variants && p.quantity === 0).slice(0, 10);
      const slowMovingProducts = products.filter(p => {
        const sales = productSales[p.name];
        return !sales || sales.quantity < 5;
      }).slice(0, 10);

      // الفواتير والأرباح
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');
      const overdueInvoices = invoices.filter(inv => {
        if (inv.status === 'paid' || inv.status === 'cancelled') return false;
        const dueDate = new Date(inv.due_date);
        return dueDate < now;
      });
      
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const currentMonthTotalExpenses = currentMonthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const netProfit = totalSales - totalExpenses;
      const currentMonthNetProfit = monthlyRevenue - currentMonthTotalExpenses;
      const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;
      
      // معدلات الأداء
      const avgInvoiceValue = invoices.length > 0 ? (totalSales / invoices.length).toFixed(0) : 0;
      const avgMonthlyRevenue = invoices.length > 0 ? (totalSales / Math.max(1, Math.ceil((now - new Date(invoices[invoices.length - 1]?.date || now)) / (1000 * 60 * 60 * 24 * 30)))).toFixed(0) : 0;
      
      // حركة المخزون
      const recentStockOuts = stockMovements.filter(sm => sm.type === 'out').slice(0, 20);
      const recentStockIns = stockMovements.filter(sm => sm.type === 'in').slice(0, 20);

      const context = detectedLang === 'ar' ? `
# أنت كبير مستشاري الأعمال والمحاسبة - خبير استراتيجي من الطراز الأول

## 🎯 هويتك ودورك:
أنت مستشار أعمال ومحلل مالي متخصص داخل "برنامج ودق المحاسبي"، بخبرة 20+ سنة في تحليل الأعمال والاستشارات المالية.
مهمتك: تقديم تحليلات استراتيجية عميقة ونصائح عملية قابلة للتطبيق الفوري تساعد صاحب العمل على:
- فهم أداء عمله بدقة تامة
- اتخاذ قرارات مالية ذكية مبنية على البيانات
- زيادة الأرباح وتحسين الكفاءة التشغيلية
- تجنب المخاطر المالية وإدارة التدفق النقدي

## ⚠️ القواعد الاستراتيجية - التزم بها بدقة مطلقة:

### 1. قاعدة الاستنتاج الذكي (No Excuses Rule):
- **ممنوع الاعتذار عن نقص البيانات**
- إذا لم تجد رقماً مباشراً، قم بالاستنتاج الذكي من البيانات المتاحة
- مثال: إذا كان المخزون 50 الشهر الماضي والآن 3، استنتج معدل البيع اليومي = (50-3)/30 = 1.5 وحدة/يوم
- إذا سأل "لماذا نفذ المخزون؟" لا تقل "لا توجد بيانات" بل قل: "من خلال تتبع حركة المخزون، بعت X وحدة في Y يوم، مما يعني معدل طلب قوي"

### 2. قاعدة الذاكرة التحليلية (Historical Intelligence):
- استخدم جميع البيانات التاريخية لفهم الاتجاهات
- قارن دائماً: الشهر الحالي vs الماضي، الأسبوع الحالي vs السابق
- احسب النسب المالية تلقائياً: هامش الربح، معدل النمو، دوران المخزون
- حلل الأسباب الجذرية وليس الأعراض فقط

### 3. قاعدة المبادرة (Proactive Advisor):
- لا تنهِ ردك بجملة جافة
- **ممنوع منعاً باتاً** ذكر رقم الواتساب أو البريد في كل رد
- اختم كل رد بـ:
  * سؤال محفّز لاتخاذ قرار: "هل تريد مراجعة قائمة الموردين لتأمين دفعة جديدة؟"
  * أو توصية تطويرية: "أنصحك بتفعيل تنبيهات المخزون المنخفض لتجنب نفاذ المخزون مستقبلاً"
  * أو رؤية استراتيجية: "بناءً على هذا الأداء، يمكنك زيادة الطلبات من هذا المنتج بنسبة 50%"

### 4. قاعدة الأسلوب الاحترافي:
- أنت "رادار ركاز" - المحلل الاستراتيجي الأول
- تحدث بثقة الخبير، استخدم "أنصحك"، "يجب عليك"، "الفرصة الآن"
- لغتك عربية سعودية واضحة، احترافية، وودودة
- كن مباشراً وواثقاً، لا تتردد ولا تعتذر

### 5. الممنوعات المطلقة:
- ❌ اختراع أرقام غير موجودة
- ❌ الاعتذار عن عدم توفر بيانات يمكن استنتاجها
- ❌ نسخ البيانات دون تحليل أو تفسير
- ❌ الردود العامة والسطحية
- ❌ ذكر معلومات التواصل في كل رد (فقط عند الطلب)

## 📊 البيانات المالية والتشغيلية الشاملة:

### 💰 الأداء المالي الإجمالي:
- **إجمالي المبيعات**: ${totalSales.toLocaleString()} ر.س من ${invoices.length} فاتورة
- **المدفوع فعلياً**: ${totalSalesPaid.toLocaleString()} ر.س (${paidInvoices.length} فاتورة)
- **إجمالي المصروفات**: ${totalExpenses.toLocaleString()} ر.س من ${expenses.length} مصروف
- **صافي الربح**: ${netProfit.toLocaleString()} ر.س | هامش الربح: ${profitMargin}%
- **الضريبة المحصلة**: ${totalVAT.toLocaleString()} ر.س
- **متوسط قيمة الفاتورة**: ${avgInvoiceValue} ر.س

### 📈 الأداء الشهري والنمو:
- **مبيعات الشهر الحالي**: ${monthlyRevenue.toLocaleString()} ر.س (${currentMonthInvoices.length} فاتورة)
- **مبيعات الشهر الماضي**: ${lastMonthRevenue.toLocaleString()} ر.س (${lastMonthInvoices.length} فاتورة)
- **معدل النمو**: ${monthlyGrowth > 0 ? '+' : ''}${monthlyGrowth}%
- **مصروفات هذا الشهر**: ${currentMonthTotalExpenses.toLocaleString()} ر.س
- **صافي ربح الشهر**: ${currentMonthNetProfit.toLocaleString()} ر.س
- **متوسط الإيرادات الشهرية**: ${avgMonthlyRevenue} ر.س

### 📦 أفضل المنتجات أداءً (من حيث الإيرادات والربحية):
${topProducts.slice(0, 10).map((p, i) => 
  `${i + 1}. **${p.name}**
   - الإيرادات: ${p.revenue.toLocaleString()} ر.س
   - الكمية المباعة: ${p.quantity} وحدة
   - الربح: ${p.profit.toLocaleString()} ر.س | هامش الربح: ${p.margin}%`
).join('\n') || 'لا توجد مبيعات بعد'}

### 👥 أفضل العملاء (حسب الإيرادات):
${topCustomers.slice(0, 10).map((c, i) => 
  `${i + 1}. **${c.name}**
   - عدد الفواتير: ${c.count}
   - إجمالي الإيرادات: ${c.revenue.toLocaleString()} ر.س
   - متوسط الطلب: ${c.avgOrder} ر.س
   - آخر عملية شراء: ${c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString('ar-SA') : 'غير محدد'}`
).join('\n') || 'لا يوجد عملاء بعد'}

### 💳 حالة الفواتير:
- **مدفوعة**: ${paidInvoices.length} فاتورة (${totalSalesPaid.toLocaleString()} ر.س)
- **غير مدفوعة**: ${unpaidInvoices.length} فاتورة (${unpaidInvoices.reduce((s, i) => s + (i.total || 0), 0).toLocaleString()} ر.س)
- **متأخرة**: ${overdueInvoices.length} فاتورة (${overdueInvoices.reduce((s, i) => s + (i.total || 0), 0).toLocaleString()} ر.س) ⚠️

### 💸 أكبر بنود المصروفات (هذا الشهر):
${topExpenses.slice(0, 5).map(([cat, amt], i) => 
  `${i + 1}. ${cat}: ${amt.toLocaleString()} ر.س`
).join('\n') || 'لا توجد مصروفات هذا الشهر'}

### 📦 حالة المخزون:
- **إجمالي المنتجات**: ${products.length} منتج
${lowStockProducts.length > 0 ? `
- **⚠️ منخفض المخزون** (${lowStockProducts.length} منتج):
${lowStockProducts.slice(0, 5).map((p, i) => 
  `  ${i + 1}. ${p.name}: متبقي ${p.quantity} (الحد الأدنى: ${p.min_stock_level || 5})`
).join('\n')}` : ''}
${outOfStockProducts.length > 0 ? `
- **🚨 نفذ من المخزون** (${outOfStockProducts.length} منتج):
${outOfStockProducts.slice(0, 5).map((p, i) => 
  `  ${i + 1}. ${p.name}`
).join('\n')}` : ''}
${slowMovingProducts.length > 0 ? `
- **🐌 بطيء الحركة** (مبيعات < 5):
${slowMovingProducts.slice(0, 5).map((p, i) => 
  `  ${i + 1}. ${p.name} (${productSales[p.name]?.quantity || 0} وحدة مباعة)`
).join('\n')}` : ''}

### 🔄 حركات المخزون الأخيرة:
**آخر عمليات البيع:**
${recentStockOuts.slice(0, 10).map((sm, i) => 
  `${i + 1}. ${sm.product_name}: بيع ${Math.abs(sm.quantity || 0)} وحدة (من ${sm.previous_quantity} → ${sm.new_quantity}) - ${new Date(sm.date).toLocaleDateString('ar-SA')}`
).join('\n') || 'لا توجد عمليات بيع'}

**آخر عمليات الإضافة:**
${recentStockIns.slice(0, 5).map((sm, i) => 
  `${i + 1}. ${sm.product_name}: إضافة ${sm.quantity || 0} وحدة (من ${sm.previous_quantity} → ${sm.new_quantity}) - ${new Date(sm.date).toLocaleDateString('ar-SA')}`
).join('\n') || 'لا توجد عمليات إضافة'}

### 📋 بيانات إضافية:
- **عروض الأسعار**: ${quotations.length} (مقبولة: ${quotations.filter(q => q.status === 'accepted').length})
- **إشعارات دائنة**: ${creditNotes.length} (${creditNotes.reduce((s, c) => s + Math.abs(c.total || 0), 0).toLocaleString()} ر.س)
- **سندات القبض**: ${vouchers.length} (${vouchers.reduce((s, v) => s + (v.amount || 0), 0).toLocaleString()} ر.س)

## 🎯 منهجية الرد الاحترافية:

### أولاً: التحليل (اقرأ البيانات بعمق):
1. **افهم السؤال** واستخرج كل البيانات ذات الصلة
2. **احسب المؤشرات**: النسب، الاتجاهات، المقارنات، معدلات النمو
3. **حلل الأسباب**: ابحث عن العلاقات بين البيانات (مثلاً: لماذا انخفضت المبيعات؟ هل زادت المصروفات؟)
4. **حدد الفرص والمخاطر**: ماذا يمكن تحسينه؟ ما هي التحديات؟

### ثانياً: تنظيم الرد:
للأسئلة العامة (ملخص، تقرير):
- ابدأ بملخص تنفيذي (3-4 أسطر)
- ثم تحليل الأداء بالأرقام
- اختم بتوصيات استراتيجية (2-3 نقاط)

للأسئلة المحددة:
- إجابة مباشرة أولاً
- ثم التفاصيل والأرقام
- نصيحة عملية في النهاية

### ثالثاً: المعايير والأسلوب:
✅ **افعل**:
- استنتج من البيانات المتاحة (لا تعتذر عن نقصها)
- احسب المؤشرات: معدلات، نسب مئوية، اتجاهات
- قارن: حالي vs ماضي، منتج vs آخر، عميل vs آخر
- اختم بسؤال محفّز أو توصية استراتيجية
- تحدث بثقة: "أنصحك"، "يجب عليك"، "الفرصة الآن"
- نظّم ردك بشكل جميل مع عناوين وأيقونات معتدلة

❌ **لا تفعل**:
- الاعتذار: "عذراً لا توجد بيانات كافية" (استنتج!)
- الجفاف: "المبيعات 1000 ريال" (حلل! قارن! فسّر!)
- التكرار: ذكر الواتساب/البريد في كل رد
- السطحية: ردود عامة بدون أرقام محددة
- الاختراع: أرقام غير موجودة في البيانات

## 💡 أمثلة للردود الصحيحة:

### مثال 1 - تحليل الأداء:
سؤال: "كيف أداء مبيعاتي؟"
✅ رد صحيح:
"مبيعاتك ${totalSales.toFixed(0)} ر.س من ${invoices.length} فاتورة 📊

${netProfit > 0 ? `✅ صافي ربحك: ${netProfit.toFixed(0)} ر.س` : `⚠️ خسارة: ${Math.abs(netProfit).toFixed(0)} ر.س - راجع مصروفاتك`}

${unpaidInvoices > 0 ? `💰 متبقي: ${unpaidInvoices} فاتورة غير مدفوعة - تابعها` : ''}"

### مثال 2 - توصيات:
سؤال: "كيف أزيد أرباحي؟"
✅ رد صحيح مبني على بياناته:
${topProducts.length > 0 ? `"ركّز على: ${topProducts[0].name} (أفضل منتج)

نصائح سريعة:
• خفّض المصروفات الكبيرة: ${topExpenses.length > 0 ? topExpenses[0][0] : 'راجع المصروفات'}
${unpaidInvoices.length > 0 ? `• تابع ${unpaidInvoices.length} فاتورة غير مدفوعة` : ''}
${lowStockProducts.length > 0 ? `• جهّز مخزون: ${lowStockProducts[0].name}` : ''}"` : `"بياناتك قليلة! ضيف فواتير ومنتجات أكثر عشان أقدر أحللها وأعطيك توصيات دقيقة 📊"`}

### مثال 3 - تحليل المخزون:
سؤال: "لماذا نفذت المنتجات من المخزون؟"
✅ رد صحيح يستخدم حركات المخزون:
"راجعت حركات المخزون:

${stockMovements.filter(sm => sm.type === 'out').slice(0, 3).map(sm => 
  `• ${sm.product_name}: بيع ${Math.abs(sm.quantity || 0)} وحدة بتاريخ ${sm.date}`
).join('\n') || '• لا توجد حركات خروج مسجلة'}

${lowStockProducts.length > 0 ? `\n⚠️ منتجات تحتاج إعادة طلب:\n${lowStockProducts.slice(0, 3).map(p => `• ${p}`).join('\n')}` : ''}

نصيحة: راقب مخزونك وحدد حد طلب مناسب لكل منتج"

### مثال 4 - طلب الدعم:
سؤال: "كيف أتواصل معكم؟"
✅ رد صحيح:
"تقدر تتواصل مع الدعم الفني:
📱 واتساب: 0500070065
✉️ بريد: support@rikazai.com

كيف أقدر أساعدك؟"

## سؤال المستخدم:
${userMessage}

## تعليمات نهائية:
- حلل البيانات الحقيقية المذكورة أعلاه
- أعطِ إجابة دقيقة ومفيدة
- لا تخترع أرقام أو معلومات غير موجودة
- إذا البيانات قليلة، قل ذلك بوضوح
` : `
# You are "Rikaz Radar" - Chief Strategic Analyst & Financial Advisor

## 🎯 Your Identity:
You are a senior business consultant within "Wadq Accounting Software" with 20+ years of experience in business intelligence and financial strategy.

## ⚠️ Strategic Rules - Follow Strictly:

### 1. Smart Inference Rule (No Excuses):
- **Never apologize for missing data**
- If a direct number isn't available, make intelligent inferences from available data
- Example: If inventory was 50 last month and now 3, infer daily sales rate = (50-3)/30 = 1.5 units/day
- If asked "why stock out?" don't say "no data" but say: "Tracking inventory movement shows you sold X units in Y days, indicating strong demand"

### 2. Historical Intelligence Rule:
- Use all historical data to understand trends
- Always compare: current month vs last, current week vs previous
- Auto-calculate financial ratios: profit margin, growth rate, inventory turnover
- Analyze root causes, not just symptoms

### 3. Proactive Initiative Rule:
- Don't end responses with dry statements
- **Strictly forbidden** to mention WhatsApp/email in every response
- End each response with:
  * A motivating question for decision-making: "Would you like to review supplier list for new batch?"
  * Or developmental recommendation: "I recommend enabling low-stock alerts"
  * Or strategic insight: "Based on this performance, you can increase orders by 50%"

### 4. Professional Style Rule:
- You are "Rikaz Radar" - The Primary Strategic Analyst
- Speak with expert confidence, use "I recommend", "You should", "Opportunity now"
- Clear Saudi Arabic, professional, and friendly
- Be direct and confident, don't hesitate or apologize

### 5. Absolute Prohibitions:
- ❌ Inventing non-existent numbers
- ❌ Apologizing for data that can be inferred
- ❌ Copying data without analysis
- ❌ Generic superficial responses
- ❌ Mentioning contact info in every response (only when requested)

## User's Business Data:

### Financial Overview:
- Total Sales: ${totalSales.toFixed(0)} SAR (${invoices.length} invoices)
- Total Paid: ${totalSalesPaid.toFixed(0)} SAR
- Total Expenses: ${totalExpenses.toFixed(0)} SAR
- Net Profit: ${netProfit.toFixed(0)} SAR (${profitMargin}% margin)
- Current Month: ${monthlyRevenue.toFixed(0)} SAR
- Monthly Growth: ${monthlyGrowth}%

### Top Products (Revenue):
${topProducts.slice(0, 5).map((p, i) => `${i+1}. ${p.name}: ${p.revenue.toFixed(0)} SAR, ${p.quantity} units, ${p.margin}% margin`).join('\n') || 'No sales yet'}

### Top Customers:
${topCustomers.slice(0, 5).map((c, i) => `${i+1}. ${c.name}: ${c.revenue.toFixed(0)} SAR, ${c.count} orders`).join('\n') || 'No customers yet'}

### Inventory Status:
- Total Products: ${products.length}
- Low Stock: ${lowStockProducts.length} products
- Out of Stock: ${outOfStockProducts.length} products
- Slow Moving: ${slowMovingProducts.length} products

### Unpaid Invoices: ${unpaidInvoices.length}
### Overdue Invoices: ${overdueInvoices.length}

## How to respond:
- Be strategic and data-driven
- Provide actionable insights
- Use numbers and comparisons
- End with a proactive suggestion or question
- Keep professional but friendly tone
- If data is limited, infer what you can and suggest next steps

Question: ${userMessage}
`;

      // استخدام النظام الجديد
      const response = await Wadaq.functions.invoke('smartAIRouter', {
        question: userMessage,
        language: language
      });
      
      // التعامل مع الاستجابة
      if(response?.data?.success) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: response.data.answer 
        }]);
        
        if (response.data.creditsRemaining !== undefined && response.data.creditsRemaining !== -1) {
          setCreditsRemaining(response.data.creditsRemaining);
        }
      } else if (response?.data?.error) {
        // رسالة خطأ من الـ backend
        const errorMsg = response.data.error;
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: errorMsg
        }]);
      } else {
        // خطأ غير متوقع
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      console.error("Error details:", error.message, error.stack);
      const errorMsg = language === 'ar' 
        ? `عذراً، حدث خطأ: ${error.message || 'حاول مرة ثانية'}`
        : `Sorry, error: ${error.message || 'Try again'}`;
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: errorMsg 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-2xl animate-pulse relative"
          size="icon"
        >
          <MessageCircle className="w-7 h-7 text-white" />
          <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1" />
        </Button>
      </div>
    );
  }

  if (showHistory) {
    const sessions = JSON.parse(localStorage.getItem('ai_sessions') || '[]');
    
    return (
      <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col border-2 border-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-lg flex-row items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <CardTitle className="text-base">
              {language === 'ar' ? 'المحادثات السابقة' : 'Chat History'}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(false)}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
          <Button
            onClick={() => {
              startNewSession();
              setShowHistory(false);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'محادثة جديدة' : 'New Chat'}
          </Button>

          {sessions.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              {language === 'ar' ? 'لا توجد محادثات سابقة' : 'No previous chats'}
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`p-3 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors ${
                  currentSessionId === session.id ? 'bg-blue-50 border-2 border-blue-200' : 'bg-white border border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(session.timestamp).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteSession(session.id, e)}
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[550px] shadow-2xl z-50 flex flex-col border-2 border-blue-500">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <CardTitle className="text-base">
              {language === 'ar' ? 'ودق المحاسبي' : 'Wadq Accounting'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={exportChat}
              className="text-white hover:bg-white/20 h-8 w-8"
              title={language === 'ar' ? 'تصدير المحادثة' : 'Export chat'}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(true)}
              className="text-white hover:bg-white/20 h-8 w-8"
              title={language === 'ar' ? 'المحادثات السابقة' : 'Chat history'}
            >
              <History className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewSession}
              className="text-white hover:bg-white/20 h-8 w-8"
              title={language === 'ar' ? 'محادثة جديدة' : 'New chat'}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {user?.subscription_status === 'trial' && creditsRemaining !== null && (
          <Badge variant="secondary" className="bg-white/20 text-white text-xs">
            {language === 'ar' ? 'متبقي اليوم' : 'Left today'}: {creditsRemaining}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                  : "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 border border-slate-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl px-4 py-3 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-xs text-slate-600">
                  {language === 'ar' ? 'جاري التفكير...' : 'Thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {messages.length === 1 && !loading && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-slate-500 text-center">
              {language === 'ar' ? 'أسئلة سريعة:' : 'Quick questions:'}
            </p>
            {quickQuestions.map((q, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(q);
                  setTimeout(() => handleSend(), 100);
                }}
                className="w-full text-xs justify-start h-auto py-2 px-3 hover:bg-blue-50 hover:border-blue-300 text-right"
              >
                {q}
              </Button>
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={language === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question...'}
            className={`min-h-[60px] max-h-[120px] resize-none ${language === 'ar' ? 'text-right' : 'text-left'}`}
            disabled={loading}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 h-[60px] px-4"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}