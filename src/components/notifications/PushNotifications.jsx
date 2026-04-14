import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

/**
 * ملاحظة: لتفعيل إشعارات Push Notifications:
 * 1. إنشاء مشروع Firebase
 * 2. الحصول على مفاتيح Firebase (API Key, Project ID, etc.)
 * 3. إضافة المفاتيح إلى ملف .env
 * 4. إنشاء Service Worker للإشعارات
 * 5. تفعيل Firebase Cloud Messaging
 * 
 * حالياً: يطلب إذن الإشعارات فقط بدون تفعيل كامل
 */

export default function PushNotifications() {
  const { language } = useLanguage();
  const [permission, setPermission] = useState(Notification.permission);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // هنا يمكن إضافة كود Firebase Cloud Messaging
        new Notification(
          language === 'ar' ? 'تم تفعيل الإشعارات' : 'Notifications Enabled',
          {
            body: language === 'ar' 
              ? 'سيتم إرسال إشعارات عند وجود تحديثات جديدة'
              : 'You will receive notifications for new updates',
            icon: '/icon-192x192.png'
          }
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  if (!isSupported) {
    return null;
  }

  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <Bell className="w-4 h-4" />
        <span>{language === 'ar' ? 'الإشعارات مفعّلة' : 'Notifications On'}</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <BellOff className="w-4 h-4" />
        <span className="text-xs">
          {language === 'ar' 
            ? 'الإشعارات محظورة - فعّلها من إعدادات المتصفح'
            : 'Notifications blocked - enable in browser settings'}
        </span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={requestPermission}
      className="text-xs"
    >
      <Bell className="w-3 h-3 ml-1" />
      {language === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}
    </Button>
  );
}