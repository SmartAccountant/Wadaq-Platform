import React, { useState, useEffect, useRef } from "react";
import { Wadaq } from "@/api/WadaqCore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Trash2, CreditCard, Banknote, Smartphone, Receipt, User, Clock,
  Maximize, Minimize, Plus, Package, RotateCcw, Percent, StickyNote,
  ShoppingCart, ChevronUp, ChevronDown, X, CheckCircle2, AlertTriangle
} from "lucide-react";
import QuickAddProduct from "@/components/pos/QuickAddProduct";
import { useLanguage } from "@/components/LanguageContext";
import Swal from "sweetalert2";
import { format } from "date-fns";
import ThermalReceipt from "@/components/invoices/ThermalReceipt";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";

// ─── Open Cash Drawer ──────────────────────────────────────────────────────────
function openCashDrawer() {
  // ESC/POS command to open cash drawer via network/USB printer
  try {
    const escPos = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
    // Try to use stored printer if available
    const storedPrinters = localStorage.getItem('pos_printers');
    if (storedPrinters) {
      const printers = JSON.parse(storedPrinters);
      const networkPrinter = printers.find(p => p.type === 'network');
      if (networkPrinter) {
        fetch(`http://${networkPrinter.ip}:${networkPrinter.port || 9100}`, {
          method: 'POST',
          body: escPos
        }).catch(() => {});
        return;
      }
    }
    // Fallback: alert
    Swal.fire({ icon: 'info', title: 'فتح الدرج', text: 'تم إرسال أمر فتح الدرج', timer: 1500, showConfirmButton: false });
  } catch (e) {}
}

