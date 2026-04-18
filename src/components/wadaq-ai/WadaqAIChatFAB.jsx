import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hybridChat } from "@/lib/wadaqAi/hybridChat";
import { Wadaq } from "@/api/WadaqCore";
import { useLanguage } from "@/components/LanguageContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getAiAccessInfo } from "@/lib/subscriptionAccess";
import { incrementTrialAiUseIfNeeded } from "@/lib/aiUsageControl";
import { useToast } from "@/components/ui/use-toast";

const NAVY = "#1a3a5c";
const GOLD = "#c9a227";

export default function WadaqAIChatFAB() {
  const { isRTL } = useLanguage();
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const ai = getAiAccessInfo(user);
    if (!ai.allowed) {
      toast({
        variant: "destructive",
        title: "ترقية الباقة",
        description: ai.messageAr || "يرجى ترقية الباقة لاستخدام المساعد الذكي.",
      });
      return;
    }

    setInput("");
    setError(null);
    setLoading(true);

    const history = messages.map((x) => ({
      role: x.role,
      content: x.content,
    }));

    setMessages((m) => [...m, { role: "user", content: text }]);

    try {
      const { text: reply, engine } = await hybridChat(text, history);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: reply, engine },
      ]);
      await incrementTrialAiUseIfNeeded(Wadaq, user);
      await refresh();
    } catch (e) {
      const msg = e?.message || "تعذّر الاتصال بالمساعد. تحقق من المفاتيح في ملف .env";
      setError(msg);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: msg,
          engine: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, user, refresh, toast]);

  if (!user) return null;

  /**
   * موضع ثابت بزاوية منطقة المحتوى (ليس الشريط):
   * - لا نضع dir=rtl على الحاوية الموضوعية لأنها تدفع flex items-start نحو اليمين فوق الشريط.
   * - العربية: الشريط يمين → نثبت أسفل يسار الشاشة (left / inset-inline-start في LTR layer).
   * - pointer-events-none على الغلاف حتى لا يحجب النقر خارج النافذة.
   */
  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[35] flex w-max max-w-[min(20rem,calc(100vw-1.25rem))] flex-col gap-2",
        isRTL
          ? "bottom-20 left-3 sm:bottom-6 sm:left-5 lg:left-6"
          : "bottom-20 right-3 sm:bottom-6 sm:right-5 lg:right-6"
      )}
    >
      <div className="pointer-events-auto flex w-full max-w-[20rem] flex-col gap-2">
        {open && (
          <div
            className="w-full overflow-hidden rounded-2xl border bg-white shadow-xl"
            dir="rtl"
            style={{ borderColor: "rgba(26,58,92,0.2)", maxHeight: "min(58vh, 420px)" }}
          >
            <div
              className="flex items-center justify-between gap-2 border-b px-4 py-3 text-white"
              style={{ background: NAVY, borderColor: "rgba(201,162,39,0.35)" }}
            >
              <div>
                <p className="font-bold text-sm">مساعد ودق الذكي</p>
                <p className="text-[10px] opacity-90">دعم مهني — واجهة عربية كاملة</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="إغلاق الدردشة"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div
              ref={listRef}
              className="space-y-3 overflow-y-auto px-4 py-3 text-right text-sm"
              style={{ maxHeight: "min(48vh, 360px)" }}
            >
              {messages.length === 0 && (
                <div
                  className="rounded-xl border bg-slate-50 px-3 py-3 text-slate-700"
                  style={{ borderColor: "rgba(26,58,92,0.12)" }}
                >
                  <p className="leading-relaxed text-slate-800">
                    مساعد ودق الذكي — خبير محاسبي في إطار منصّة ودق المحاسبية. يمكنكم الاستفسار عن الفوترة الإلكترونية، الضريبة والتقارير، والميزات التشغيلية، وفق الأنظمة والممارسات المعمول بها في المملكة.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2 ${
                    msg.role === "user"
                      ? "mr-0 ml-8 bg-slate-100 text-slate-900"
                      : "mr-8 ml-0 border bg-slate-50 text-slate-800"
                  }`}
                  style={
                    msg.role === "assistant"
                      ? { borderColor: "rgba(26,58,92,0.12)" }
                      : undefined
                  }
                >
                  {msg.role === "assistant" && msg.engine && (
                    <span
                      className="mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: "rgba(201,162,39,0.2)", color: NAVY }}
                    >
                      {msg.engine === "openai" ? "OpenAI" : "Grok"}
                    </span>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">جاري التفكير…</span>
                </div>
              )}
              {error && !loading && (
                <p className="text-xs text-red-600">{error}</p>
              )}
            </div>

            <div className="border-t p-3" style={{ borderColor: "rgba(26,58,92,0.1)" }}>
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="اكتب سؤالك هنا…"
                  rows={2}
                  className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-[#1a3a5c]/30"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="h-auto shrink-0 px-3"
                  style={{ background: NAVY, color: "#fff" }}
                  aria-label="إرسال"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                تُوجَّه الاستفسارات المحاسبية المعمّقة إلى نموذج متخصص عند توفر الربط؛ وتُعالَج الاستفسارات العامة عبر مسار مُختصر لتحسين الكفاءة التشغيلية.
              </p>
            </div>
          </div>
        )}

        <Button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="h-11 w-11 shrink-0 rounded-full p-0 shadow-md"
          style={{
            background: NAVY,
            border: `2px solid ${GOLD}`,
            boxShadow: "0 4px 14px rgba(26,58,92,0.28)",
          }}
          aria-label={open ? "إغلاق مساعد ودق" : "فتح مساعد ودق الذكي"}
        >
          {open ? (
            <X className="h-5 w-5 text-white" />
          ) : (
            <MessageCircle className="h-5 w-5 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
}
