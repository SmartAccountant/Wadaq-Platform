import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../db.js";
import { signAccessToken, verifyAccessToken } from "../auth/jwt.js";
import { mapUserRow } from "../mapUser.js";

const router = Router();
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

function authHeader(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

router.post("/signup", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");
    const name = String(req.body?.name || "").trim();
    const company_name = String(req.body?.company_name || "").trim();
    const company_vat_number = String(req.body?.company_vat_number || "")
      .replace(/\D/g, "")
      .slice(0, 15);

    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: "بيانات غير صالحة" });
    }

    const dup = await pool.query(`SELECT id FROM users WHERE lower(email) = lower($1)`, [email]);
    if (dup.rows.length) {
      return res.status(409).json({ error: "البريد الإلكتروني مسجّل مسبقاً" });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const trialEnd = new Date(Date.now() + 14 * 864e5).toISOString();

    const ins = await pool.query(
      `INSERT INTO users (
        email, password_hash, name, company_name, company_vat_number,
        role, subscription_status, trial_ends_at, trial_end_date,
        account_status, auth_provider
      ) VALUES ($1,$2,$3,$4,$5,'user','trial',$6,$6,'active','email')
      RETURNING *`,
      [
        email,
        password_hash,
        name || email.split("@")[0],
        company_name,
        company_vat_number,
        trialEnd,
      ]
    );

    const row = ins.rows[0];
    await pool.query(
      `INSERT INTO organizations (name, owner_email, vat_number) VALUES ($1,$2,$3)`,
      [company_name || row.name, email, company_vat_number]
    );

    const token = signAccessToken({ sub: row.id, email: row.email });
    res.status(201).json({ token, user: mapUserRow(row) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "خطأ في الخادم" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");
    const r = await pool.query(`SELECT * FROM users WHERE lower(email) = lower($1)`, [email]);
    const row = r.rows[0];
    if (!row) return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    if (row.account_status === "suspended") {
      return res.status(403).json({ error: "تم تعليق هذا الحساب" });
    }
    if (!row.password_hash) {
      return res.status(400).json({ error: "استخدم تسجيل الدخول عبر جوجل لهذا الحساب" });
    }
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });

    const token = signAccessToken({ sub: row.id, email: row.email });
    res.json({ token, user: mapUserRow(row) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "خطأ في الخادم" });
  }
});

router.post("/google", async (req, res) => {
  try {
    const credential = String(req.body?.credential || "");
    if (!credential || !googleClient) {
      return res.status(400).json({ error: "Google غير مهيأ على الخادم" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    const email = String(p.email || "")
      .trim()
      .toLowerCase();
    const sub = p.sub;
    const name = p.name || email.split("@")[0];

    if (!email) return res.status(400).json({ error: "تعذّر قراءة بريد جوجل" });

    let r = await pool.query(`SELECT * FROM users WHERE lower(email) = lower($1)`, [email]);
    let row = r.rows[0];

    if (!row) {
      const trialEnd = new Date(Date.now() + 14 * 864e5).toISOString();
      const ins = await pool.query(
        `INSERT INTO users (
          email, name, role, subscription_status, trial_ends_at, trial_end_date,
          account_status, auth_provider, google_sub, company_name, company_vat_number, settings
        ) VALUES ($1,$2,'user','trial',$3,$3,'active','google',$4,'','', '{}'::jsonb)
        RETURNING *`,
        [email, name, trialEnd, sub]
      );
      row = ins.rows[0];
      await pool.query(
        `INSERT INTO organizations (name, owner_email, vat_number) VALUES ($1,$2,'')`,
        [name, email]
      );
    } else {
      if (row.account_status === "suspended") {
        return res.status(403).json({ error: "تم تعليق هذا الحساب" });
      }
      if (sub && row.google_sub !== sub) {
        const u = await pool.query(
          `UPDATE users SET google_sub = $2, auth_provider = 'google', updated_date = NOW() WHERE id = $1 RETURNING *`,
          [row.id, sub]
        );
        row = u.rows[0];
      }
    }

    const token = signAccessToken({ sub: row.id, email: row.email });
    res.json({ token, user: mapUserRow(row) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "فشل تحقق جوجل" });
  }
});

router.get("/me", async (req, res) => {
  const token = authHeader(req);
  if (!token) return res.status(401).json({ error: "غير مصرّح" });
  const payload = verifyAccessToken(token);
  if (!payload?.sub) return res.status(401).json({ error: "جلسة غير صالحة" });

  const r = await pool.query(`SELECT * FROM users WHERE id = $1`, [payload.sub]);
  const row = r.rows[0];
  if (!row || row.account_status === "suspended") {
    return res.status(401).json({ error: "غير مصرّح" });
  }
  res.json({ user: mapUserRow(row) });
});

/** تحديث جزئي للمستخدم (إعدادات، اشتراك من الواجهة، إلخ) */
router.patch("/me", async (req, res) => {
  try {
    const token = authHeader(req);
    if (!token) return res.status(401).json({ error: "غير مصرّح" });
    const payload = verifyAccessToken(token);
    if (!payload?.sub) return res.status(401).json({ error: "جلسة غير صالحة" });

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const allowed = [
      "name",
      "company_name",
      "company_vat_number",
      "settings",
      "subscription_status",
      "subscription_type",
      "subscription_plan",
      "subscription_end_date",
      "trial_ends_at",
      "trial_end_date",
      "organization_name",
      "app_name",
    ];
    const updates = {};
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }
    if (Object.keys(updates).length === 0) {
      const r0 = await pool.query(`SELECT * FROM users WHERE id = $1`, [payload.sub]);
      return res.json({ user: mapUserRow(r0.rows[0]) });
    }

    updates.updated_date = new Date().toISOString();
    const keys = Object.keys(updates);
    const vals = keys.map((k) => updates[k]);
    const setSql = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
    const r = await pool.query(
      `UPDATE users SET ${setSql} WHERE id = $1 RETURNING *`,
      [payload.sub, ...vals]
    );
    res.json({ user: mapUserRow(r.rows[0]) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "خطأ في التحديث" });
  }
});

export default router;
