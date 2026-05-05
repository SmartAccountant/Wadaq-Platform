import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveAuthUser, userIsPlatformPaymentAdmin } from "../lib/platformAdmin.js";

const router = Router();
const DEFAULT_ID = "ps-global";

// GET /api/payment-settings
// للجميع: يُرجع tranportal_id والوضع فقط (بدون بيانات حساسة)
// للمسؤول: يُرجع كل البيانات كاملة
router.get("/", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, payload, updated_at FROM payment_settings WHERE id = $1`,
      [DEFAULT_ID]
    );
    const row = r.rows[0];
    const p = row?.payload || {};

    const base = {
      id: DEFAULT_ID,
      neoleap_tranportal_id: String(p.neoleap_tranportal_id || ""),
      neoleap_mode: String(p.neoleap_mode || "test"),
      neoleap_tranportal_password: "",
      neoleap_resource_key: "",
    };

    const u = await resolveAuthUser(req);
    if (u && (await userIsPlatformPaymentAdmin(u.id, u.email))) {
      return res.json({
        data: {
          id: row?.id || DEFAULT_ID,
          neoleap_tranportal_id: String(p.neoleap_tranportal_id || ""),
          neoleap_tranportal_password: String(p.neoleap_tranportal_password || ""),
          neoleap_resource_key: String(p.neoleap_resource_key || ""),
          neoleap_mode: String(p.neoleap_mode || "test"),
        },
      });
    }

    res.json({ data: base });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "خطأ في الخادم" });
  }
});

// PUT /api/payment-settings
// للمسؤول فقط: حفظ إعدادات Neoleap
router.put("/", requireAuth, async (req, res) => {
  try {
    const u = await resolveAuthUser(req);
    if (!u || !(await userIsPlatformPaymentAdmin(u.id, u.email))) {
      return res.status(403).json({ error: "يتطلب صلاحية مسؤول" });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};

    const prevR = await pool.query(
      `SELECT payload FROM payment_settings WHERE id = $1`,
      [DEFAULT_ID]
    );
    const prev = prevR.rows[0]?.payload || {};

    const next = {
      ...prev,
      neoleap_tranportal_id:
        body.neoleap_tranportal_id !== undefined
          ? String(body.neoleap_tranportal_id)
          : prev.neoleap_tranportal_id,
      neoleap_tranportal_password:
        body.neoleap_tranportal_password !== undefined
          ? String(body.neoleap_tranportal_password)
          : prev.neoleap_tranportal_password,
      neoleap_resource_key:
        body.neoleap_resource_key !== undefined
          ? String(body.neoleap_resource_key)
          : prev.neoleap_resource_key,
      neoleap_mode:
        body.neoleap_mode !== undefined
          ? String(body.neoleap_mode)
          : (prev.neoleap_mode || "test"),
    };

    await pool.query(
      `INSERT INTO payment_settings (id, payload, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [DEFAULT_ID, JSON.stringify(next)]
    );

    const r = await pool.query(
      `SELECT id, payload FROM payment_settings WHERE id = $1`,
      [DEFAULT_ID]
    );
    const p = r.rows[0].payload || {};

    res.json({
      data: {
        id: r.rows[0].id,
        neoleap_tranportal_id: p.neoleap_tranportal_id,
        neoleap_mode: p.neoleap_mode,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "خطأ في الخادم" });
  }
});

export default router;