import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// إن وُجدت حزمة @Wadaq/vite-plugin يمكن إعادة تفعيلها محلياً.
export default defineConfig({
  // كاش محلي واضح — احذف المجلد .vite-cache أو شغّل npm run dev:fresh عند أخطاء dep-*.js
  cacheDir: path.resolve(__dirname, ".vite-cache"),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  logLevel: "warn",
});
