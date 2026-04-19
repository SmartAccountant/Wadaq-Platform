import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";

const app = express();
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
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "wadaq-api" });
});

app.use("/api/auth", authRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`[wadaq-api] listening on :${port}`);
});
