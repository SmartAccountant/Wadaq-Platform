import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';
import OpenAI from 'npm:openai@4.73.1';

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY")
});

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, businessData, language } = await req.json();

    if (!Deno.env.get("OPENAI_API_KEY")) {
      return Response.json({ 
        error: language === 'ar'
          ? 'لم يتم تكوين مفتاح OpenAI API. يرجى إضافته في Dashboard → Code → Secrets'
          : 'OpenAI API key not configured. Please add it in Dashboard → Code → Secrets'
      }, { status: 500 });
    }

    // التحقق من حد الاستخدام الشهري
    const plan = user.subscription_plan || 'basic';
    const limits = {
      basic: 0,
      advanced: 50,
      smart: -1,
      golden: 15
    };
    
    const monthlyLimit = limits[plan];
    
    if (monthlyLimit === 0) {
      return Response.json({
        error: language === 'ar'
          ? '⚠️ المساعد المحاسبي غير متاح في باقتك. يرجى الترقية للباقة المتقدمة أو أعلى.'
          : '⚠️ Accounting advisor not available in your plan. Please upgrade to Advanced or higher.'
      }, { status: 403 });
    }

    if (monthlyLimit !== -1) {
      const creditsUsed = user.ai_credits_used || 0;
      
      if (creditsUsed >= monthlyLimit) {
        return Response.json({
          error: language === 'ar'
            ? `⚠️ استنفدت رصيدك الشهري (${monthlyLimit} عملية). للترقية: القائمة ← الباقات`
            : `⚠️ Monthly limit reached (${monthlyLimit} operations). To upgrade: Menu → Plans`
        }, { status: 429 });
      }
      
      // زيادة العداد
      await Wadaq.auth.updateMe({
        ai_credits_used: creditsUsed + 1
      });
    }

    // المستشار المحاسبي
    const systemPrompt = language === 'ar' ? `
أنت مستشار محاسبي ومالي ذكي مدمج في نظام (المحاسب الذكي).

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

## البيانات المالية الفعلية:
${businessData}
` : `
You are a smart accounting and financial advisor integrated into the (Smart Accountant) system.

## Strict Response Rules:

### 1. Absolute Priority for Client Data:
When any question is asked, first search the user's financial figures, invoices, and customers to answer.

### 2. Combine External Knowledge with Internal Data:
If the user asks a general question, analyze their data first, then provide recommendations based on it.

### 3. No Commercial Info for the Software:
Never mention Smart Accountant plan prices, contact links, or institutional email, unless the user explicitly asks.

### 4. Numerical Accuracy:
Never guess numbers. Only rely on figures available in the data below.

### 5. Response Style:
Professional, practical, and concise, with actionable recommendations.

## Actual Financial Data:
${businessData}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return Response.json({
      success: true,
      answer: completion.choices[0].message.content,
      model: "GPT-4o-mini",
      creditsRemaining: monthlyLimit === -1 ? -1 : monthlyLimit - (user.ai_credits_used || 0) - 1
    });

  } catch (error) {
    console.error('Accounting Advisor Error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Check console for more details'
    }, { status: 500 });
  }
});