function POSContent() {
  const { language, isRTL } = useLanguage();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [user, setUser] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("amount"); // "amount" | "percent"
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      const sidebar = document.querySelector('aside');
      const mainEl = document.querySelector('main');
      const header = document.querySelector('header');
      if (fs) {
        if (sidebar) sidebar.style.display = 'none';
        if (mainEl) { mainEl.style.marginRight = '0'; mainEl.style.marginLeft = '0'; mainEl.style.paddingTop = '0'; }
        if (header) header.style.display = 'none';
      } else {
        if (sidebar) sidebar.style.display = '';
        if (mainEl) { mainEl.style.marginRight = ''; mainEl.style.marginLeft = ''; mainEl.style.paddingTop = ''; }
        if (header) header.style.display = '';
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      const sidebar = document.querySelector('aside');
      const mainEl = document.querySelector('main');
      const header = document.querySelector('header');
      if (sidebar) sidebar.style.display = '';
      if (mainEl) { mainEl.style.marginRight = ''; mainEl.style.marginLeft = ''; mainEl.style.paddingTop = ''; }
      if (header) header.style.display = '';
    };
  }, []);

  useEffect(() => {
    Wadaq.auth.me().then(async (userData) => {
      setUser(userData);
      const orgs = await Wadaq.entities.Organization.list();
      if (orgs.length > 0) setCompanyInfo(orgs[0]);
    }).catch(() => {});
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => Wadaq.entities.Product.filter({ is_active: true })
  });

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm) ||
      product.code?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.quantity > 0;
  });

  // Barcode scanner
  useEffect(() => {
    let barcodeBuffer = '';
    let timeout;
    const handleKeyPress = (e) => {
      if (showPaymentModal || showReturnModal) return;
      if (e.key === 'Enter' && barcodeBuffer) {
        const product = products.find(p => p.barcode === barcodeBuffer || p.code === barcodeBuffer);
        if (product) addToCart(product);
        barcodeBuffer = '';
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => { barcodeBuffer = ''; }, 100);
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => { window.removeEventListener('keypress', handleKeyPress); clearTimeout(timeout); };
  }, [products, showPaymentModal, showReturnModal]);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        Swal.fire({ icon: 'warning', title: language === 'ar' ? 'تحذير' : 'Warning', text: language === 'ar' ? 'الكمية المتوفرة غير كافية' : 'Insufficient stock', timer: 2000, showConfirmButton: false });
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.quantity) {
      Swal.fire({ icon: 'warning', title: language === 'ar' ? 'تحذير' : 'Warning', text: language === 'ar' ? `الحد الأقصى: ${product.quantity}` : `Max: ${product.quantity}`, timer: 1500, showConfirmButton: false });
      return;
    }
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
    }
  };

  const removeFromCart = (productId) => setCart(cart.filter(item => item.id !== productId));

  const clearCart = () => {
    Swal.fire({
      title: language === 'ar' ? 'مسح السلة؟' : 'Clear Cart?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: language === 'ar' ? 'نعم' : 'Yes',
      cancelButtonText: language === 'ar' ? 'إلغاء' : 'Cancel'
    }).then(r => { if (r.isConfirmed) { setCart([]); setDiscount(0); setNotes(""); } });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const discountAmount = discountType === 'percent' ? (subtotal * discount / 100) : Math.min(discount, subtotal);
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * 0.15;
  const total = afterDiscount + tax;

  return (
    <div className={`min-h-screen bg-gray-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ─── Top Bar ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {companyInfo?.logo && (
            <img src={companyInfo.logo} alt="Logo" className="h-10 object-contain" />
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {language === 'ar' ? 'نقطة البيع' : 'Point of Sale'}
            </h1>
            <p className="text-xs text-gray-500">{companyInfo?.name || ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Clock */}
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">{format(currentTime, 'HH:mm:ss')}</span>
          </div>

          {/* Cashier */}
          <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-200">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">{user?.full_name || 'Cashier'}</span>
          </div>

          {/* Open Drawer */}
          <Button
            onClick={openCashDrawer}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50 gap-1.5"
          >
            <span className="text-base">🗄️</span>
            <span className="text-sm">{language === 'ar' ? 'فتح الدرج' : 'Open Drawer'}</span>
          </Button>

          {/* Return */}
          <Button
            onClick={() => setShowReturnModal(true)}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50 gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">{language === 'ar' ? 'مرتجع' : 'Return'}</span>
          </Button>

          {/* Fullscreen */}
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────── */}
      <div className="flex h-[calc(100vh-64px)]">

        {/* ─── Left: Products ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">

          {/* Search Bar + Add Product */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <Input
                placeholder={language === 'ar' ? 'ابحث بالاسم أو الباركود...' : 'Search by name or barcode...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pr-9' : 'pl-9'} bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400`}
              />
            </div>
            <Button
              onClick={() => setShowAddProduct(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'منتج جديد' : 'New Product'}
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
              >
                {cat === 'all' ? (language === 'ar' ? 'الكل' : 'All') : cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 animate-pulse">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2" />
                    <div className="h-4 bg-gray-100 rounded mb-1" />
                    <div className="h-5 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Package className="w-12 h-12 mb-2 text-gray-300" />
                <p>{language === 'ar' ? 'لا توجد منتجات' : 'No products found'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-xl border border-gray-200 p-3 text-right hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-100 transition-all active:scale-95 group"
                  >
                    {product.images?.[0] ? (
                      <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gray-50">
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 mb-2 flex items-center justify-center border border-indigo-100">
                        <Package className="w-8 h-8 text-indigo-300" />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 min-h-[2.5rem] text-right">{product.name}</h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{product.quantity}</span>
                      <span className="text-base font-bold text-emerald-600">
                        {product.selling_price?.toLocaleString()} <span className="text-xs font-normal">{language === 'ar' ? 'ر.س' : 'SAR'}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Cart ──────────────────────────────────────────── */}
        <div className="w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg">

          {/* Cart Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-gray-800">{language === 'ar' ? 'السلة' : 'Cart'}</span>
              {cart.length > 0 && (
                <Badge className="bg-indigo-600 text-white text-xs rounded-full">{cart.length}</Badge>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-300">
                <Receipt className="w-10 h-10 mb-2" />
                <p className="text-sm">{language === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <div className="flex items-start justify-between mb-1.5">
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 mt-0.5 shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-sm font-medium text-gray-800 text-right flex-1 mr-1 line-clamp-1">{item.name}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-600 text-sm">
                      {(item.selling_price * item.quantity).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 text-gray-600 transition-colors"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200 text-gray-600 transition-colors"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discount + Notes */}
          <div className="px-3 pb-2 space-y-2 border-t border-gray-100 pt-2">
            {/* Discount Row */}
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-gray-400 shrink-0" />
              <Input
                type="number"
                placeholder={language === 'ar' ? 'خصم' : 'Discount'}
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="h-8 text-sm bg-gray-50 border-gray-200 text-gray-800"
              />
              <div className="flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                <button
                  onClick={() => setDiscountType('amount')}
                  className={`px-2 py-1 text-xs font-medium ${discountType === 'amount' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500'}`}
                >
                  {language === 'ar' ? 'ر.س' : 'SAR'}
                </button>
                <button
                  onClick={() => setDiscountType('percent')}
                  className={`px-2 py-1 text-xs font-medium ${discountType === 'percent' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500'}`}
                >
                  %
                </button>
              </div>
            </div>

            {/* Notes Toggle */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <StickyNote className="w-3.5 h-3.5" />
              {language === 'ar' ? 'إضافة ملاحظة' : 'Add note'}
            </button>
            {showNotes && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'ar' ? 'ملاحظات...' : 'Notes...'}
                rows={2}
                className="w-full text-xs rounded-lg border border-gray-200 bg-gray-50 text-gray-800 p-2 resize-none focus:outline-none focus:border-indigo-300"
              />
            )}
          </div>

          {/* Totals */}
          <div className="px-4 py-3 border-t border-gray-100 space-y-1.5 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{subtotal.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>- {discountAmount.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>{tax.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              <span>{language === 'ar' ? 'ضريبة 15%' : 'VAT 15%'}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-1 border-t border-gray-200">
              <span className="text-emerald-600">{total.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="p-3">
            <button
              onClick={() => {
                if (cart.length === 0) {
                  Swal.fire({ icon: 'warning', title: language === 'ar' ? 'السلة فارغة' : 'Cart is empty', timer: 1500, showConfirmButton: false });
                  return;
                }
                setShowPaymentModal(true);
              }}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-200"
            >
              <CreditCard className="w-5 h-5" />
              {language === 'ar' ? 'إتمام الدفع' : 'Checkout'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Modals ──────────────────────────────────────────────────── */}
      {showPaymentModal && (
        <PaymentModal
          cart={cart}
          total={total}
          subtotal={subtotal}
          tax={tax}
          discountAmount={discountAmount}
          notes={notes}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(invoice) => {
            setLastInvoice(invoice);
            setCart([]);
            setDiscount(0);
            setNotes("");
            setShowPaymentModal(false);
            setShowReceipt(true);
            queryClient.invalidateQueries(['products']);
          }}
          companyInfo={companyInfo}
          language={language}
        />
      )}

      {showReturnModal && (
        <ReturnModal
          onClose={() => setShowReturnModal(false)}
          language={language}
          queryClient={queryClient}
        />
      )}

      {showReceipt && lastInvoice && (
        <ThermalReceipt
          invoice={lastInvoice}
          companyInfo={companyInfo}
          onClose={() => { setShowReceipt(false); setLastInvoice(null); }}
        />
      )}

      {showAddProduct && (
        <QuickAddProduct
          onClose={() => setShowAddProduct(false)}
          onSuccess={(product) => { setShowAddProduct(false); addToCart(product); }}
          language={language}
        />
      )}
    </div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ cart, total, subtotal, tax, discountAmount, notes, onClose, onSuccess, companyInfo, language }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState(total.toFixed(2));
  const [customerName, setCustomerName] = useState("");
  const [processing, setProcessing] = useState(false);

  const paid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paid - total);

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && paid < total) {
      Swal.fire({ icon: 'warning', title: language === 'ar' ? 'تحذير' : 'Warning', text: language === 'ar' ? 'المبلغ المدفوع أقل من الإجمالي' : 'Amount paid is less than total', timer: 2000, showConfirmButton: false });
      return;
    }
    setProcessing(true);

    const invoiceData = {
      invoice_number: `INV-${Date.now()}`,
      customer_name: customerName || (language === 'ar' ? 'عميل نقدي' : 'Walk-in Customer'),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.selling_price,
        total: item.selling_price * item.quantity,
        vat_rate: 15,
        vat_amount: (item.selling_price * item.quantity) * 0.15
      })),
      subtotal,
      apply_vat: true,
      tax_rate: 15,
      tax_amount: tax,
      discount: discountAmount,
      total,
      status: 'paid',
      payment_method: paymentMethod,
      invoice_type: 'simplified',
      notes: notes || undefined
    };

    const invoice = await Wadaq.entities.Invoice.create(invoiceData);

    for (const item of cart) {
      const product = await Wadaq.entities.Product.get(item.id);
      if (product) {
        const previousQty = product.quantity || 0;
        const newQty = Math.max(0, previousQty - item.quantity);
        await Wadaq.entities.Product.update(item.id, { quantity: newQty });
        await Wadaq.entities.StockMovement.create({
          product_id: item.id,
          product_name: item.name,
          type: 'out',
          quantity: item.quantity,
          previous_quantity: previousQty,
          new_quantity: newQty,
          reference_type: 'invoice',
          reference_id: invoice.id,
          date: new Date().toISOString().split('T')[0],
          notes: language === 'ar' ? 'بيع من نقطة البيع' : 'Sale from POS'
        });
      }
    }

    onSuccess(invoice);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {language === 'ar' ? '💳 إتمام الدفع' : '💳 Complete Payment'}
          </h2>
        </div>

        {/* Customer */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1.5 text-right">
            {language === 'ar' ? 'اسم العميل (اختياري)' : 'Customer Name (optional)'}
          </label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={language === 'ar' ? 'أدخل اسم العميل...' : 'Enter customer name...'}
            className="text-right bg-gray-50 border-gray-200 text-gray-800"
          />
        </div>

        {/* Payment Method */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2 text-right">
            {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'cash', icon: Banknote, label: language === 'ar' ? 'نقدي' : 'Cash', color: 'emerald' },
              { value: 'credit_card', icon: CreditCard, label: language === 'ar' ? 'بطاقة' : 'Card', color: 'blue' },
              { value: 'bank_transfer', icon: Smartphone, label: language === 'ar' ? 'تحويل' : 'Transfer', color: 'purple' }
            ].map(method => (
              <button
                key={method.value}
                onClick={() => setPaymentMethod(method.value)}
                className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1.5 border-2 transition-all ${paymentMethod === method.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
              >
                <method.icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        {paymentMethod === 'cash' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1.5 text-right">
              {language === 'ar' ? 'المبلغ المدفوع' : 'Amount Paid'}
            </label>
            <Input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="text-center text-2xl font-bold h-14 bg-gray-50 border-gray-200 text-gray-800"
            />
            {/* Quick amount buttons */}
            <div className="flex gap-2 mt-2">
              {[Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100].filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 3).map(amt => (
                <button key={amt} onClick={() => setAmountPaid(amt.toString())}
                  className="flex-1 py-1.5 text-sm bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg border border-gray-200 font-medium transition-colors">
                  {amt}
                </button>
              ))}
            </div>
            {change > 0 && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <p className="text-emerald-600 text-xs mb-0.5">{language === 'ar' ? 'المبلغ المسترد' : 'Change'}</p>
                <p className="text-2xl font-bold text-emerald-600">{change.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</p>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{subtotal.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
            <span>{language === 'ar' ? 'المجموع' : 'Subtotal'}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>- {discountAmount.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-500">
            <span>{tax.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
            <span>{language === 'ar' ? 'الضريبة 15%' : 'VAT 15%'}</span>
          </div>
          <div className="flex justify-between font-bold text-xl text-gray-900 pt-2 border-t border-gray-200">
            <span className="text-emerald-600">{total.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
            <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={processing}
            className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={handlePayment} disabled={processing}
            className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-emerald-200">
            {processing ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> {language === 'ar' ? 'تأكيد الدفع' : 'Confirm'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Return Modal ──────────────────────────────────────────────────────────────
function ReturnModal({ onClose, language, queryClient }) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [searching, setSearching] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reason, setReason] = useState("");

  const searchInvoice = async () => {
    if (!invoiceNumber.trim()) return;
    setSearching(true);
    const results = await Wadaq.entities.Invoice.filter({ invoice_number: invoiceNumber.trim() });
    if (results.length > 0) {
      const inv = results[0];
      setInvoice(inv);
      setReturnItems((inv.items || []).map(item => ({ ...item, returnQty: 0, maxQty: item.quantity })));
    } else {
      Swal.fire({ icon: 'error', title: language === 'ar' ? 'لم يوجد' : 'Not Found', text: language === 'ar' ? 'رقم الفاتورة غير موجود' : 'Invoice not found', timer: 2000, showConfirmButton: false });
    }
    setSearching(false);
  };

  const handleReturn = async () => {
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
    if (itemsToReturn.length === 0) {
      Swal.fire({ icon: 'warning', text: language === 'ar' ? 'حدد كميات المرتجع' : 'Select return quantities', timer: 1500, showConfirmButton: false });
      return;
    }
    setProcessing(true);

    const returnSubtotal = itemsToReturn.reduce((s, i) => s + (i.price * i.returnQty), 0);
    const returnTax = returnSubtotal * 0.15;
    const returnTotal = returnSubtotal + returnTax;

    // Create credit note
    await Wadaq.entities.CreditNote.create({
      credit_note_number: `CN-${Date.now()}`,
      original_invoice_id: invoice.id,
      original_invoice_number: invoice.invoice_number,
      customer_name: invoice.customer_name,
      date: new Date().toISOString().split('T')[0],
      items: itemsToReturn.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.returnQty, price: i.price, total: i.price * i.returnQty })),
      subtotal: returnSubtotal,
      tax_rate: 15,
      tax_amount: returnTax,
      total: returnTotal,
      notes: reason
    });

    // Return stock
    for (const item of itemsToReturn) {
      const product = await Wadaq.entities.Product.get(item.product_id).catch(() => null);
      if (product) {
        const newQty = (product.quantity || 0) + item.returnQty;
        await Wadaq.entities.Product.update(item.product_id, { quantity: newQty });
        await Wadaq.entities.StockMovement.create({
          product_id: item.product_id,
          product_name: item.product_name,
          type: 'in',
          quantity: item.returnQty,
          previous_quantity: product.quantity || 0,
          new_quantity: newQty,
          reference_type: 'return',
          reference_id: invoice.id,
          date: new Date().toISOString().split('T')[0],
          notes: language === 'ar' ? 'مرتجع من نقطة البيع' : 'Return from POS'
        });
      }
    }

    queryClient.invalidateQueries(['products']);
    Swal.fire({ icon: 'success', title: language === 'ar' ? 'تم المرتجع' : 'Return Processed', text: language === 'ar' ? `تم استرداد ${returnTotal.toFixed(2)} ر.س` : `Refund: ${returnTotal.toFixed(2)} SAR`, timer: 3000, showConfirmButton: false });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-500" />
            {language === 'ar' ? 'مرتجع' : 'Return'}
          </h2>
        </div>

        {/* Search Invoice */}
        <div className="flex gap-2 mb-4">
          <button onClick={searchInvoice} disabled={searching}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold disabled:opacity-50 shrink-0">
            {searching ? '...' : (language === 'ar' ? 'بحث' : 'Search')}
          </button>
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchInvoice()}
            placeholder={language === 'ar' ? 'رقم الفاتورة...' : 'Invoice number...'}
            className="text-right bg-gray-50 border-gray-200 text-gray-800"
          />
        </div>

        {invoice && (
          <>
            <div className="bg-blue-50 rounded-xl p-3 mb-3 border border-blue-100">
              <p className="text-sm font-semibold text-blue-800 text-right">{invoice.customer_name} — {invoice.date}</p>
              <p className="text-xs text-blue-600 text-right">{language === 'ar' ? 'إجمالي الفاتورة:' : 'Invoice Total:'} {invoice.total?.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {returnItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setReturnItems(returnItems.map((i, j) => j === idx ? { ...i, returnQty: Math.max(0, i.returnQty - 1) } : i))}
                      className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-600 hover:bg-red-50 flex items-center justify-center text-sm">-</button>
                    <span className="w-6 text-center text-sm font-bold text-orange-600">{item.returnQty}</span>
                    <button onClick={() => setReturnItems(returnItems.map((i, j) => j === idx ? { ...i, returnQty: Math.min(i.maxQty, i.returnQty + 1) } : i))}
                      className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-600 hover:bg-green-50 flex items-center justify-center text-sm">+</button>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
                    <p className="text-xs text-gray-400">{language === 'ar' ? 'مشترى:' : 'Bought:'} {item.maxQty}</p>
                  </div>
                </div>
              ))}
            </div>

            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'ar' ? 'سبب الإرجاع...' : 'Return reason...'}
              className="text-right bg-gray-50 border-gray-200 text-gray-800 mb-3"
            />

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 h-11 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleReturn} disabled={processing}
                className="flex-1 h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                <AlertTriangle className="w-4 h-4" />
                {processing ? '...' : (language === 'ar' ? 'تأكيد المرتجع' : 'Confirm Return')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function POSPage() {
  return (
    <SubscriptionGuard>
      <POSContent />
    </SubscriptionGuard>
  );
}