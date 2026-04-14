import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';
import Groq from 'npm:groq-sdk@0.7.0';

const groq = new Groq({
  apiKey: Deno.env.get("GROQ_API_KEY")
});

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, language } = await req.json();

    if (!Deno.env.get("GROQ_API_KEY")) {
      return Response.json({ 
        error: language === 'ar' 
          ? 'لم يتم تكوين مفتاح Groq API. يرجى إضافته في Dashboard → Code → Secrets'
          : 'Groq API key not configured. Please add it in Dashboard → Code → Secrets'
      }, { status: 500 });
    }

    // نظام الدعم الفني - سريع ومجاني
    const systemPrompt = language === 'ar' ? `
أنت "مساعد الدعم الفني" لنظام المحاسب الذكي من مؤسسة ركاز لتقنية المعلومات.

## 📱 معلومات الاتصال:
- واتساب: 0500070065
- بريد: support@rikazai.com
- الموقع: rikazai.com

## 🎯 دورك:
- الرد على الأسئلة العامة عن النظام
- شرح كيفية استخدام الميزات
- توجيه المستخدم للحل المناسب
- تقديم معلومات حول الباقات والأسعار

## 🚀 الباقات المتاحة:
1. **الأساسية**: 599 ر.س/سنة - محاسبة أساسية، فواتير، عملاء
2. **المتقدمة**: 1012 ر.س/سنة - كل الأساسية + عروض أسعار، مخزون، 50 عملية AI
3. **الذكية**: 2030 ر.س/سنة - كل المتقدمة + API، AI غير محدود
4. **العرض الذهبي**: 750 ر.س/3 سنوات - أفضل قيمة (≈21 ر.س/شهر)

## ⚠️ قواعد مهمة:
- كن ودوداً ومساعداً
- إذا سأل عن مشاكل تقنية معقدة، وجهه لفريق الدعم
- لا تخترع معلومات غير صحيحة
- كن واضحاً ومباشراً

أجب على السؤال بوضوح واحترافية.
` : `
You are the "Technical Support Assistant" for Smart Accountant by Rikaz IT Foundation.

## 📱 Contact Info:
- WhatsApp: 0500070065
- Email: support@rikazai.com
- Website: rikazai.com

## 🎯 Your Role:
- Answer general questions about the system
- Explain how to use features
- Guide users to appropriate solutions
- Provide information about plans and pricing

## 🚀 Available Plans:
1. **Basic**: 599 SAR/year - Basic accounting, invoices, customers
2. **Advanced**: 1012 SAR/year - All Basic + Quotations, Inventory, 50 AI ops
3. **Smart**: 2030 SAR/year - All Advanced + API, Unlimited AI
4. **Golden Offer**: 750 SAR/3 years - Best value (≈21 SAR/month)

## ⚠️ Important Rules:
- Be friendly and helpful
- For complex technical issues, direct to support team
- Don't invent incorrect information
- Be clear and direct

Answer the question clearly and professionally.
`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    return Response.json({
      success: true,
      answer: completion.choices[0].message.content,
      model: "Groq Llama 3.1 70B",
      cost: 0 // مجاني!
    });

  } catch (error) {
    console.error('Support Agent Error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Check console for more details'
    }, { status: 500 });
  }
});