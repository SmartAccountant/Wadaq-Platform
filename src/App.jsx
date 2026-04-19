/** نقطة مسارات تطبيق ودق الرئيسية. */
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { pagesConfig } from "./pages.config";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import VATCalculator from "@/pages/VATCalculator";
import { AuthProvider } from "@/context/AuthContext";
import AuthSubscriptionLayout from "@/components/auth/AuthSubscriptionLayout";
import GuestOnly from "@/components/auth/GuestOnly";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AdminPanel from "@/pages/AdminPanel";
import AdminSettings from "@/pages/AdminSettings";
import AdminPaymentSettings from "@/pages/AdminPaymentSettings";
import AdminPaymentLogs from "@/pages/AdminPaymentLogs";
import PaymentInvoice from "@/pages/PaymentInvoice";
import { GoogleOAuthProvider } from "@react-oauth/google";
import About from "@/pages/About";
import HomeEntry from "@/components/HomeEntry";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import RefundPolicy from "@/pages/RefundPolicy";
import Checkout from "@/pages/Checkout";
import Footer from "@/components/Footer";
import WadaqAIChatFAB from "@/components/wadaq-ai/WadaqAIChatFAB";
import { LanguageProvider } from "@/components/LanguageContext";

const { Pages } = pagesConfig;

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function GoogleRoot({ children }) {
  if (!googleClientId) return children;
  return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>;
}

/**
 * مسارات التطبيق — مسارات صريحة بأحرف صغيرة + إعادة توجيه للتوافق
 */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />

      {/* صفحات عامة (لا تتطلب تسجيل دخول) */}
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/refund" element={<RefundPolicy />} />
      <Route path="/about" element={<About />} />

      <Route path="/Terms" element={<Navigate to="/terms" replace />} />
      <Route path="/Privacy" element={<Navigate to="/privacy" replace />} />
      <Route path="/RefundPolicy" element={<Navigate to="/refund" replace />} />
      <Route path="/About" element={<Navigate to="/about" replace />} />

      <Route path="/VATCalculator" element={<VATCalculator />} />
      <Route path="/" element={<HomeEntry />} />
      <Route path="/Landing" element={<Navigate to="/" replace />} />

      <Route path="/pricing" element={<Navigate to="/Pricing" replace />} />

      {/* أسماء شائعة لصفحة الإدارة — المسار الفعلي /admin/settings */}
      <Route path="/Administration" element={<Navigate to="/admin/settings" replace />} />
      <Route path="/administration" element={<Navigate to="/admin/settings" replace />} />
      <Route path="/Admin" element={<Navigate to="/admin" replace />} />

      <Route element={<AuthSubscriptionLayout />}>
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<Page />} />
        ))}
        {/* بوابة الدفع — مسار واحد بأحرف صغيرة؛ التوافق مع الروابط القديمة /Checkout */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/Checkout" element={<Navigate to="/checkout" replace />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/payment-settings" element={<AdminPaymentSettings />} />
        <Route path="/admin/payment-logs" element={<AdminPaymentLogs />} />
        <Route path="/PaymentInvoice" element={<PaymentInvoice />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <LanguageProvider>
        <AuthProvider>
          <GoogleRoot>
            <Router>
              <div className="flex min-h-screen flex-col">
                <div className="min-h-0 w-full min-w-0 flex-1">
                  <AppRoutes />
                </div>
                <WadaqAIChatFAB />
                <Footer />
              </div>
            </Router>
          </GoogleRoot>
        </AuthProvider>
      </LanguageProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
