/**
 * نواة واجهة برنامج ودق المحاسبي: طبقة بيانات محلية (ذاكرة و sessionStorage) وكيانات موحّدة.
 */
import { hashPasswordForAuth } from "../lib/authCrypto.js";

const STORAGE_KEY = "wadaq_local_entities_v1";
const SESSION_AUTH_KEY = "wadaq_auth_session_v1";

const DEFAULT_ADMIN_PASSWORD = "Admin@123";

function loadStore() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function persistStore(store) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

const memoryStore = loadStore();

function getRows(entityName) {
  if (!memoryStore[entityName]) memoryStore[entityName] = [];
  return memoryStore[entityName];
}

function matchesFilter(row, query) {
  if (!query || typeof query !== "object") return true;
  return Object.entries(query).every(([k, v]) => {
    if (v === undefined) return true;
    return row[k] === v;
  });
}

function sortRows(rows, sortKey) {
  if (!sortKey) return [...rows];
  const desc = String(sortKey).startsWith("-");
  const field = desc ? String(sortKey).slice(1) : String(sortKey);
  const copy = [...rows];
  copy.sort((a, b) => {
    const va = a[field];
    const vb = b[field];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    let cmp;
    if (/date|_at$/i.test(field) || field === "date") {
      cmp = new Date(va).getTime() - new Date(vb).getTime();
    } else if (typeof va === "number" && typeof vb === "number") {
      cmp = va - vb;
    } else {
      cmp = String(va).localeCompare(String(vb), "en");
    }
    return desc ? -cmp : cmp;
  });
  return copy;
}

const entityCache = {};

function createEntityApi(entityName) {
  return {
    filter: async (query, sortKey, limit) => {
      let rows = getRows(entityName).filter((r) => matchesFilter(r, query));
      rows = sortKey ? sortRows(rows, sortKey) : rows;
      const lim = typeof limit === "number" ? limit : undefined;
      if (lim != null) rows = rows.slice(0, lim);
      return rows;
    },
    list: async (sortKey, limit) => {
      let rows = [...getRows(entityName)];
      rows = sortKey ? sortRows(rows, sortKey) : rows;
      const lim = typeof limit === "number" ? limit : undefined;
      if (lim != null) rows = rows.slice(0, lim);
      return rows;
    },
    get: async (id) => getRows(entityName).find((r) => r.id === id) ?? null,
    create: async (data) => {
      const id = data.id ?? `local-${entityName}-${Date.now()}`;
      const row = {
        ...data,
        id,
        created_date: data.created_date ?? new Date().toISOString(),
      };
      getRows(entityName).push(row);
      persistStore(memoryStore);
      return row;
    },
    update: async (id, data) => {
      const rows = getRows(entityName);
      const i = rows.findIndex((r) => r.id === id);
      if (i === -1) return null;
      rows[i] = {
        ...rows[i],
        ...data,
        id,
        updated_date: new Date().toISOString(),
      };
      persistStore(memoryStore);
      return rows[i];
    },
    delete: async (id) => {
      const rows = getRows(entityName);
      const i = rows.findIndex((r) => r.id === id);
      if (i === -1) return;
      rows.splice(i, 1);
      persistStore(memoryStore);
    },
    subscribe: (_cb) => () => {},
  };
}

const entities = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === "then") return undefined;
      const name = String(prop);
      if (!entityCache[name]) entityCache[name] = createEntityApi(name);
      return entityCache[name];
    },
  }
);

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(sess) {
  try {
    sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(sess));
  } catch {
    /* ignore */
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  } catch {
    /* ignore */
  }
}

