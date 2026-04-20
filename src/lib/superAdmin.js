/**
 * مسؤول المنصّة الأعلى — يُعرَّف بالبريد فقط (انظر الأمان في وثائق المشروع).
 * عند تغيير البريد، حدّث القيمة هنا وفي `executeAdminCommand` على الخادم إن وُجدت.
 */
export const SUPER_ADMIN_EMAIL = "tharwatalwqae@gmail.com";

export function normalizeAdminEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function isSuperAdminUser(user) {
  if (!user?.email) return false;
  return normalizeAdminEmail(user.email) === normalizeAdminEmail(SUPER_ADMIN_EMAIL);
}
