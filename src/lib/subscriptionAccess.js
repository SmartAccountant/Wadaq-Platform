/**
 * صلاحيات الباقات والصفحات — يُستند إلى تعريف الباقات في صفحة الاشتراك.
 * التجربة: جميع القوائم متاحة؛ الذكاء الاصطناعي يُقيَّد في الواجهة (7 استخدامات).
 */

import { isSuperAdminUser } from "./superAdmin.js";

export const TRIAL_AI_LIMIT = 7;

/** صفحات الباقة الأساسية */
const BASIC_PAGES = new Set([
  "Dashboard",
  "Pricing",
  "Subscription",
  "Settings",
  "Checkout",
  "checkout",
  "PaymentInvoice",
  "SubscriptionSuccess",
  "Customers",
  "Products",
  "Inventory",
  "Invoices",
  "Expenses",
  "Reports",
  "About",
]);

/** باقة متقدمة / ذهبية: ما يضاف على الأساسية */
const ADVANCED_EXTRA = new Set([
  "Quotations",
  "CreditNotes",
  "Suppliers",
  "PurchaseOrders",
  "Vouchers",
  "Receivables",
  "FixedAssets",
  "VATReturn",
  "ProfitLoss",
  "CashierSelection",
  "POS",
]);

/** باقة الأعمال */
const SMART_EXTRA = new Set([
  "HR",
  "GeneralLedger",
  "Contracts",
  "SupermarketPOS",
  "Automations",
  "APIDocumentation",
  "APISettings",
  "PaymentAdmin",
  "Welcome",
  "AdminDashboard",
  "AdminUsage",
]);

function advancedGoldenSet() {
  return new Set([...BASIC_PAGES, ...ADVANCED_EXTRA]);
}

function smartSet() {
  return new Set([...advancedGoldenSet(), ...SMART_EXTRA]);
}

const PLAN_PAGE_ACCESS = {
  basic: BASIC_PAGES,
  advanced: advancedGoldenSet(),
  golden: advancedGoldenSet(),
  smart: smartSet(),
};

export function getEffectivePlanId(user) {
  if (!user) return "trial";
  if (isSuperAdminUser(user) || user.role === "admin") return "smart";
  const raw = String(user.subscription_plan || user.subscription_type || "").trim();
  if (user.subscription_status === "trial") return "trial";
  if (user.subscription_status !== "active") return "trial";
  if (!raw || raw === "paid") return "basic";
  if (PLAN_PAGE_ACCESS[raw]) return raw;
  if (raw === "enterprise" || raw === "founder") return "smart";
  return "basic";
}

/**
 * هل الصفحة مسموحة لهذه الباقة؟ (التجربة = كل الصفحات)
 */
export function canAccessPageForPlan(planId, pageName) {
  if (!pageName) return true;
  if (planId === "trial") return true;
  const set = PLAN_PAGE_ACCESS[planId];
  if (!set) return PLAN_PAGE_ACCESS.basic.has(pageName);
  return set.has(pageName);
}

export function canAccessPage(user, pageName) {
  if (!user) return true;
  if (isSuperAdminUser(user) || user.role === "admin") return true;
  return canAccessPageForPlan(getEffectivePlanId(user), pageName);
}

/** استخدام الذكاء الاصطناعي */
export function getAiAccessInfo(user) {
  if (!user) return { allowed: false, reason: "no_user" };
  if (isSuperAdminUser(user) || user.role === "admin") return { allowed: true, remaining: null };

  if (user.subscription_status === "trial") {
    const used = Number(user.settings?.ai_trial_uses ?? 0);
    if (used >= TRIAL_AI_LIMIT) {
      return {
        allowed: false,
        reason: "trial_exhausted",
        messageAr:
          "انتهت الاستفادة التجريبية من الذكاء الاصطناعي (7 استخدامات). يرجى ترقية الباقة للاستمرار في استخدام المساعد الذكي.",
      };
    }
    return { allowed: true, remaining: TRIAL_AI_LIMIT - used, reason: "trial" };
  }

  if (user.subscription_status !== "active") {
    return {
      allowed: false,
      reason: "inactive",
      messageAr: "يلزم اشتراك نشط أو ترقية الباقة لاستخدام الذكاء الاصطناعي.",
    };
  }

  const plan = getEffectivePlanId(user);
  if (plan === "basic") {
    return {
      allowed: false,
      reason: "plan_basic",
      messageAr:
        "ميزة الذكاء الاصطناعي غير متضمّنة في الباقة الأساسية. يرجى ترقية الباقة (متقدّمة أو أعمال أو العرض الذهبي) للاستفادة من المساعد الذكي.",
    };
  }

  return { allowed: true, remaining: null, reason: "paid" };
}
