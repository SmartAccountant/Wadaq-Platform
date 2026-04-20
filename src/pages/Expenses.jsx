import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqCore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Scan } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ExpensesList from "@/components/expenses/ExpensesList";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import OCRScanner from "@/components/expenses/OCRScanner";
import { useLanguage } from "@/components/LanguageContext";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import { isSuperAdminUser } from "@/lib/superAdmin";

const categoryLabels = {
  rent: "إيجار",
  utilities: "خدمات عامة",
  salaries: "رواتب",
  supplies: "مستلزمات",
  marketing: "تسويق",
  maintenance: "صيانة",
  transportation: "نقل ومواصلات",
  other: "أخرى",
};

function ExpensesContent() {
  const { language, t } = useLanguage();
  const [view, setView] = useState("list");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showOCR, setShowOCR] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    Wadaq.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Expense.filter({ created_by: currentUser.email }, "-date");
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => Wadaq.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setView("list");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => Wadaq.entities.Expense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setView("list");
      setSelectedExpense(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Wadaq.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const handleSave = (data) => {
    if (selectedExpense) {
      updateMutation.mutate({ id: selectedExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setView("form");
  };

  const handleDelete = (expense) => {
    if (confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      deleteMutation.mutate(expense.id);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (view === "form") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
          {selectedExpense ? (language === 'ar' ? 'تعديل المصروف' : 'Edit Expense') : (language === 'ar' ? 'مصروف جديد' : 'New Expense')}
        </h1>
        <ExpenseForm
          expense={selectedExpense}
          onSave={handleSave}
          onCancel={() => {
            setView("list");
            setSelectedExpense(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight">{language === 'ar' ? 'المصروفات' : 'Expenses'}</h1>
          <p className="text-gray-500 mt-2 text-sm font-light tracking-wide">
            {language === 'ar' ? 'إجمالي المصروفات:' : 'Total Expenses:'} <span className="font-medium text-rose-600">{totalExpenses.toLocaleString()} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {(isSuperAdminUser(currentUser) || currentUser?.role === 'admin') && (
            <Button
              onClick={() => setShowOCR(true)}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50 rounded-full px-5 gap-2"
            >
              <Scan className="w-4 h-4" />
              {language === 'ar' ? 'مسح فاتورة OCR' : 'Scan Invoice'}
            </Button>
          )}
          <Button 
            onClick={() => {
              setSelectedExpense(null);
              setView("form");
            }}
            className="bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white rounded-full px-6 font-light tracking-wide btn-glow"
          >
            <Plus className="w-5 h-5 ml-2" strokeWidth={1.5} />
            {language === 'ar' ? 'مصروف جديد' : 'New Expense'}
          </Button>
        </div>

        {showOCR && (
          <OCRScanner
            onExtracted={(data) => {
              createMutation.mutate(data);
              setShowOCR(false);
            }}
            onClose={() => setShowOCR(false)}
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue placeholder={language === 'ar' ? 'التصنيف' : 'Category'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? 'جميع التصنيفات' : 'All Categories'}</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{language === 'ar' ? label : t(key)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ExpensesList
        expenses={filteredExpenses}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default function Expenses() {
  return (
    <SubscriptionGuard>
      <ExpensesContent />
    </SubscriptionGuard>
  );
}