import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Trash2, Send, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const statusMap = {
  draft: { label: "مسودة", color: "bg-slate-100 text-slate-700" },
  sent: { label: "مرسلة", color: "bg-blue-100 text-blue-700" },
  paid: { label: "مدفوعة", color: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "متأخرة", color: "bg-rose-100 text-rose-700" },
  cancelled: { label: "ملغية", color: "bg-slate-100 text-slate-500" },
};

export default function InvoicesList({ invoices = [], onView, onEdit, onDelete, onStatusChange }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    import("@/api/WadaqCore").then(({ Wadaq }) => {
      Wadaq.auth.me().then(setUser).catch(() => {});
    });
  }, []);

  const handleWhatsAppShare = (invoice, e) => {
    e.stopPropagation();
    const companyName = user?.company_name || 'شركتنا';
    const invoiceLink = `${window.location.origin}${window.location.pathname}?page=Invoices&invoice=${invoice.id}`;
    const message = `مرحباً ${invoice.customer_name}، إليك فاتورتك رقم ${invoice.invoice_number} من ${companyName}. اطلع عليها هنا: ${invoiceLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  if (invoices.length === 0) {
    return (
      <Card className="p-12 text-center bg-white border-0 shadow-sm">
        <p className="text-slate-500">لا توجد فواتير بعد</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm text-slate-500">{invoice.invoice_number}</span>
                <Badge className={`${statusMap[invoice.status]?.color} border-0 font-normal`}>
                  {statusMap[invoice.status]?.label}
                </Badge>
              </div>
              <p className="font-semibold text-slate-800">{invoice.customer_name}</p>
              <p className="text-sm text-slate-500">
                {invoice.date && format(new Date(invoice.date), "d MMMM yyyy", { locale: ar })}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-2xl font-bold text-slate-800">{invoice.total?.toLocaleString()}</p>
                <p className="text-sm text-slate-500">ر.س</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(invoice)}>
                    <Eye className="w-4 h-4 ml-2" />
                    عرض
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(invoice)}>
                    <Edit className="w-4 h-4 ml-2" />
                    تعديل
                  </DropdownMenuItem>
                  {invoice.status === "draft" && (
                    <DropdownMenuItem onClick={() => onStatusChange(invoice, "sent")}>
                      <Send className="w-4 h-4 ml-2" />
                      إرسال
                    </DropdownMenuItem>
                  )}
                  {invoice.status === "sent" && (
                    <DropdownMenuItem onClick={() => onStatusChange(invoice, "paid")}>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      تم الدفع
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => onDelete(invoice)}
                    className="text-rose-600 focus:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}