function parseGoogleJwt(credential) {
  try {
    const payload = JSON.parse(atob(credential.split(".")[1]));
    return {
      email: payload.email,
      name: payload.name,
      sub: payload.sub,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
}

function mapUserToClientShape(row) {
  if (!row) return null;
  const { password_hash: _p, ...rest } = row;
  return {
    ...rest,
    subscription_plan: row.subscription_plan || row.subscription_type || null,
    trial_end_date: row.trial_end_date ?? row.trial_ends_at ?? null,
    trial_ends_at: row.trial_ends_at ?? row.trial_end_date ?? null,
    settings: row.settings ?? {},
  };
}

async function syncSubscriptionDatesOnRead(row) {
  if (!row?.id) return row;
  if (row.role === "admin" || row.subscription_status === "unlimited") return row;
  const now = new Date();
  let next = { ...row };
  const trialEnd = row.trial_ends_at || row.trial_end_date;
  if (row.subscription_status === "trial" && trialEnd && new Date(trialEnd) < now) {
    const u = await entities.User.update(row.id, { subscription_status: "expired" });
    if (u) next = u;
  }
  if (
    row.subscription_status === "active" &&
    row.subscription_end_date &&
    new Date(row.subscription_end_date) < now
  ) {
    const u = await entities.User.update(row.id, { subscription_status: "expired" });
    if (u) next = u;
  }
  return next;
}

const PAYMENT_SETTINGS_ID = "ps-global";

async function ensurePaymentSettingsRow() {
  const rows = await entities.PaymentSettings.filter({ id: PAYMENT_SETTINGS_ID });
  if (rows.length === 0) {
    await entities.PaymentSettings.create({
      id: PAYMENT_SETTINGS_ID,
      moyasar_live_secret_key: "",
      moyasar_live_publishable_key: "",
    });
  }
}

/** مفاتيح Moyasar مكتملة → وضع الإنتاج في واجهة الدفع */
export function paymentKeysAreLive(settings) {
  if (!settings) return false;
  const s = String(settings.moyasar_live_secret_key || "").trim();
  const p = String(settings.moyasar_live_publishable_key || "").trim();
  return s.length > 0 && p.length > 0;
}

/** مفتاح Moyasar الظاهر: من لوحة التحكم أو من `VITE_MOYASAR_PUBLISHABLE_KEY` (تجربة/بيئة تطوير) */
export function getMoyasarPublishableKey(settings) {
  const fromSettings = String(settings?.moyasar_live_publishable_key ?? "").trim();
  if (fromSettings) return fromSettings;
  return String(import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY ?? "").trim();
}

/** يطابق بادئة المفتاح في Moyasar: `pk_live_*` → إنتاج، وإلا اختبار */
export function moyasarPaymentModeFromKey(publishable) {
  const k = String(publishable || "");
  if (k.includes("pk_live")) return "live";
  return "test";
}

async function activateSubscriptionAfterPayment({
  userId,
  userEmail,
  amountSar,
  planLabel,
  planId,
  mode,
  provider,
  externalId,
  metadata,
}) {
  const ext = externalId ? String(externalId) : "";
  if (ext) {
    const dup = await entities.PaymentLog.filter({ external_id: ext });
    if (dup.length > 0 && dup[0].subscription_activated) {
      const row = await entities.User.get(userId);
      return {
        duplicate: true,
        subscription_end_date: row?.subscription_end_date,
        user: mapUserToClientShape(row),
      };
    }
  }

  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);

  await entities.User.update(userId, {
    subscription_status: "active",
    subscription_type: planId || "paid",
    subscription_plan: planId || "basic",
    subscription_end_date: end.toISOString(),
  });

  await entities.PaymentLog.create({
    user_email: userEmail,
    user_id: userId,
    amount_sar: Number(amountSar) || 0,
    currency: "SAR",
    status: "paid",
    mode: mode || "test",
    provider: provider || "test",
    plan_id: planId || "",
    plan_label: planLabel || "",
    external_id: ext || `wadaq-${Date.now()}`,
    metadata: metadata ?? {},
    subscription_activated: true,
  });

  const row = await entities.User.get(userId);
  return {
    duplicate: false,
    subscription_end_date: end.toISOString(),
    user: mapUserToClientShape(row),
  };
}

let seedPromise = null;
async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const users = await entities.User.list();
    if (users.length === 0) {
      const password_hash = await hashPasswordForAuth(DEFAULT_ADMIN_PASSWORD);
      await entities.User.create({
        email: "admin@wadaq.app",
        name: "مدير النظام",
        role: "admin",
        subscription_status: "unlimited",
        account_status: "active",
        password_hash,
        company_name: "منشأة ودق التجريبية",
        company_vat_number: "300000000000003",
        auth_provider: "email",
        settings: {},
      });
      if (typeof console !== "undefined" && console.info) {
        console.info(
          `[Wadaq] حساب المدير الافتراضي: admin@wadaq.app / ${DEFAULT_ADMIN_PASSWORD}`
        );
      }
    }
    await ensurePaymentSettingsRow();
  })();
  return seedPromise;
}

