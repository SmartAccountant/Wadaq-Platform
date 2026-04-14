/**
 * حذف كاش Vite (يُحل أخطاء missing dep-XXXX.js بعد ترقية Vite أو تلف الكاش على ويندوز).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dirs = [".vite-cache", "node_modules/.vite", "dist"];

for (const rel of dirs) {
  const p = path.join(root, rel);
  try {
    fs.rmSync(p, { recursive: true, force: true });
    console.log("Removed:", rel);
  } catch (e) {
    console.warn("Skip:", rel, e.message);
  }
}
