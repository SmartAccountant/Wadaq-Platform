import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, add_context_from_internet, response_json_schema, file_urls } = await req.json();

    // Check if AI credit reset is needed (monthly)
    const now = new Date();
    const resetDate = user.ai_credit_reset_date ? new Date(user.ai_credit_reset_date) : null;
    
    if (!resetDate || now > resetDate) {
      // Reset credits (30 days from previous reset)
      const nextResetDate = new Date(resetDate || now);
      nextResetDate.setDate(nextResetDate.getDate() + 30);

      await Wadaq.auth.updateMe({
        ai_credits_used: 0,
        credits_reset_date: nextResetDate.toISOString()
      });
      
      // Refresh user data
      const updatedUser = await Wadaq.auth.me();
      user.ai_credit_used = updatedUser.ai_credit_used;
      user.ai_credit_limit = updatedUser.ai_credit_limit;
    }

    // Check credit limit
    const creditUsed = user.ai_credit_used || 0;
    const creditLimit = user.ai_credit_limit === undefined ? 50 : user.ai_credit_limit; // Default to 50 if undefined

    if (creditLimit > 0 && creditUsed >= creditLimit) {
      const planName = user.subscription_plan || 'الحالية';
      const planNameEn = user.subscription_plan || 'current';
      
      return Response.json({
        error: `عذراً، لقد استهلكت كامل حصتك من العمليات الذكية لهذا الشهر وفقاً لباقة (${planName}). يمكنك الترقية للحصول على المزيد.`,
        error_en: `Sorry, you have consumed your entire quota of AI operations for this month according to the (${planNameEn}) plan. You can upgrade to get more.`,
        credit_used: creditUsed,
        credit_limit: creditLimit
      }, { status: 429 });
    }
    
    // Block AI if limit is 0 (Basic plan)
    if (creditLimit === 0) {
        return Response.json({
            error: `عذراً، العمليات الذكية غير متاحة في باقتك الحالية. يرجى الترقية للاستفادة من هذه الميزة.`,
            error_en: `Sorry, AI operations are not available in your current plan. Please upgrade to use this feature.`,
            credit_used: creditUsed,
            credit_limit: creditLimit
        }, { status: 403 });
    }

    // Call AI
    const result = await Wadaq.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: add_context_from_internet || false,
      response_json_schema: response_json_schema || null,
      file_urls: file_urls || null
    });

    // Increment credit counter
    await Wadaq.auth.updateMe({
      ai_credit_used: creditUsed + 1
    });

    return Response.json({
      success: true,
      result,
      credits_remaining: creditLimit - creditUsed - 1
    });

  } catch (error) {
    console.error('AI invocation error:', error);
    return Response.json({ 
      error: 'حدث خطأ أثناء معالجة الطلب',
      details: error.message 
    }, { status: 500 });
  }
});