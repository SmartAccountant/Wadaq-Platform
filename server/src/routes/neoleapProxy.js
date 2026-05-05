import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const DEFAULT_ID = "ps-global";
const NEOLEAP_URL = "https://securepayments.neoleap.com.sa/pg/payment/hosted.htm";

// POST /api/neoleap/initiate
// يستقبل الطلب من الواجهة ويمرره لـ Neoleap (لتجنب مشكلة CORS)
router.post("/initiate", requireAuth, async (req, res) => {
  try {
    const { id, trandata, responseURL, errorURL } = req.body;

    if (!id || !trandata || !responseURL || !errorURL) {
      return res.status(400).json({ error: "بيانات ناقصة" });
    }

    // التحقق من أن Neoleap مفعّل
    const r = await pool.query(
      `SELECT payload FROM payment_settings WHERE id = $1`,
      [DEFAULT_ID]
    );
    const p = r.rows[0]?.payload || {};

    if (!p.neoleap_tranportal_id) {
      return res.status(400).json({ error: "بوابة Neoleap غير مفعّلة" });
    }

    // إرسال الطلب لـ Neoleap
    const neoleapResponse = await fetch(NEOLEAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-FORWARDED-FOR": req.headers["x-forwarded-for"] || req.ip || "0.0.0.0",
      },
      body: JSON.stringify([{ id, trandata, responseURL, errorURL }]),
    });

    if (!neoleapResponse.ok) {
      const errText = await neoleapResponse.text();
      console.error("Neoleap error:", errText);
      return res.status(502).json({ error: "خطأ من بوابة الدفع" });
    }

    const result = await neoleapResponse.json();
    res.json(result);

  } catch (e) {
    console.error("Neoleap proxy error:", e);
    res.status(500).json({ error: e.message || "خطأ في الخادم" });
  }
});

export default router;