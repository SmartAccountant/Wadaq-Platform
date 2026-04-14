/**
 * pages.config.js - تم تعديله ليناسب تشغيل مؤسسة ثروة الواقع محلياً
 */
import APIDocumentation from './pages/APIDocumentation';
import APISettings from './pages/APISettings';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsage from './pages/AdminUsage';
import Automations from './pages/Automations';
import CashierSelection from './pages/CashierSelection';
import CreditNotes from './pages/CreditNotes';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Landing from './pages/Landing';
import POS from './pages/POS';
import PaymentAdmin from './pages/PaymentAdmin';
import Products from './pages/Products';
import Quotations from './pages/Quotations';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SupermarketPOS from './pages/SupermarketPOS';
import Vouchers from './pages/Vouchers';
import Welcome from './pages/Welcome';
import VATReturn from './pages/VATReturn';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import HR from './pages/HR';
import FixedAssets from './pages/FixedAssets';
import GeneralLedger from './pages/GeneralLedger';
import Contracts from './pages/Contracts';
import ProfitLoss from './pages/ProfitLoss';
import Receivables from './pages/Receivables';
import Pricing from './pages/Pricing';
import __Layout from './Layout.jsx';


export const PAGES = {
    "APIDocumentation": APIDocumentation,
    "APISettings": APISettings,
    "About": About,
    "AdminDashboard": AdminDashboard,
    "AdminUsage": AdminUsage,
    "Automations": Automations,
    "CashierSelection": CashierSelection,
    "CreditNotes": CreditNotes,
    "Customers": Customers,
    "Dashboard": Dashboard,
    "Expenses": Expenses,
    "Inventory": Inventory,
    "Invoices": Invoices,
    "Landing": Landing,
    "POS": POS,
    "PaymentAdmin": PaymentAdmin,
    "Products": Products,
    "Pricing": Pricing,
    "Quotations": Quotations,
    "Reports": Reports,
    "Settings": Settings,
    "Subscription": Subscription,
    "SubscriptionSuccess": SubscriptionSuccess,
    "SupermarketPOS": SupermarketPOS,
    "Vouchers": Vouchers,
    "Welcome": Welcome,
    "VATReturn": VATReturn,
    "Suppliers": Suppliers,
    "PurchaseOrders": PurchaseOrders,
    "HR": HR,
    "FixedAssets": FixedAssets,
    "GeneralLedger": GeneralLedger,
    "Contracts": Contracts,
    "ProfitLoss": ProfitLoss,
    "Receivables": Receivables,
}

export const pagesConfig = {
    mainPage: "Dashboard", // تم التغيير من Landing إلى Dashboard لفتح النظام فوراً
    Pages: PAGES,
    Layout: __Layout,
};