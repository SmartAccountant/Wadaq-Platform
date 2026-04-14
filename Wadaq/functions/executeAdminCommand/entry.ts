import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    
    // Verify admin access
    const user = await Wadaq.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { command } = await req.json();

    if (!command) {
      return Response.json({ error: 'Command is required' }, { status: 400 });
    }

    // Use AI to parse and understand the command
    const aiResponse = await Wadaq.integrations.Core.InvokeLLM({
      prompt: `أنت مساعد إداري ذكي لنظام إدارة الاشتراكات. قم بتحليل الأمر التالي واستخراج المعلومات:

الأمر: "${command}"

استخرج التالي:
1. البريد الإلكتروني للمستخدم (email)
2. نوع العملية (action): "activate" للتفعيل أو "deactivate" للإلغاء أو "extend" للتمديد
3. المدة بالأشهر (duration_months): حول أي مدة زمنية إلى أشهر (سنة = 12 شهر، 6 أشهر = 6، إلخ)
4. حالة الاشتراك (subscription_status): "active" أو "founder" أو "expired"
5. هل تم ذكر مبلغ مدفوع؟ إذا نعم ضعه في payment_amount

إذا لم تجد معلومة، ضع null. 
إذا كان الأمر غير واضح أو لا يتعلق بإدارة الاشتراكات، ضع error مع رسالة توضيحية.`,
      response_json_schema: {
        type: "object",
        properties: {
          email: { type: "string" },
          action: { type: "string" },
          duration_months: { type: "number" },
          subscription_status: { type: "string" },
          payment_amount: { type: "number" },
          error: { type: "string" }
        }
      }
    });

    // Check for parsing errors
    if (aiResponse.error) {
      return Response.json({ 
        success: false, 
        error: aiResponse.error 
      }, { status: 400 });
    }

    const { email, action, duration_months, subscription_status, payment_amount } = aiResponse;

    if (!email) {
      return Response.json({ 
        success: false, 
        error: 'لم أستطع استخراج البريد الإلكتروني من الأمر' 
      }, { status: 400 });
    }

    // Get the user
    const users = await Wadaq.asServiceRole.entities.User.filter({ email });
    if (!users || users.length === 0) {
      return Response.json({ 
        success: false, 
        error: `المستخدم ${email} غير موجود` 
      }, { status: 404 });
    }

    const targetUser = users[0];

    // Calculate new expiry date
    let newExpiryDate = new Date();
    if (action === 'activate' || action === 'extend') {
      if (duration_months) {
        newExpiryDate.setMonth(newExpiryDate.getMonth() + duration_months);
      } else {
        // Default to 1 year if no duration specified
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      }
    } else if (action === 'deactivate') {
      // Set to past date for deactivation
      newExpiryDate.setDate(newExpiryDate.getDate() - 1);
    }

    // Prepare update data
    const updateData = {
      subscription_status: subscription_status || 'active',
      trial_end_date: newExpiryDate.toISOString(),
    };

    if (payment_amount) {
      updateData.payment_amount = payment_amount;
      updateData.payment_notes = `تم التفعيل يدوياً بواسطة المسؤول: ${command}`;
    }

    // Update the user
    await Wadaq.asServiceRole.entities.User.update(email, updateData);

    return Response.json({
      success: true,
      message: `تم تنفيذ الأمر بنجاح`,
      details: {
        email,
        action,
        subscription_status: updateData.subscription_status,
        expiry_date: newExpiryDate.toISOString(),
        payment_amount: payment_amount || null
      }
    });

  } catch (error) {
    console.error('Error executing admin command:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});