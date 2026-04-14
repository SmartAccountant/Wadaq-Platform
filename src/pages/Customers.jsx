import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CustomersList from "@/components/customers/CustomersList";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomerDetails from "@/components/customers/CustomerDetails";
import { useLanguage } from "@/components/LanguageContext";
import Swal from "sweetalert2";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";

function CustomersContent() {
  const { language } = useLanguage();
  const [view, setView] = useState("list");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Customer.filter({ created_by: currentUser.email }, "-created_date");
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      return Wadaq.entities.Invoice.filter({ created_by: currentUser.email }, "-created_date");
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => Wadaq.entities.Customer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setView("list");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => Wadaq.entities.Customer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setView("list");
      setSelectedCustomer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Wadaq.entities.Customer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const handleSave = (data) => {
    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setView("form");
  };

  const handleDelete = (customer) => {
    Swal.fire({
      title: language === 'ar' ? 'حذف العميل؟' : 'Delete Customer?',
      text: language === 'ar' 
        ? `هل أنت متأكد من حذف ${customer.name}؟ لا يمكن التراجع عن هذا الإجراء.`
        : `Are you sure you want to delete ${customer.name}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: language === 'ar' ? 'نعم، احذف' : 'Yes, delete',
      cancelButtonText: language === 'ar' ? 'إلغاء' : 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(customer.id);
        Swal.fire({
          title: language === 'ar' ? 'تم الحذف!' : 'Deleted!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setView("details");
  };

  const handleUpdateNotes = async (notes) => {
    if (selectedCustomer) {
      await updateMutation.mutateAsync({ 
        id: selectedCustomer.id, 
        data: { ...selectedCustomer, notes } 
      });
      setSelectedCustomer({ ...selectedCustomer, notes });
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    
    const customerInvoices = invoices.filter(inv => 
      inv.customer_id === customer.id || inv.customer_name === customer.name
    );
    
    if (filterStatus === "active") return matchesSearch && customerInvoices.length > 0;
    if (filterStatus === "inactive") return matchesSearch && customerInvoices.length === 0;
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (view === "form") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
          {selectedCustomer ? (language === 'ar' ? 'تعديل العميل' : 'Edit Customer') : (language === 'ar' ? 'عميل جديد' : 'New Customer')}
        </h1>
        <CustomerForm
          customer={selectedCustomer}
          onSave={handleSave}
          onCancel={() => {
            setView("list");
            setSelectedCustomer(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  if (view === "details") {
    return (
      <CustomerDetails
        customer={selectedCustomer}
        invoices={invoices}
        onClose={() => {
          setView("list");
          setSelectedCustomer(null);
        }}
        onUpdateNotes={handleUpdateNotes}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight">{language === 'ar' ? 'العملاء' : 'Customers'}</h1>
          <p className="text-gray-500 mt-2 text-sm font-light tracking-wide">{language === 'ar' ? 'إدارة بيانات العملاء' : 'Manage Customer Data'}</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedCustomer(null);
            setView("form");
          }}
          className="bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white rounded-full px-6 font-light tracking-wide btn-glow"
        >
          <Plus className="w-5 h-5 ml-2" strokeWidth={1.5} />
          {language === 'ar' ? 'عميل جديد' : 'New Customer'}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={language === 'ar' ? 'بحث بالاسم أو الهاتف أو البريد...' : 'Search by name, phone or email...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{language === 'ar' ? 'جميع العملاء' : 'All Customers'}</option>
          <option value="active">{language === 'ar' ? 'عملاء نشطين' : 'Active Customers'}</option>
          <option value="inactive">{language === 'ar' ? 'عملاء غير نشطين' : 'Inactive Customers'}</option>
        </select>
      </div>

      <CustomersList
        customers={filteredCustomers}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default function Customers() {
  return (
    <SubscriptionGuard>
      <CustomersContent />
    </SubscriptionGuard>
  );
}