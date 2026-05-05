/**
 * neoleapService.js
 * خدمة التكامل مع بوابة دفع Neoleap (الراجحي)
 * الطريقة: Bank Hosted — المستخدم ينتقل لصفحة الراجحي للدفع
 */

const IV = "PGKEYENCDECIVSPC"; // IV ثابت حسب وثيقة الراجحي

// ============================================================
// تشفير AES-CBC
// ============================================================
export async function encryptAES(plainText, resourceKey) {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(resourceKey.substring(0, 32).padEnd(32, "0"));
  const ivBytes = enc.encode(IV);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw", keyBytes, { name: "AES-CBC" }, false, ["encrypt"]
  );

  const data = enc.encode(plainText);
  const blockSize = 16;
  const padLen = blockSize - (data.length % blockSize);
  const padded = new Uint8Array(data.length + padLen);
  padded.set(data);
  padded.fill(padLen, data.length);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv: ivBytes }, cryptoKey, padded
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// ============================================================
// فك تشفير AES-CBC
// ============================================================
export async function decryptAES(encryptedText, resourceKey) {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(resourceKey.substring(0, 32).padEnd(32, "0"));
  const ivBytes = enc.encode(IV);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw", keyBytes, { name: "AES-CBC" }, false, ["decrypt"]
  );

  const encBytes = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0));

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-CBC", iv: ivBytes }, cryptoKey, encBytes
  );

  const text = new TextDecoder().decode(decrypted).replace(/[\x00-\x1F]+$/, "");
  return JSON.parse(text);
}

// ============================================================
// إنشاء طلب دفع وإرجاع رابط صفحة الراجحي
// ============================================================
export async function initiateNeoleapPayment({
  amountSar,
  trackId,
  tranportalId,
  tranportalPass,
  resourceKey,
  responseURL,
  errorURL,
  planLabel = "",
  planId = "",
}) {
  const plainTrandata = JSON.stringify([{
    amt: Number(amountSar).toFixed(2),
    action: "1",
    password: tranportalPass,
    id: tranportalId,
    currencyCode: "682",
    trackId: String(trackId),
    responseURL,
    errorURL,
    langid: "ar",
    udf1: planLabel.slice(0, 50),
    udf2: planId.slice(0, 50),
    udf3: "",
    udf4: "",
    udf5: "",
  }]);

  const encryptedTrandata = await encryptAES(plainTrandata, resourceKey);

  const response = await fetch("/api/neoleap/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: tranportalId,
      trandata: encryptedTrandata,
      responseURL,
      errorURL,
    }),
  });

  if (!response.ok) throw new Error("فشل الاتصال بخادم الدفع");

  const result = await response.json();

  if (!result || !result[0] || result[0].status !== "1") {
    throw new Error(result[0]?.errorText || "فشل إنشاء طلب الدفع");
  }

  const parts = result[0].result.split(":");
  const paymentId = parts[0];
  const paymentPageBase = parts.slice(1).join(":");
  const paymentUrl = `${paymentPageBase}?PaymentID=${paymentId}`;

  return { paymentId, paymentUrl };
}