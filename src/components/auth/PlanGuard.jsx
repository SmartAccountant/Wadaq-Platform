import React from 'react';

/**
 * PlanGuard - نسخة محررّة لمؤسسة ثروة
 * تم إلغاء التحقق من الاشتراكات لضمان عمل النظام محلياً وبشكل كامل.
 */
export default function PlanGuard({ children }) {
  // الكود ببساطة يعيد عرض المحتوى (Dashboard) دون أي شروط أو قيود
  return <>{children}</>;
}