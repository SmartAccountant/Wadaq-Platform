import React, { useState, useEffect, useRef } from "react";
import { Wadaq } from "@/api/WadaqCore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, CreditCard, Banknote, Weight, ShoppingBag, User, Clock, Calculator, ArrowLeft, DollarSign, Package, AlertCircle, Plus } from "lucide-react";
import QuickAddProduct from "@/components/pos/QuickAddProduct";
import { useLanguage } from "@/components/LanguageContext";
import Swal from "sweetalert2";
import { format } from "date-fns";
import ThermalReceipt from "@/components/invoices/ThermalReceipt";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import AdminCashierGate from "@/components/auth/AdminCashierGate";

function SupermarketPOSContent() {
  const { language, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [user, setUser] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [plasticBags, setPlasticBags] = useState(0);
  const [shiftStart, setShiftStart] = useState(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightProduct, setWeightProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const barcodeRef = useRef(null);

  useEffect(() => {
    Wadaq.auth.me().then(async (userData) => {
      setUser(userData);
      const orgs = await Wadaq.entities.Organization.filter({ owner_email: userData.email });
      if (orgs.length > 0) {
        setCompanyInfo(orgs[0]);
      }
      // بداية الوردية
      if (!localStorage.getItem('shift_start')) {
        const start = new Date().toISOString();
        localStorage.setItem('shift_start', start);
        setShiftStart(start);
      } else {
        setShiftStart(localStorage.getItem('shift_start'));
      }
    }).catch(() => {});
  }, []);

  // جلب المنتجات
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => Wadaq.entities.Product.filter({ is_active: true })
  });

  // الأقسام
  const categories = [
    { id: 'all', name: language === 'ar' ? '🛒 الكل' : '🛒 All', color: 'bg-slate-700' },
    { id: 'خضروات', name: language === 'ar' ? '🥬 خضروات' : '🥬 Vegetables', color: 'bg-green-600' },
    { id: 'فواكه', name: language === 'ar' ? '🍎 فواكه' : '🍎 Fruits', color: 'bg-red-600' },
    { id: 'لحوم', name: language === 'ar' ? '🥩 لحوم' : '🥩 Meat', color: 'bg-rose-700' },
    { id: 'ألبان', name: language === 'ar' ? '🥛 ألبان' : '🥛 Dairy', color: 'bg-blue-600' },
    { id: 'معلبات', name: language === 'ar' ? '🥫 معلبات' : '🥫 Canned', color: 'bg-amber-600' },
    { id: 'مخبوزات', name: language === 'ar' ? '🍞 مخبوزات' : '🍞 Bakery', color: 'bg-yellow-700' },
    { id: 'مشروبات', name: language === 'ar' ? '🥤 مشروبات' : '🥤 Drinks', color: 'bg-purple-600' },
    { id: 'تنظيف', name: language === 'ar' ? '🧴 تنظيف' : '🧴 Cleaning', color: 'bg-cyan-600' }
  ];

  // فلترة المنتجات
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesCategory && product.quantity > 0;
  });

  // مسح الباركود - سريع جداً
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyPress = (e) => {
      if (showPaymentModal || showWeightModal) return;

      const currentTime = Date.now();
      
      // إذا مرت أكثر من 100ms، إبدأ من جديد
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter' && buffer) {
        const product = products.find(p => 
          p.barcode === buffer || 
          p.code === buffer
        );
        
        if (product) {
          // تحقق إذا المنتج يحتاج وزن
          if (product.unit === 'كيلو' || product.unit === 'kg') {
            setWeightProduct(product);
            setShowWeightModal(true);
          } else {
            addToCart(product);
          }
        } else {
          playError();
        }
        buffer = '';
        setBarcodeInput('');
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [products, showPaymentModal, showWeightModal]);

  const playBeep = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const playError = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YU4AAAD//wAA//8AAP//AAD//w==');
    audio.volume = 0.6;
    audio.play().catch(() => {});
    Swal.fire({
      icon: 'error',
      title: language === 'ar' ? 'غير موجود' : 'Not Found',
      text: language === 'ar' ? 'المنتج غير موجود في النظام' : 'Product not found',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const addToCart = (product, weight = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      const newQty = existingItem.quantity + weight;
      if (newQty > product.quantity) {
        Swal.fire({
          icon: 'warning',
          title: language === 'ar' ? 'تحذير' : 'Warning',
          text: language === 'ar' ? `المتوفر: ${product.quantity}` : `Available: ${product.quantity}`,
          timer: 2000
        });
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: newQty }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: weight }]);
    }

    playBeep();
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
      return;
    }

    const product = products.find(p => p.id === productId);
    if (newQuantity > product.quantity) {
      Swal.fire({
        icon: 'warning',
        title: language === 'ar' ? 'تحذير' : 'Warning',
        text: language === 'ar' ? `المتوفر: ${product.quantity}` : `Available: ${product.quantity}`,
        timer: 2000
      });
      return;
    }

    setCart(cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    Swal.fire({
      title: language === 'ar' ? 'مسح السلة؟' : 'Clear Cart?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: language === 'ar' ? 'نعم' : 'Yes',
      cancelButtonText: language === 'ar' ? 'لا' : 'No',
      confirmButtonColor: '#ef4444'
    }).then((result) => {
      if (result.isConfirmed) {
        setCart([]);
        setPlasticBags(0);
      }
    });
  };

  const calculateTotal = () => {
    const itemsTotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    const bagsTotal = plasticBags * 0.5; // 0.5 ريال للكيس
    const subtotal = itemsTotal + bagsTotal;
    const tax = subtotal * 0.15;
    return { itemsTotal, bagsTotal, subtotal, tax, total: subtotal + tax };
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: language === 'ar' ? 'السلة فارغة' : 'Cart Empty',
        timer: 1500
      });
      return;
    }
    setShowPaymentModal(true);
  };

  const applyDiscount = async () => {
    const { value: discountPercent } = await Swal.fire({
      title: language === 'ar' ? 'خصم سريع' : 'Quick Discount',
      input: 'number',
      inputLabel: language === 'ar' ? 'نسبة الخصم %' : 'Discount %',
      inputPlaceholder: '10',
      showCancelButton: true,
      confirmButtonText: language === 'ar' ? 'تطبيق' : 'Apply',
      cancelButtonText: language === 'ar' ? 'إلغاء' : 'Cancel'
    });

    if (discountPercent && discountPercent > 0 && discountPercent <= 100) {
      const newCart = cart.map(item => ({
        ...item,
        selling_price: item.selling_price * (1 - discountPercent / 100)
      }));
      setCart(newCart);
      Swal.fire({
        icon: 'success',
        title: language === 'ar' ? `تم تطبيق خصم ${discountPercent}%` : `${discountPercent}% discount applied`,
        timer: 1500
      });
    }
  };

  const endShift = async () => {
    const result = await Swal.fire({
      title: language === 'ar' ? 'إنهاء الوردية؟' : 'End Shift?',
      text: language === 'ar' ? 'سيتم طباعة تقرير الوردية' : 'Shift report will be printed',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: language === 'ar' ? 'نعم' : 'Yes',
      cancelButtonText: language === 'ar' ? 'لا' : 'No'
    });

    if (result.isConfirmed) {
      // هنا يمكن إضافة طباعة تقرير الوردية
      localStorage.removeItem('shift_start');
      window.location.reload();
    }
  };

  const { itemsTotal, bagsTotal, subtotal, tax, total } = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      {/* شريط الحالة العلوي */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-3 mb-3 shadow-xl">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-bold">{user?.full_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-mono">{format(new Date(), 'HH:mm:ss')}</span>
            </div>
            {shiftStart && (
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
                <span className="text-sm">{language === 'ar' ? 'الوردية بدأت' : 'Shift started'}</span>
                <span className="font-mono text-sm">{format(new Date(shiftStart), 'HH:mm')}</span>
              </div>
            )}
          </div>
          <Button
            onClick={endShift}
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/20"
          >
            {language === 'ar' ? 'إنهاء الوردية' : 'End Shift'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* قسم المنتجات - أصغر */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          {/* الأقسام */}
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 p-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              {categories.slice(0, 9).map(cat => (
                <Button
                  key={cat.id}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`${cat.color} hover:opacity-80 text-white border-0 h-14 text-xs`}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => setShowAddProduct(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12"
            >
              <Plus className="w-5 h-5 ml-2" />
              {language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
            </Button>
          </Card>

          {/* شبكة المنتجات - مع صور */}
          <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                onClick={() => {
                  if (product.unit === 'كيلو' || product.unit === 'kg') {
                    setWeightProduct(product);
                    setShowWeightModal(true);
                  } else {
                    addToCart(product);
                  }
                }}
                className="bg-slate-800/80 border-slate-700/50 p-2 cursor-pointer hover:border-emerald-500/50 transition-all group hover:shadow-lg hover:shadow-emerald-500/20"
              >
                {/* صورة المنتج */}
                {product.images?.[0] ? (
                  <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-slate-900">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 mb-2 flex items-center justify-center">
                    <Package className="w-8 h-8 text-slate-600" />
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-white text-xs line-clamp-2 flex-1">{product.name}</h3>
                  {(product.unit === 'كيلو' || product.unit === 'kg') && (
                    <Weight className="w-3 h-3 text-amber-400 ml-1" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold text-sm">
                    {product.selling_price?.toFixed(2)}
                  </span>
                  <Badge variant="secondary" className="bg-slate-700 text-xs px-1">
                    {product.quantity}
                  </Badge>
                </div>
                {product.barcode && (
                  <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">{product.barcode}</div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* قسم السلة والدفع - أكبر */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 p-4">
            {/* حقل الباركود المباشر */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-6 h-6" />
                  <Input
                    ref={barcodeRef}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder={language === 'ar' ? '🔍 امسح الباركود هنا...' : '🔍 Scan barcode here...'}
                    className="pl-12 bg-slate-900/80 border-emerald-500/50 text-white text-xl h-16 font-mono"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={applyDiscount}
                  className="bg-amber-600 hover:bg-amber-700 h-16 px-6"
                >
                  <DollarSign className="w-5 h-5 ml-2" />
                  {language === 'ar' ? 'خصم' : 'Discount'}
                </Button>
                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="border-rose-500 text-rose-400 hover:bg-rose-500/10 h-16 px-6"
                  disabled={cart.length === 0}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* جدول المنتجات */}
            <div className="bg-slate-900/50 rounded-lg p-3 mb-4 max-h-[300px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-lg">{language === 'ar' ? 'ابدأ بمسح المنتجات' : 'Start scanning products'}</p>
                </div>
              ) : (
                <table className="w-full text-white">
                  <thead className="border-b border-slate-700">
                    <tr className="text-slate-400 text-sm">
                      <th className="text-right py-2">{language === 'ar' ? 'الصنف' : 'Item'}</th>
                      <th className="text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                      <th className="text-center">{language === 'ar' ? 'السعر' : 'Price'}</th>
                      <th className="text-right">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="py-3 font-medium">{item.name}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 0.5)}
                              className="h-7 w-7 p-0 bg-slate-700 hover:bg-slate-600"
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              step="0.1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                              className="w-16 h-7 text-center bg-slate-800 border-slate-700 text-white"
                            />
                            <Button
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 0.5)}
                              className="h-7 w-7 p-0 bg-slate-700 hover:bg-slate-600"
                            >
                              +
                            </Button>
                          </div>
                        </td>
                        <td className="text-center">{item.selling_price.toFixed(2)}</td>
                        <td className="text-right font-bold text-emerald-400">
                          {(item.selling_price * item.quantity).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* الأكياس البلاستيكية */}
            <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-slate-400" />
                  <span className="text-white font-medium">
                    {language === 'ar' ? 'أكياس بلاستيك (0.5 ر.س)' : 'Plastic Bags (0.5 SAR)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setPlasticBags(Math.max(0, plasticBags - 1))}
                    className="h-8 w-8 p-0 bg-slate-700 hover:bg-slate-600"
                  >
                    -
                  </Button>
                  <span className="text-white font-bold text-lg w-12 text-center">{plasticBags}</span>
                  <Button
                    size="sm"
                    onClick={() => setPlasticBags(plasticBags + 1)}
                    className="h-8 w-8 p-0 bg-slate-700 hover:bg-slate-600"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* الإجماليات */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-slate-300 text-lg">
                <span>{language === 'ar' ? 'المنتجات' : 'Items'}</span>
                <span className="font-bold">{itemsTotal.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
              {bagsTotal > 0 && (
                <div className="flex justify-between text-slate-300 text-lg">
                  <span>{language === 'ar' ? 'الأكياس' : 'Bags'}</span>
                  <span className="font-bold">{bagsTotal.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300 text-lg">
                <span>{language === 'ar' ? 'الضريبة 15%' : 'VAT 15%'}</span>
                <span className="font-bold">{tax.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
              <div className="flex justify-between text-3xl font-bold text-white pt-3 border-t border-slate-700">
                <span>{language === 'ar' ? 'الإجمالي' : 'TOTAL'}</span>
                <span className="text-emerald-400">{total.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
            </div>

            {/* أزرار الدفع الكبيرة */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="h-20 text-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                <CreditCard className="w-6 h-6 ml-2" />
                {language === 'ar' ? 'بطاقة' : 'Card'}
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="h-20 text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Banknote className="w-6 h-6 ml-2" />
                {language === 'ar' ? 'نقدي' : 'Cash'}
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="h-20 text-xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                <Package className="w-6 h-6 ml-2" />
                {language === 'ar' ? 'آجل' : 'Credit'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* مودال الوزن */}
      {showWeightModal && weightProduct && (
        <WeightModal
          product={weightProduct}
          onClose={() => {
            setShowWeightModal(false);
            setWeightProduct(null);
          }}
          onConfirm={(weight) => {
            addToCart(weightProduct, weight);
            setShowWeightModal(false);
            setWeightProduct(null);
          }}
          language={language}
        />
      )}

      {/* مودال الدفع */}
      {showPaymentModal && (
        <PaymentModal
          cart={cart}
          total={total}
          subtotal={subtotal}
          tax={tax}
          plasticBags={plasticBags}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(invoice) => {
            setLastInvoice(invoice);
            setCart([]);
            setPlasticBags(0);
            setShowPaymentModal(false);
            setShowReceipt(true);
            queryClient.invalidateQueries(['products']);
          }}
          companyInfo={companyInfo}
          language={language}
        />
      )}

      {/* الفاتورة الحرارية */}
      {showReceipt && lastInvoice && (
        <ThermalReceipt
          invoice={lastInvoice}
          companyInfo={companyInfo}
          onClose={() => {
            setShowReceipt(false);
            setLastInvoice(null);
          }}
        />
      )}

      {/* مودال إضافة منتج سريع */}
      {showAddProduct && (
        <QuickAddProduct
          onClose={() => setShowAddProduct(false)}
          onSuccess={(product) => {
            setShowAddProduct(false);
            // إضافة للسلة مباشرة
            if (product.unit === 'كيلو' || product.unit === 'kg') {
              setWeightProduct(product);
              setShowWeightModal(true);
            } else {
              addToCart(product);
            }
          }}
          language={language}
        />
      )}
    </div>
  );
}

export default function SupermarketPOS() {
  return (
    <AdminCashierGate>
      <SubscriptionGuard>
        <SupermarketPOSContent />
      </SubscriptionGuard>
    </AdminCashierGate>
  );
}

// مودال الوزن
function WeightModal({ product, onClose, onConfirm, language }) {
  const [weight, setWeight] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 p-6">
        <div className="text-center mb-6">
          <Weight className="w-16 h-16 text-amber-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white mb-2">{product.name}</h2>
          <p className="text-slate-400">{language === 'ar' ? 'أدخل الوزن بالكيلو' : 'Enter weight in KG'}</p>
        </div>

        <div className="space-y-4 mb-6">
          <Input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            className="bg-slate-900/50 border-slate-700 text-white text-3xl h-20 text-center font-bold"
            autoFocus
          />

          <div className="grid grid-cols-3 gap-2">
            {[0.25, 0.5, 1, 2, 3, 5].map(w => (
              <Button
                key={w}
                onClick={() => setWeight(w)}
                className="h-14 text-lg bg-slate-700 hover:bg-slate-600"
              >
                {w} {language === 'ar' ? 'كجم' : 'kg'}
              </Button>
            ))}
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">{language === 'ar' ? 'السعر الإجمالي' : 'Total Price'}</p>
            <p className="text-3xl font-bold text-emerald-400">
              {(product.selling_price * weight).toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-14 text-lg border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={() => onConfirm(weight)}
            disabled={weight <= 0}
            className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-600"
          >
            {language === 'ar' ? 'إضافة' : 'Add'} ✓
          </Button>
        </div>
      </Card>
    </div>
  );
}

// مودال الدفع
function PaymentModal({ cart, total, subtotal, tax, plasticBags, onClose, onSuccess, companyInfo, language }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState(total);
  const [customerName, setCustomerName] = useState("");
  const [processing, setProcessing] = useState(false);

  const change = Math.max(0, amountPaid - total);

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const invoiceNumber = `INV-${Date.now()}`;
      
      // إضافة الأكياس للسلة إذا كانت موجودة
      let items = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.selling_price,
        total: item.selling_price * item.quantity,
        vat_rate: 15,
        vat_amount: (item.selling_price * item.quantity) * 0.15
      }));

      if (plasticBags > 0) {
        items.push({
          product_id: 'plastic-bags',
          product_name: language === 'ar' ? 'أكياس بلاستيك' : 'Plastic Bags',
          quantity: plasticBags,
          price: 0.5,
          total: plasticBags * 0.5,
          vat_rate: 15,
          vat_amount: (plasticBags * 0.5) * 0.15
        });
      }

      const invoiceData = {
        invoice_number: invoiceNumber,
        customer_name: customerName || (language === 'ar' ? 'عميل' : 'Walk-in'),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        items: items,
        subtotal: subtotal,
        apply_vat: true,
        tax_rate: 15,
        tax_amount: tax,
        total: total,
        status: 'paid',
        payment_method: paymentMethod,
        invoice_type: 'simplified'
      };

      const invoice = await Wadaq.entities.Invoice.create(invoiceData);

      // تحديث المخزون - خصم من المخزون الحالي فقط
      for (const item of cart) {
        const product = await Wadaq.entities.Product.get(item.id);
        if (product) {
          const previousQty = product.quantity || 0;
          const newQty = Math.max(0, previousQty - item.quantity);
          
          await Wadaq.entities.Product.update(item.id, {
            quantity: newQty
          });

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
            notes: language === 'ar' ? 'بيع من كاشير السوبرماركت' : 'Sale from Supermarket POS'
          });
        }
      }

      return invoice;
    },
    onSuccess: (invoice) => {
      onSuccess(invoice);
    }
  });

  const handlePayment = () => {
    if (paymentMethod === 'cash' && amountPaid < total) {
      Swal.fire({
        icon: 'warning',
        text: language === 'ar' ? 'المبلغ غير كافٍ' : 'Insufficient amount',
        timer: 2000
      });
      return;
    }

    setProcessing(true);
    createInvoiceMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 p-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          💳 {language === 'ar' ? 'الدفع' : 'Payment'}
        </h2>

        {paymentMethod === 'cash' && (
          <div className="mb-6">
            <label className="block text-slate-300 mb-2 font-bold text-xl">
              {language === 'ar' ? 'المبلغ المدفوع' : 'Amount Paid'}
            </label>
            <Input
              type="number"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              className="bg-slate-900/50 border-slate-700 text-white text-4xl h-20 text-center font-bold"
              autoFocus
            />
            {change > 0 && (
              <div className="mt-4 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-xl p-6 text-center">
                <p className="text-emerald-400 text-lg mb-2">{language === 'ar' ? 'الباقي' : 'Change'}</p>
                <p className="text-5xl font-bold text-emerald-400">{change.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-900/50 rounded-lg p-6 mb-6">
          <div className="flex justify-between text-2xl font-bold text-white">
            <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
            <span className="text-emerald-400">{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 h-16 text-lg">
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handlePayment}
            disabled={processing}
            className="flex-1 h-16 text-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600"
          >
            {processing ? '...' : `${language === 'ar' ? 'تأكيد' : 'Confirm'} ✓`}
          </Button>
        </div>
      </Card>
    </div>
  );
}