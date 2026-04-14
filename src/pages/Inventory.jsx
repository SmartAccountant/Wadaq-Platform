import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, AlertTriangle, TrendingUp, TrendingDown, Plus, ArrowUpCircle, ArrowDownCircle, Calendar, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import StockMovementModal from "@/components/inventory/StockMovementModal";
import StockHistoryModal from "@/components/inventory/StockHistoryModal";
import BatchManagementModal from "@/components/inventory/BatchManagementModal";
import { differenceInDays, parseISO } from "date-fns";
import PlanGuard from "@/components/auth/PlanGuard";

function InventoryContent() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Product.filter({ created_by: currentUser.email });
    },
  });

  const { data: movements = [], isLoading: loadingMovements } = useQuery({
    queryKey: ["stockMovements"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.StockMovement.filter({ created_by: currentUser.email }, "-created_date", 100);
    },
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["productBatches"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.ProductBatch.filter({ created_by: currentUser.email });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => Wadaq.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: (data) => Wadaq.entities.StockMovement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
    },
  });

  const handleStockMovement = async (movementData) => {
    const product = products.find(p => p.id === movementData.product_id);
    if (!product) return;

    const previousQty = product.quantity || 0;
    const newQty = movementData.type === 'in' 
      ? previousQty + movementData.quantity 
      : previousQty - movementData.quantity;

    // Update product quantity
    await updateProductMutation.mutateAsync({
      id: product.id,
      data: { ...product, quantity: newQty }
    });

    // Create movement record
    await createMovementMutation.mutateAsync({
      ...movementData,
      previous_quantity: previousQty,
      new_quantity: newQty,
      date: new Date().toISOString().split('T')[0]
    });

    setShowMovementModal(false);
    setSelectedProduct(null);
  };

  const handleViewHistory = (product) => {
    setSelectedProduct(product);
    setShowHistoryModal(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    if (filterType === "low") return matchesSearch && (product.quantity || 0) <= (product.min_stock_level || 5);
    if (filterType === "out") return matchesSearch && (product.quantity || 0) === 0;
    
    return matchesSearch;
  });

  const lowStockCount = products.filter(p => (p.quantity || 0) <= (p.min_stock_level || 5) && (p.quantity || 0) > 0).length;
  const outOfStockCount = products.filter(p => (p.quantity || 0) === 0).length;
  const totalValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.selling_price || 0)), 0);
  
  // Calculate expiring products (within 30 days)
  const expiringProducts = products.filter(p => {
    if (!p.expiry_date) return false;
    const daysUntilExpiry = differenceInDays(parseISO(p.expiry_date), new Date());
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  });
  
  const expiringBatches = batches.filter(b => {
    if (!b.expiry_date || b.status === 'expired') return false;
    const daysUntilExpiry = differenceInDays(parseISO(b.expiry_date), new Date());
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  });

  if (loadingProducts) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
            {language === 'ar' ? 'إدارة المخزون' : 'Inventory Management'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-light tracking-wide">
            {language === 'ar' ? 'تتبع وإدارة كميات المنتجات' : 'Track and manage product quantities'}
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedProduct(null);
            setShowMovementModal(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-6 font-light tracking-wide"
        >
          <Plus className="w-5 h-5 ml-2" strokeWidth={1.5} />
          {language === 'ar' ? 'حركة مخزون' : 'Stock Movement'}
        </Button>
      </div>

      {/* Expiry Alerts */}
      {(expiringProducts.length > 0 || expiringBatches.length > 0) && (
        <Card className="border-2 border-amber-500 bg-amber-50/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">
                  {language === 'ar' ? 'تنبيه: منتجات قاربت على انتهاء الصلاحية' : 'Warning: Products Near Expiry'}
                </h3>
                {expiringProducts.length > 0 && (
                  <p className="text-sm text-amber-800 mb-1">
                    {language === 'ar' ? `${expiringProducts.length} منتج ينتهي خلال 30 يوم` : `${expiringProducts.length} products expiring within 30 days`}
                  </p>
                )}
                {expiringBatches.length > 0 && (
                  <p className="text-sm text-amber-800">
                    {language === 'ar' ? `${expiringBatches.length} دفعة تنتهي خلال 30 يوم` : `${expiringBatches.length} batches expiring within 30 days`}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-emerald-600 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-500 mb-1">{language === 'ar' ? 'قيمة المخزون' : 'Inventory Value'}</p>
            <p className="text-2xl font-bold text-slate-800">{totalValue.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-600 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <ArrowDownCircle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm text-slate-500 mb-1">{language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}</p>
            <p className="text-2xl font-bold text-slate-800">{lowStockCount} {language === 'ar' ? 'منتج' : 'Products'}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-rose-600 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-sm text-slate-500 mb-1">{language === 'ar' ? 'نفد من المخزون' : 'Out of Stock'}</p>
            <p className="text-2xl font-bold text-slate-800">{outOfStockCount} {language === 'ar' ? 'منتج' : 'Products'}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-600 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <AlertTriangle className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-slate-500 mb-1">{language === 'ar' ? 'قارب على الانتهاء' : 'Near Expiry'}</p>
            <p className="text-2xl font-bold text-slate-800">
              {expiringProducts.length + expiringBatches.length} {language === 'ar' ? 'عنصر' : 'Items'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={language === 'ar' ? 'بحث بالاسم أو الرمز...' : 'Search by name or code...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{language === 'ar' ? 'جميع المنتجات' : 'All Products'}</option>
          <option value="low">{language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}</option>
          <option value="out">{language === 'ar' ? 'نفد من المخزون' : 'Out of Stock'}</option>
        </select>
      </div>

      {/* Products Table */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">
            {language === 'ar' ? 'المنتجات' : 'Products'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              {language === 'ar' ? 'لا توجد منتجات' : 'No products found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-right p-4 text-sm font-semibold text-slate-600">
                      {language === 'ar' ? 'المنتج' : 'Product'}
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-slate-600">
                      {language === 'ar' ? 'الكمية' : 'Quantity'}
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-slate-600">
                      {language === 'ar' ? 'الحد الأدنى' : 'Min Level'}
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-slate-600">
                      {language === 'ar' ? 'الحالة' : 'Status'}
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-slate-600">
                      {language === 'ar' ? 'انتهاء الصلاحية' : 'Expiry Date'}
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-slate-600">
                      {language === 'ar' ? 'القيمة' : 'Value'}
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-slate-600">
                      {language === 'ar' ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    const qty = product.quantity || 0;
                    const minLevel = product.min_stock_level || 5;
                    const isLow = qty <= minLevel && qty > 0;
                    const isOut = qty === 0;
                    const value = qty * (product.selling_price || 0);
                    
                    // Check expiry status
                    let expiryStatus = null;
                    let daysUntilExpiry = null;
                    if (product.expiry_date) {
                      daysUntilExpiry = differenceInDays(parseISO(product.expiry_date), new Date());
                      if (daysUntilExpiry < 0) {
                        expiryStatus = 'expired';
                      } else if (daysUntilExpiry <= 30) {
                        expiryStatus = 'expiring';
                      }
                    }
                    
                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-slate-800">
                              {language === 'ar' ? product.name : (product.name_en || product.name)}
                            </p>
                            {product.code && (
                              <p className="text-xs text-slate-500">{product.code}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-lg font-bold text-slate-800">{qty}</span>
                        </td>
                        <td className="p-4 text-center text-slate-600">{minLevel}</td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col gap-1 items-center">
                            {isOut ? (
                              <Badge className="bg-rose-100 text-rose-700">
                                {language === 'ar' ? 'نفد' : 'Out'}
                              </Badge>
                            ) : isLow ? (
                              <Badge className="bg-amber-100 text-amber-700">
                                {language === 'ar' ? 'منخفض' : 'Low'}
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700">
                                {language === 'ar' ? 'متوفر' : 'Available'}
                              </Badge>
                            )}
                            {expiryStatus === 'expired' && (
                              <Badge className="bg-rose-600 text-white text-xs">
                                {language === 'ar' ? 'منتهي' : 'Expired'}
                              </Badge>
                            )}
                            {expiryStatus === 'expiring' && (
                              <Badge className="bg-amber-500 text-white text-xs">
                                {language === 'ar' ? `${daysUntilExpiry} يوم` : `${daysUntilExpiry}d`}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center text-sm text-slate-600">
                          {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString('ar-SA') : '-'}
                        </td>
                        <td className="p-4 text-center font-medium text-slate-800">
                          {value.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowMovementModal(true);
                              }}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <ArrowUpCircle className="w-4 h-4 ml-1" />
                              {language === 'ar' ? 'حركة' : 'Move'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewHistory(product)}
                            >
                              {language === 'ar' ? 'السجل' : 'History'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowBatchModal(true);
                              }}
                              className="text-purple-600 border-purple-200 hover:bg-purple-50"
                            >
                              <Layers className="w-4 h-4 ml-1" />
                              {language === 'ar' ? 'الدفعات' : 'Batches'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showMovementModal && (
        <StockMovementModal
          product={selectedProduct}
          products={products}
          onClose={() => {
            setShowMovementModal(false);
            setSelectedProduct(null);
          }}
          onSave={handleStockMovement}
        />
      )}

      {showHistoryModal && selectedProduct && (
        <StockHistoryModal
          product={selectedProduct}
          movements={movements.filter(m => m.product_id === selectedProduct.id)}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showBatchModal && selectedProduct && (
        <BatchManagementModal
          product={selectedProduct}
          batches={batches.filter(b => b.product_id === selectedProduct.id)}
          onClose={() => {
            setShowBatchModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

export default function Inventory() {
  const { language } = useLanguage();
  
  return (
    <PlanGuard 
      requiredPlans={['advanced', 'smart', 'golden']} 
      featureName={language === 'ar' ? 'إدارة المخزون' : 'Inventory Management'}
    >
      <InventoryContent />
    </PlanGuard>
  );
}