import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save } from "lucide-react";
import { format, addYears, addMonths } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";

export default function AddManualSubscriptionModal({ open, onClose, user, onSave, isLoading }) {
  const { language } = useLanguage();
  const [subscriptionData, setSubscriptionData] = useState({
    subscription_status: "active",
    trial_end_date: addYears(new Date(), 1).toISOString().split('T')[0],
    payment_amount: "",
    payment_notes: "",
  });

  // Update form data when user changes
  React.useEffect(() => {
    if (user) {
      setSubscriptionData({
        subscription_status: user.subscription_status || "active",
        trial_end_date: user.trial_end_date 
          ? new Date(user.trial_end_date).toISOString().split('T')[0]
          : addYears(new Date(), 1).toISOString().split('T')[0],
        payment_amount: user.last_payment_amount || "",
        payment_notes: user.payment_notes || "",
      });
    }
  }, [user]);

  const handleSave = () => {
    const dataToSave = {
      ...subscriptionData,
      last_payment_amount: subscriptionData.payment_amount,
      last_payment_date: new Date().toISOString().split('T')[0]
    };
    onSave(dataToSave);
  };

  const handleQuickDate = (months) => {
    const newDate = addMonths(new Date(), months);
    setSubscriptionData({
      ...subscriptionData,
      trial_end_date: newDate.toISOString().split('T')[0]
    });
  };

  const handleExtendSubscription = (months) => {
    // Extend from current expiry date
    const currentExpiry = subscriptionData.trial_end_date 
      ? new Date(subscriptionData.trial_end_date)
      : new Date();
    const newDate = addMonths(currentExpiry, months);
    setSubscriptionData({
      ...subscriptionData,
      trial_end_date: newDate.toISOString().split('T')[0]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            {language === 'ar' ? 'إدارة الاشتراك' : 'Manage Subscription'}
          </DialogTitle>
        </DialogHeader>

        {user && (
          <div className="space-y-4">
            {/* User Info */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-500">{language === 'ar' ? 'المستخدم' : 'User'}</p>
              <p className="font-medium text-slate-800">{user.full_name}</p>
              <p className="text-sm text-slate-600" dir="ltr">{user.email}</p>
            </div>

            {/* Subscription Status */}
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'حالة الاشتراك' : 'Subscription Status'}</Label>
              <Select
                value={subscriptionData.subscription_status}
                onValueChange={(value) => setSubscriptionData({ ...subscriptionData, subscription_status: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={language === 'ar' ? 'اختر الحالة' : 'Select status'} />
                </SelectTrigger>
                <SelectContent className="bg-white z-[9999]">
                  <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="unlimited">{language === 'ar' ? 'غير محدود' : 'Unlimited'}</SelectItem>
                  <SelectItem value="founder">{language === 'ar' ? 'مؤسس' : 'Founder'}</SelectItem>
                  <SelectItem value="trial">{language === 'ar' ? 'تجريبي' : 'Trial'}</SelectItem>
                  <SelectItem value="expired">{language === 'ar' ? 'منتهي' : 'Expired'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Date Buttons */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'تعيين تاريخ انتهاء جديد (من اليوم)' : 'Set New Expiry (from today)'}</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDate(1)}
                    className="text-xs"
                  >
                    {language === 'ar' ? 'شهر' : '1 Month'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDate(6)}
                    className="text-xs"
                  >
                    {language === 'ar' ? '6 أشهر' : '6 Months'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDate(12)}
                    className="text-xs"
                  >
                    {language === 'ar' ? 'سنة' : '1 Year'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDate(36)}
                    className="text-xs"
                  >
                    {language === 'ar' ? '3 سنوات' : '3 Years'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-emerald-600">{language === 'ar' ? '⚡ تمديد الاشتراك الحالي' : '⚡ Extend Current Subscription'}</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExtendSubscription(1)}
                    className="text-xs border-emerald-200 hover:bg-emerald-50"
                  >
                    + {language === 'ar' ? 'شهر' : '1 M'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExtendSubscription(3)}
                    className="text-xs border-emerald-200 hover:bg-emerald-50"
                  >
                    + {language === 'ar' ? '3 أشهر' : '3 M'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExtendSubscription(6)}
                    className="text-xs border-emerald-200 hover:bg-emerald-50"
                  >
                    + {language === 'ar' ? '6 أشهر' : '6 M'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExtendSubscription(12)}
                    className="text-xs border-emerald-200 hover:bg-emerald-50"
                  >
                    + {language === 'ar' ? 'سنة' : '1 Y'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'تاريخ انتهاء الاشتراك' : 'Subscription Expiry Date'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal">
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {subscriptionData.trial_end_date
                      ? format(new Date(subscriptionData.trial_end_date), "PPP", { locale: language === 'ar' ? ar : undefined })
                      : (language === 'ar' ? 'اختر التاريخ' : 'Pick a date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={subscriptionData.trial_end_date ? new Date(subscriptionData.trial_end_date) : undefined}
                    onSelect={(date) => 
                      setSubscriptionData({ 
                        ...subscriptionData, 
                        trial_end_date: date ? date.toISOString().split('T')[0] : "" 
                      })
                    }
                    disabled={(date) => date < new Date("1900-01-01")}
                    fromYear={2020}
                    toYear={2050}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'المبلغ المدفوع (اختياري)' : 'Payment Amount (Optional)'}</Label>
              <Input
                type="number"
                placeholder={language === 'ar' ? 'المبلغ بالريال' : 'Amount in SAR'}
                value={subscriptionData.payment_amount}
                onChange={(e) => setSubscriptionData({ ...subscriptionData, payment_amount: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}</Label>
              <Input
                placeholder={language === 'ar' ? 'ملاحظات حول الدفع...' : 'Payment notes...'}
                value={subscriptionData.payment_notes}
                onChange={(e) => setSubscriptionData({ ...subscriptionData, payment_notes: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 sticky bottom-0 bg-white pb-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="w-4 h-4 ml-2" />
                {isLoading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ الاشتراك' : 'Save Subscription')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}