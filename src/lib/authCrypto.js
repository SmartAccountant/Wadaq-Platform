/** تجزئة كلمة المرور للتخزين المحلي (SHA-256) — للإنتاج استخدم خادماً آمناً. */
export async function hashPasswordForAuth(password) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(String(password) + "|wadaq_v1"));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
