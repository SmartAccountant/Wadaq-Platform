/**
 * مسؤول المنصّة الأعلى — يُعرَّف بالبريد فقط (انظر الأمان في وثائق المشروع).
 * عند تغيير البريد، حدّث القيمة هنا وفي `executeAdminCommand` على الخادم إن وُجدت.
 *
 * للإنتاج يمكن تجاوز القيمة الافتراضية دون تعديل الشيفرة:
 *   VITE_SUPER_ADMIN_EMAIL=you@domain.com
 * أو عدة عناوين:
 *   VITE_SUPER_ADMIN_EMAILS=a@x.com,b@y.com
 */
export const SUPER_ADMIN_EMAIL = "tharwatalwqae@gmail.com";

function parseSuperAdminEmailsFromEnv() {
  const raw =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPER_ADMIN_EMAILS) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPER_ADMIN_EMAIL) ||
    "";
  return String(raw)
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeAdminEmail);
}

let _cachedList = null;

/** عناوين المسؤول الأعلى (الافتراضي + المتغيرات البيئية). */
export function getSuperAdminEmails() {
  if (_cachedList) return _cachedList;
  const fromEnv = parseSuperAdminEmailsFromEnv();
  const base = normalizeAdminEmail(SUPER_ADMIN_EMAIL);
  const merged = [...fromEnv];
  if (base && !merged.includes(base)) merged.unshift(base);
  _cachedList = merged.length ? merged : base ? [base] : [];
  return _cachedList;
}

/** أول بريد يُعرَض في الواجهة (للتلميح فقط). */
export function getPrimarySuperAdminEmail() {
  const list = getSuperAdminEmails();
  return list[0] || SUPER_ADMIN_EMAIL;
}

export function normalizeAdminEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function isSuperAdminUser(user) {
  if (!user?.email) return false;
  const em = normalizeAdminEmail(user.email);
  return getSuperAdminEmails().includes(em);
}
