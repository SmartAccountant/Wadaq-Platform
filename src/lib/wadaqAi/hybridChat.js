import { decideEngine } from "./decideEngine.js";
import { callGrok, callOpenAI } from "./chatProviders.js";

const MISSING_XAI =
  "لم يُعرَّف مفتاح Grok. أضف VITE_XAI_API_KEY إلى ملف .env (انظر .env.example).";
const MISSING_OPENAI =
  "لم يُعرَّف مفتاح OpenAI. أضف VITE_OPENAI_API_KEY إلى ملف .env (انظر .env.example).";

/**
 * @param {string} userMessage
 * @param {{ role: string, content: string }[]} [history]
 * @returns {Promise<{ text: string, engine: 'grok' | 'openai' }>}
 */
export async function hybridChat(userMessage, history = []) {
  const trimmed = String(userMessage || "").trim();
  if (!trimmed) {
    return {
      text: "يُرجى إدخال الاستفسار وسيتم الردّ وفق الإطار المهني لمنصّة ودق المحاسبية.",
      engine: "grok",
    };
  }

  const engine = decideEngine(trimmed);
  const prior = Array.isArray(history) ? history.slice(-12) : [];
  const messages = [...prior, { role: "user", content: trimmed }];

  const tryOpenAI = async () => {
    try {
      const text = await callOpenAI(messages);
      return { text, engine: /** @type {const} */ ("openai") };
    } catch (e) {
      if (e?.message === "MISSING_OPENAI_KEY") throw new Error(MISSING_OPENAI);
      throw e;
    }
  };

  const tryGrok = async () => {
    try {
      const text = await callGrok(messages);
      return { text, engine: /** @type {const} */ ("grok") };
    } catch (e) {
      if (e?.message === "MISSING_XAI_KEY") throw new Error(MISSING_XAI);
      throw e;
    }
  };

  if (engine === "openai") {
    try {
      return await tryOpenAI();
    } catch (firstErr) {
      try {
        return await tryGrok();
      } catch {
        throw firstErr;
      }
    }
  }

  try {
    return await tryGrok();
  } catch (firstErr) {
    try {
      return await tryOpenAI();
    } catch {
      throw firstErr;
    }
  }
}
