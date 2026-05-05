import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import dataEntities from "./routes/dataEntities.js";
import adminRoutes from "./routes/admin.js";
import paymentSettingsRoutes from "./routes/paymentSettings.js";
import billingRoutes from "./routes/billing.js";
import neoleapProxyRoutes from "./routes/neoleapProxy.js";

// Load env from `server/.env` when starting from repo root.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const app = express();
app.set("trust proxy", 1);
const port = Number(process.env.PORT || 8787);

const origins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : true;

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: origins,
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "wadaq-api",
    /** إن لم يظهر هذا الحقل على السيرفر الذي يفتحه المتصفح، فالنسخة قديمة ولم تُنشر بعد */
    forgot_password_unknown_email_http_status: 404,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/data", dataEntities);
app.use("/api/admin", adminRoutes);
app.use("/api/payment-settings", paymentSettingsRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/neoleap", neoleapProxyRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`[wadaq-api] listening on :${port}`);
});
