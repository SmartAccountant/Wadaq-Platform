import React from "react";

export default function AdminConsole() {
  return (
    <div style={{ padding: "50px", textAlign: "center", direction: "rtl", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#1a3a5c" }}>✅ تم كسر حاجز الصفحة البيضاء</h1>
      <p>إذا رأيت هذه الرسالة، فهذا يعني أن مشكلة التوجيه والحماية قد حُلت.</p>
      <div style={{ marginTop: "20px", padding: "15px", background: "#f0f4f8", borderRadius: "10px" }}>
        <p>الخطوة القادمة: إعادة ربط لوحة التحكم بالبيانات الحقيقية.</p>
      </div>
    </div>
  );
}