import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, FileText, Mail, Phone, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import RefundPolicy from "@/pages/RefundPolicy";
import AboutPage from "@/pages/About";
import { useLanguage } from "@/components/LanguageContext";
import { cn } from "@/lib/utils";

const FOOTER_BG = "#1e3a5f";
const GOLD = "#c9a227";

/**
 * تذييل بألوان الهوية (أزرق داكن + حافة ذهبية)، روابط قانونية تفتح نوافذ منبثقة — عربي / إنجليزي
 */
export default function WadaqFooter() {
  const { t, isRTL, language } = useLanguage();
  const [modal, setModal] = useState(null);

  const modalTitles = useMemo(
    () => ({
      about: t("footer_modal_about"),
      terms: t("footer_modal_terms"),
      privacy: t("footer_modal_privacy"),
      refund: t("footer_modal_refund"),
      contact: t("footer_modal_contact"),
    }),
    [t, language]
  );

  const quickLinks = useMemo(
    () => [
      { id: "about", label: t("footer_modal_about") },
      { id: "terms", label: t("footer_modal_terms") },
      { id: "privacy", label: t("footer_modal_privacy") },
      { id: "refund", label: t("footer_modal_refund") },
      { id: "contact", label: t("footer_modal_contact") },
    ],
    [t, language]
  );

  const linkBtnClass =
    "block w-full text-start text-slate-200/95 hover:text-white hover:underline py-1 text-sm transition-colors";

  return (
    <>
      <footer
        className="border-t-[3px] pt-12 pb-6 px-4 sm:px-6 text-slate-200"
        style={{ backgroundColor: FOOTER_BG, borderTopColor: GOLD }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-white">{t("footer_company")}</h3>
              <ul className="space-y-3 text-sm text-slate-300/95 leading-relaxed">
                <li className="flex gap-3 items-start">
                  <MapPin className="w-5 h-5 shrink-0 mt-0.5 opacity-90" style={{ color: GOLD }} />
                  <span>{t("footer_address")}</span>
                </li>
                <li className="flex gap-3 items-start">
                  <FileText className="w-5 h-5 shrink-0 mt-0.5 opacity-90" style={{ color: GOLD }} />
                  <span>
                    {t("footer_cr_label")}{" "}
                    <span dir="ltr" className="font-mono">
                      1009073537
                    </span>
                  </span>
                </li>
                <li className="flex gap-3 items-center">
                  <Mail className="w-5 h-5 shrink-0 opacity-90" style={{ color: GOLD }} />
                  <a href="mailto:support@rikazai.com" className="hover:underline break-all">
                    support@rikazai.com
                  </a>
                </li>
                <li className="flex gap-3 items-center">
                  <Phone className="w-5 h-5 shrink-0 opacity-90" style={{ color: GOLD }} />
                  <a href="tel:+966500070065" className="font-mono hover:underline" dir="ltr">
                    +966 50 007 0065
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white">{t("footer_quick_links_title")}</h4>
              <ul className="space-y-1">
                {quickLinks.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={linkBtnClass} onClick={() => setModal(item.id)}>
                      {item.label}
                    </button>
                  </li>
                ))}
                <li className="pt-2 border-t border-white/10 mt-2">
                  <Link
                    to="/checkout"
                    className={cn(
                      "block w-full text-start text-amber-200/90 hover:text-amber-100 text-sm font-semibold py-1"
                    )}
                  >
                    {t("footer_checkout_link")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white">{t("footer_payment_title")}</h4>
              <div className="flex flex-wrap gap-3 items-stretch justify-start">
                <div
                  className="inline-flex items-center justify-center rounded-lg px-3 min-h-[40px] text-xs font-black text-white shadow"
                  style={{ background: "#0d6e3a", minWidth: "68px" }}
                  title="mada"
                >
                  mada
                </div>
                <div
                  className="inline-flex items-center justify-center rounded-lg px-3 min-h-[40px] text-xs font-black bg-white text-[#1a1f71] border border-white/90 shadow-sm"
                  style={{ minWidth: "68px" }}
                  title="Visa"
                >
                  VISA
                </div>
                <div
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 min-h-[40px] bg-white border border-slate-200 shadow-sm"
                  title="Mastercard"
                >
                  <span className="flex items-center">
                    <span className="w-5 h-5 rounded-full bg-[#eb001b]" />
                    <span className="w-5 h-5 rounded-full bg-[#f79e1b] -ml-2.5 mix-blend-multiply" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-800 pe-0.5">Mastercard</span>
                </div>
                <div
                  className="inline-flex items-center justify-center rounded-lg px-3 min-h-[40px] bg-black text-white text-xs font-semibold shadow"
                  title="Apple Pay"
                >
                  <span className="flex items-center gap-0.5">
                    <span className="text-base leading-none"></span> Pay
                  </span>
                </div>
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs text-slate-400/95 leading-relaxed">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
                <span>{t("footer_secure_note")}</span>
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/15 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} {t("footer_company")} — {t("footer_copyright")} ·{" "}
            <a
              href="https://rikazai.com"
              className="hover:text-slate-200 underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              rikazai.com
            </a>
          </div>
        </div>
      </footer>

      <Dialog open={modal != null} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent
          className={cn(
            "max-w-4xl w-[min(100vw-1rem,56rem)] max-h-[min(90vh,880px)] overflow-hidden flex flex-col p-0 gap-0 border-slate-700 bg-slate-950 sm:rounded-xl [&>button]:left-4 [&>button]:right-auto",
            !isRTL && "[&>button]:right-4 [&>button]:left-auto"
          )}
        >
          <DialogTitle className="sr-only">{modal ? modalTitles[modal] : ""}</DialogTitle>
          <div className="overflow-y-auto flex-1 min-h-0">
            {modal === "terms" && <Terms embedded />}
            {modal === "privacy" && <Privacy embedded />}
            {modal === "refund" && <RefundPolicy embedded />}
            {modal === "about" && <AboutPage embedded />}
            {modal === "contact" && (
              <div
                className="p-6 sm:p-8 text-slate-200 space-y-6 bg-slate-900"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <h2 className="text-xl font-bold text-white">{t("footer_modal_contact")}</h2>
                <p className="text-slate-300 text-sm leading-relaxed">{t("contact_intro")}</p>
                <ul className="space-y-4 text-sm">
                  <li className="flex gap-3 items-start">
                    <MapPin className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
                    <span>{t("footer_address")}</span>
                  </li>
                  <li className="flex gap-3 items-center">
                    <Mail className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
                    <a href="mailto:support@rikazai.com" className="text-amber-200 hover:underline">
                      support@rikazai.com
                    </a>
                  </li>
                  <li className="flex gap-3 items-center">
                    <Phone className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
                    <a href="tel:+966500070065" className="font-mono" dir="ltr">
                      +966 50 007 0065
                    </a>
                  </li>
                </ul>
                <a
                  href="https://wa.me/966500070065"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                >
                  {t("whatsapp")}
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
