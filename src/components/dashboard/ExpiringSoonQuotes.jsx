import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ExpiringSoonQuotes({ quotations }) {
  const { language } = useLanguage();

  // Get quotes expiring within 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const expiringSoon = quotations.filter(quote => {
    if (!quote.valid_until || quote.status === 'expired' || quote.status === 'converted') {
      return false;
    }
    
    const validUntil = new Date(quote.valid_until);
    validUntil.setHours(0, 0, 0, 0);
    
    return validUntil >= today && validUntil <= sevenDaysFromNow;
  });

  if (expiringSoon.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-900">
            {language === 'ar' ? 'عروض أسعار تنتهي قريباً' : 'Expiring Soon Quotations'}
          </CardTitle>
          <Badge className="bg-orange-600 text-white">{expiringSoon.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {expiringSoon.map(quote => {
          const validUntil = new Date(quote.valid_until);
          const daysRemaining = Math.ceil((validUntil - today) / (1000 * 60 * 60 * 24));
          
          return (
            <Link 
              key={quote.id}
              to={createPageUrl("Quotations")}
              className="block p-3 bg-white rounded-lg border border-orange-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{quote.quote_number}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                    <User className="w-3 h-3" />
                    <span>{quote.customer_name}</span>
                  </div>
                </div>
                <div className="text-left">
                  <Badge className="bg-orange-100 text-orange-700 text-xs">
                    {daysRemaining === 0 
                      ? (language === 'ar' ? 'ينتهي اليوم' : 'Expires today')
                      : `${daysRemaining} ${language === 'ar' ? 'يوم' : 'days'}`
                    }
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1">
                    {format(validUntil, "d MMM", { locale: language === 'ar' ? ar : undefined })}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}