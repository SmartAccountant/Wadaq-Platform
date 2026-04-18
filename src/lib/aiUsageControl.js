import { getAiAccessInfo } from "@/lib/subscriptionAccess";

/** بعد نجاح ردّ الذكاء الاصطناعي في فترة التجربة — زيادة العداد */
export async function incrementTrialAiUseIfNeeded(Wadaq, userBefore) {
  if (!userBefore || userBefore.subscription_status !== "trial") return;
  const used = Number(userBefore.settings?.ai_trial_uses ?? 0);
  await Wadaq.auth.updateMe({
    settings: { ...(userBefore.settings || {}), ai_trial_uses: used + 1 },
  });
}

export { getAiAccessInfo };