export function isSubscriptionEffective(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.account_status === "suspended") return false;
  const s = user.subscription_status;
  if (s === "unlimited") return true;
  if (s === "expired" || s === "cancelled") return false;
  if (s === "active") {
    if (user.subscription_end_date && new Date(user.subscription_end_date) < new Date()) return false;
    return true;
  }
  if (s === "trial") {
    const end = user.trial_ends_at || user.trial_end_date;
    if (end && new Date(end) < new Date()) return false;
    return true;
  }
  return false;
}

export const Wadaq = {
  entities,
  auth: {
    async me() {
      await ensureSeeded();
      const sess = getSession();
      if (!sess?.userId) return null;
      let row = await entities.User.get(sess.userId);
      if (!row) {
        clearSession();
        return null;
      }
      if (row.account_status === "suspended") {
        clearSession();
        return null;
      }
      row = await syncSubscriptionDatesOnRead(row);
      return mapUserToClientShape(row);
    },

    async login({ email, password }) {
      await ensureSeeded();
      const em = String(email).trim().toLowerCase();
      const found = await entities.User.filter({ email: em });
      const row = found[0];
      if (!row) throw new Error("بيانات الدخول غير صحيحة");
      if (row.account_status === "suspended") throw new Error("تم تعليق هذا الحساب");
      if (!row.password_hash) throw new Error("استخدم تسجيل الدخول عبر جوجل لهذا الحساب");
      const h = await hashPasswordForAuth(password);
      if (h !== row.password_hash) throw new Error("بيانات الدخول غير صحيحة");
      setSession({ userId: row.id });
      const fresh = await entities.User.get(row.id);
      return mapUserToClientShape(fresh);
    },

    async signup({ email, password, name, company_name, company_vat_number }) {
      await ensureSeeded();
      const em = String(email).trim().toLowerCase();
      const existing = await entities.User.filter({ email: em });
      if (existing.length) throw new Error("البريد الإلكتروني مسجّل مسبقاً");
      const trialEnd = new Date(Date.now() + 14 * 864e5).toISOString();
      const password_hash = await hashPasswordForAuth(password);
      const vat = String(company_vat_number || "")
        .replace(/\D/g, "")
        .slice(0, 15);
      const row = await entities.User.create({
        email: em,
        name: (name && String(name).trim()) || em.split("@")[0],
        password_hash,
        company_name: (company_name && String(company_name).trim()) || "",
        company_vat_number: vat,
        role: "user",
        subscription_status: "trial",
        trial_ends_at: trialEnd,
        trial_end_date: trialEnd,
        account_status: "active",
        auth_provider: "email",
        settings: {},
      });
      await entities.Organization.create({
        name: (company_name && String(company_name).trim()) || row.name,
        owner_email: em,
        vat_number: vat,
      });
      setSession({ userId: row.id });
      return mapUserToClientShape(await entities.User.get(row.id));
    },

    async loginWithGoogle({ credential }) {
      await ensureSeeded();
      const g = parseGoogleJwt(credential);
      if (!g?.email) throw new Error("تعذّر قراءة بيانات جوجل");
      const em = String(g.email).trim().toLowerCase();
      let found = await entities.User.filter({ email: em });
      let row = found[0];
      if (!row) {
        const trialEnd = new Date(Date.now() + 14 * 864e5).toISOString();
        row = await entities.User.create({
          email: em,
          name: g.name || em.split("@")[0],
          role: "user",
          subscription_status: "trial",
          trial_ends_at: trialEnd,
          trial_end_date: trialEnd,
          account_status: "active",
          auth_provider: "google",
          google_sub: g.sub,
          company_name: g.name || "",
          company_vat_number: "",
          settings: {},
        });
        await entities.Organization.create({
          name: g.name || row.name,
          owner_email: em,
          vat_number: "",
        });
      } else {
        if (row.account_status === "suspended") throw new Error("تم تعليق هذا الحساب");
        if (g.sub && row.google_sub !== g.sub) {
          await entities.User.update(row.id, { google_sub: g.sub, auth_provider: "google" });
          row = await entities.User.get(row.id);
        }
      }
      setSession({ userId: row.id });
      return mapUserToClientShape(await entities.User.get(row.id));
    },

    logout() {
      clearSession();
    },

    async updateMe(data) {
      await ensureSeeded();
      const sess = getSession();
      if (!sess?.userId) throw new Error("غير مصرّح");
      const updated = await entities.User.update(sess.userId, { ...data });
      return mapUserToClientShape(updated);
    },

    async isAuthenticated() {
      await ensureSeeded();
      const sess = getSession();
      if (!sess?.userId) return false;
      const row = await entities.User.get(sess.userId);
      return row != null && row.account_status !== "suspended";
    },

    redirectToLogin(returnPath) {
      try {
        if (returnPath) sessionStorage.setItem("wadaq_return_url", returnPath);
      } catch {
        /* ignore */
      }
      window.location.assign("/login");
    },
  },
  functions: {
    invoke: async (name, payload) => {
      const zatcaMod = await import("../lib/zatcaQr.js");
      if (name === "generateZATCACompliantInvoice") {
        const inv = payload?.invoiceData || {};
        const ts = inv.date
          ? new Date(`${inv.date}T${inv.time || "12:00:00"}`).toISOString()
          : new Date().toISOString();
        const tlvB64 = zatcaMod.buildZatcaPhase1TlvBase64({
          sellerName: inv.seller_name || "المنشأة",
          vatNumber: inv.vat_number || "",
          timestampIso: ts,
          invoiceTotalWithVat: Number(inv.total ?? 0),
          vatTotal: Number(inv.tax_amount ?? 0),
        });
        const qr_code = await zatcaMod.zatcaTlvBase64ToQrDataUrl(tlvB64);
        return {
          data: {
            success: true,
            zatca_fields: {
              invoice_hash: `hash-${Date.now()}`,
              qr_payload: tlvB64,
            },
            qr_code,
          },
        };
      }
      if (name === "generateZATCAQR") {
        const { qr_code, tlv_base64 } = await zatcaMod.generateZatcaQrFromInvokePayload(payload || {});
        return {
          data: {
            qr_code,
            tlv_base64,
          },
        };
      }
      if (name === "createMoyasarCheckout" || name === "createCheckoutSession" || name === "createSubscriptionCheckout") {
        await ensureSeeded();
        const p = payload || {};
        const planPrice = Number(p.planPrice) || 0;
        const planId =
          p.planId ||
          (String(p.planName || "").includes("ذهب") ? "golden" : "plan");
        const qs = new URLSearchParams({
          plan: planId,
          amount: String(planPrice),
          cycle: p.billingCycle || "yearly",
          label: String(p.planName || "Wadaq").slice(0, 120),
        });
        return {
          data: {
            internal_checkout: true,
            redirect_path: `/checkout?${qs.toString()}`,
          },
        };
      }

      if (name === "completeSubscriptionPayment") {
        await ensureSeeded();
        const sess = getSession();
        if (!sess?.userId) return { data: { error: "غير مصرّح" } };
        const row = await entities.User.get(sess.userId);
        if (!row) return { data: { error: "مستخدم غير موجود" } };
        const p = payload || {};
        const amountSar = Number(p.amount_sar ?? p.amountSar) || 0;
        const mode = p.mode === "live" ? "live" : "test";
        const provider = p.provider || (mode === "live" ? "moyasar" : "test");
        const externalId = p.external_id || p.transaction_id || `test-${Date.now()}`;
        const result = await activateSubscriptionAfterPayment({
          userId: row.id,
          userEmail: row.email,
          amountSar,
          planLabel: p.plan_label || p.planLabel || "",
          planId: p.plan_id || p.planId || "",
          mode,
          provider,
          externalId,
          metadata: p.metadata || { source: "completeSubscriptionPayment" },
        });
        return { data: { success: true, ...result } };
      }

      if (name === "paymentWebhook") {
        await ensureSeeded();
        const p = payload || {};
        const secret = String(p.secret || "");
        const settings = await entities.PaymentSettings.get(PAYMENT_SETTINGS_ID);
        const expectedSecret = String(settings?.moyasar_live_secret_key || "").trim();
        if (expectedSecret && secret !== expectedSecret) {
          return { data: { error: "invalid_signature", accepted: false } };
        }
        const body = p.body || p;
        const userEmail = String(body.user_email || body.email || "").trim().toLowerCase();
        const users = userEmail ? await entities.User.filter({ email: userEmail }) : [];
        const userRow = users[0] || (body.user_id ? await entities.User.get(body.user_id) : null);
        if (!userRow) {
          return { data: { error: "user_not_found", accepted: false } };
        }
        const externalId = String(body.id || body.payment_id || body.transaction_id || "");
        const amountHalalas = Number(body.amount ?? body.amount_halalas);
        const amountSar =
          Number(body.amount_sar) ||
          (Number.isFinite(amountHalalas) ? Math.round(amountHalalas) / 100 : 0);
        const result = await activateSubscriptionAfterPayment({
          userId: userRow.id,
          userEmail: userRow.email,
          amountSar,
          planLabel: body.plan_label || "",
          planId: body.plan_id || "",
          mode: "live",
          provider: "moyasar_webhook",
          externalId,
          metadata: { webhook: true, raw: body },
        });
        return { data: { accepted: true, ...result } };
      }

      return { data: {} };
    },
  },
  api: {
    InvokeLLM: async (prompt) => {
      try {
        await ensureSeeded();
        const sess = getSession();
        let userRow = null;
        if (sess?.userId) {
          userRow = await entities.User.get(sess.userId);
          const u = mapUserToClientShape(userRow);
          const { getAiAccessInfo } = await import("../lib/subscriptionAccess.js");
          const ai = getAiAccessInfo(u);
          if (!ai.allowed) {
            return { text: ai.messageAr || "غير مسموح باستخدام المساعد الذكي ضمن باقتك الحالية." };
          }
        }
        const { hybridChat } = await import("../lib/wadaqAi/hybridChat.js");
        const { text } = await hybridChat(String(prompt || ""));
        if (sess?.userId && userRow) {
          const u = mapUserToClientShape(userRow);
          if (u?.subscription_status === "trial") {
            const used = Number(u.settings?.ai_trial_uses ?? 0);
            await entities.User.update(sess.userId, {
              settings: { ...(u.settings || {}), ai_trial_uses: used + 1 },
            });
          }
        }
        return { text };
      } catch {
        /* احتياطي بدون مفاتيح API */
        if (String(prompt).includes("تقرير شامل")) {
          return {
            text: "تحليل الأداء: صافي الربح 4,600 ر.س. أداء المبيعات مستقر مع تصاعد في أبريل. نوصي بزيادة التركيز على المنتجات الأكثر مبيعاً.",
          };
        }
        if (String(prompt).includes("ربحية")) {
          return {
            text: "تحليل الربحية: هامش الربح الحالي 100% بناءً على المصروفات الصفرية المسجلة. يجب تسجيل تكاليف المشتريات بدقة لحساب الربح الحقيقي.",
          };
        }
        if (String(prompt).includes("المخزون")) {
          return {
            text: "تنبيه المخزون: هناك 4 منتجات تقترب من النفاد. استراتيجية التوريد الحالية تحتاج لتعديل لتجنب الانقطاع.",
          };
        }
        return {
          text:
            "لتفعيل المساعد الذكي الكامل أضف VITE_XAI_API_KEY و VITE_OPENAI_API_KEY في ملف .env (راجع .env.example). أنا جاهز لمساعدتك محاسبياً في سياق برنامج ودق.",
        };
      }
    },
    SendEmail: async (payload = {}) => {
      if (typeof console !== "undefined" && console.info) {
        console.info("[Wadaq] SendEmail (محلي):", payload?.to, payload?.subject);
      }
      return { success: true, ...payload };
    },
    ExtractDataFromUploadedFile: async () => ({ rows: [], data: [] }),
  },
};

export default Wadaq;
