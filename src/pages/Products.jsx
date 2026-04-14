import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Edit, GitCompare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ProductsList from "@/components/products/ProductsList";
import ProductForm from "@/components/products/ProductForm";
import VariantsManager from "@/components/products/VariantsManager";
import BulkUpdateModal from "@/components/products/BulkUpdateModal";
import ProductComparison from "@/components/products/ProductComparison";
import ProductReviews from "@/components/products/ProductReviews";
import { useLanguage } from "@/components/LanguageContext";
import Swal from "sweetalert2";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import { toast } from "@/components/ui/use-toast";

const categories = [
  "إلكترونيات",
  "ملابس",
  "أغذية",
  "أدوات منزلية",
  "مستلزمات مكتبية",
  "خدمات",
  "أخرى",
];

function ProductsContent() {
  const { language } = useLanguage();
  const [view, setView] = useState("list");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [compareProducts, setCompareProducts] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [viewingReviews, setViewingReviews] = useState(null);

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Product.filter({ created_by: currentUser.email }, "-created_date");
    },
  });

  const { data: variants = [] } = useQuery({
    queryKey: ["allVariants"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.ProductVariant.filter({ created_by: currentUser.email });
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => Wadaq.entities.ProductReview.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await Wadaq.auth.me();
      return Wadaq.entities.Product.create({
        ...data,
        created_by: user.email,
        created_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setView("list");
      setSelectedProduct(null);
      toast({
        title: language === "ar" ? "تم الحفظ" : "Saved",
        description:
          language === "ar"
            ? "تم حفظ المنتج وتحديث القائمة."
            : "Product saved and list updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل الحفظ" : "Save failed",
        description:
          error?.message ||
          (language === "ar" ? "تعذّر حفظ المنتج. تحقق من الحقول." : "Could not save product."),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => Wadaq.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setView("list");
      setSelectedProduct(null);
      toast({
        title: language === "ar" ? "تم التحديث" : "Updated",
        description: language === "ar" ? "تم حفظ تعديلات المنتج." : "Product changes saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل التحديث" : "Update failed",
        description: error?.message || "",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Wadaq.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleSave = (data) => {
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setView("form");
  };

  const handleDelete = (product) => {
    Swal.fire({
      title: language === 'ar' ? 'حذف المنتج؟' : 'Delete Product?',
      text: language === 'ar' 
        ? `هل أنت متأكد من حذف ${product.name}؟ سيتم حذف جميع بياناته.`
        : `Are you sure you want to delete ${product.name}? All data will be removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: language === 'ar' ? 'نعم، احذف' : 'Yes, delete',
      cancelButtonText: language === 'ar' ? 'إلغاء' : 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(product.id);
        Swal.fire({
          title: language === 'ar' ? 'تم الحذف!' : 'Deleted!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  const handleManageVariants = (product) => {
    setSelectedProduct(product);
    setView("variants");
  };

  const handleToggleSelect = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkUpdate = async (updates) => {
    try {
      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId);
        let updateData = { ...updates };
        
        if (updates.price_adjustment) {
          const { type, value } = updates.price_adjustment;
          const currentPrice = product.selling_price || 0;
          
          if (type === 'increase') {
            updateData.selling_price = currentPrice + value;
          } else if (type === 'decrease') {
            updateData.selling_price = Math.max(0, currentPrice - value);
          }
          
          delete updateData.price_adjustment;
        }
        
        await updateMutation.mutateAsync({ id: productId, data: updateData });
      }
      
      setSelectedProducts([]);
      setShowBulkUpdate(false);
    } catch (error) {
      console.error('Bulk update error:', error);
    }
  };

  const handleAddToCompare = (product) => {
    if (compareProducts.length >= 4) {
      alert(language === 'ar' ? 'يمكنك مقارنة 4 منتجات كحد أقصى' : 'You can compare up to 4 products');
      return;
    }
    
    if (compareProducts.find(p => p.id === product.id)) {
      return;
    }
    
    setCompareProducts([...compareProducts, product]);
  };

  const handleRemoveFromCompare = (productId) => {
    setCompareProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleViewReviews = (product) => {
    setViewingReviews(product);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.custom_fields?.some(field => 
        field.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.value?.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      variants.some(v => 
        v.product_id === product.id && 
        (v.variant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         v.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = !product.has_variants && product.quantity <= (product.min_stock_level || 5) && product.quantity > 0;
    } else if (stockFilter === "out") {
      matchesStock = !product.has_variants && product.quantity === 0;
    } else if (stockFilter === "available") {
      matchesStock = !product.has_variants && product.quantity > (product.min_stock_level || 5);
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (viewingReviews) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setViewingReviews(null)}>
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <h2 className="text-xl font-semibold">
            {language === 'ar' ? viewingReviews.name : (viewingReviews.name_en || viewingReviews.name)}
          </h2>
        </div>
        <ProductReviews product={viewingReviews} />
      </div>
    );
  }

  if (view === "form") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
          {selectedProduct ? (language === 'ar' ? 'تعديل المنتج' : 'Edit Product') : (language === 'ar' ? 'منتج جديد' : 'New Product')}
        </h1>
        <ProductForm
          product={selectedProduct}
          onSave={handleSave}
          onCancel={() => {
            setView("list");
            setSelectedProduct(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  if (view === "variants") {
    return (
      <VariantsManager
        product={selectedProduct}
        onBack={() => {
          setView("list");
          setSelectedProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight">{language === 'ar' ? 'المنتجات' : 'Products'}</h1>
          <p className="text-gray-500 mt-2 text-sm font-light tracking-wide">{language === 'ar' ? 'إدارة المنتجات والمخزون' : 'Manage Products & Inventory'}</p>
        </div>
        <div className="flex gap-2">
          {compareProducts.length > 0 && (
            <Button 
              variant="outline"
              onClick={() => setShowComparison(true)}
              className="gap-2"
            >
              <GitCompare className="w-4 h-4" />
              {language === 'ar' ? 'مقارنة' : 'Compare'}
              <Badge variant="secondary">{compareProducts.length}</Badge>
            </Button>
          )}
          <Button 
            onClick={() => {
              setSelectedProduct(null);
              setView("form");
            }}
            className="bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white rounded-full px-6 font-light tracking-wide btn-glow"
          >
            <Plus className="w-5 h-5 ml-2" strokeWidth={1.5} />
            {language === 'ar' ? 'منتج جديد' : 'New Product'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={language === 'ar' ? 'بحث بالاسم، الرمز، الباركود، أو الحقول المخصصة...' : 'Search by name, code, barcode, or custom fields...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedProducts.length} {language === 'ar' ? 'محدد' : 'selected'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowBulkUpdate(true)}
            >
              <Edit className="w-4 h-4 ml-2" />
              {language === 'ar' ? 'تحديث جماعي' : 'Bulk Update'}
            </Button>
          </div>
        )}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue placeholder={language === 'ar' ? 'التصنيف' : 'Category'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? 'جميع التصنيفات' : 'All Categories'}</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={language === 'ar' ? 'حالة المخزون' : 'Stock Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
            <SelectItem value="available">{language === 'ar' ? 'متوفر' : 'Available'}</SelectItem>
            <SelectItem value="low">{language === 'ar' ? 'منخفض' : 'Low Stock'}</SelectItem>
            <SelectItem value="out">{language === 'ar' ? 'نفذ' : 'Out of Stock'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ProductsList
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onManageVariants={handleManageVariants}
        selectedProducts={selectedProducts}
        onToggleSelect={handleToggleSelect}
        onAddToCompare={handleAddToCompare}
        onViewReviews={handleViewReviews}
        reviews={reviews}
      />

      {showBulkUpdate && (
        <BulkUpdateModal
          selectedProducts={selectedProducts.map(id => products.find(p => p.id === id))}
          onUpdate={handleBulkUpdate}
          onClose={() => setShowBulkUpdate(false)}
        />
      )}

      {showComparison && (
        <ProductComparison
          products={compareProducts}
          reviews={reviews}
          onClose={() => setShowComparison(false)}
          onRemove={handleRemoveFromCompare}
        />
      )}
    </div>
  );
}

export default function Products() {
  return (
    <SubscriptionGuard>
      <ProductsContent />
    </SubscriptionGuard>
  );
}