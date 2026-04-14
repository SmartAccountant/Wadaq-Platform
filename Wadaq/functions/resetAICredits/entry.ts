import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usersToReset = await Wadaq.asServiceRole.entities.User.filter({
      credits_reset_date: { $lte: thirtyDaysAgo.toISOString() }
    });

    for (const user of usersToReset) {
      const nextResetDate = new Date();
      
      await Wadaq.asServiceRole.entities.User.update(user.id, {
        ai_credits_used: 0,
        credits_reset_date: nextResetDate.toISOString()
      });
      console.log(`AI credits reset for user ${user.email}`);
    }

    return Response.json({ success: true, reset_count: usersToReset.length });
  } catch (error) {
    console.error("Error resetting AI credits:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});