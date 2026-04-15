import { WADAQ_SYSTEM_PROMPT } from "./systemPrompt.js";

function normalizeMessages(messages) {
  const withSystem = messages.some((m) => m.role === "system")
    ? messages
    : [{ role: "system", content: WADAQ_SYSTEM_PROMPT }, ...messages];
  return withSystem.map((m) => ({
    role: m.role,
    content: String(m.content ?? ""),
  }));
}

async function readChatJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err =
      data?.error?.message ||
      data?.error ||
      res.statusText ||
      "طلب غير ناجح";
    throw new Error(typeof err === "string" ? err : JSON.stringify(err));
  }
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("استجابة فارغة من نموذج الذكاء الاصطناعي");
  return String(text).trim();
}

/**
 * Grok (xAI)
 */
export async function callGrok(messages) {
  const key = import.meta.env.VITE_XAI_API_KEY;
  if (!key) throw new Error("MISSING_XAI_KEY");
  const model = import.meta.env.VITE_XAI_MODEL || "grok-2-latest";
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: normalizeMessages(messages),
      temperature: 0.5,
      max_tokens: 2048,
    }),
  });
  return readChatJson(res);
}

/**
 * OpenAI
 */
export async function callOpenAI(messages) {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) throw new Error("MISSING_OPENAI_KEY");
  const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: normalizeMessages(messages),
      temperature: 0.35,
      max_tokens: 3072,
    }),
  });
  return readChatJson(res);
}
