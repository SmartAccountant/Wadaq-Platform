import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Wadaq } from "@/api/WadaqCore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/components/LanguageContext";
import { format } from "date-fns";
import NotificationSoundToggle, { notificationSound } from './NotificationSound';

export default function NotificationBell() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [lastNotificationCount, setLastNotificationCount] = React.useState(0);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const user = await Wadaq.auth.me();
      return Wadaq.entities.Notification.filter(
        { user_email: user.email },
        "-created_date",
        50
      );
    },
  });

  // Play sound when new notification arrives
  React.useEffect(() => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (unreadCount > lastNotificationCount && lastNotificationCount > 0) {
      notificationSound.playSound('default');
    }
    setLastNotificationCount(unreadCount);
  }, [notifications]);

  // Real-time subscription for new notifications
  useEffect(() => {
    let unsubscribe;
    
    Wadaq.auth.me().then(user => {
      unsubscribe = Wadaq.entities.Notification.subscribe((event) => {
        if (event.type === "create" && event.data.user_email === user.email) {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (id) => Wadaq.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => 
          Wadaq.entities.Notification.update(n.id, { is_read: true })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "quotation_expiring":
        return "⏰";
      case "payment_received":
        return "💰";
      case "new_subscription":
        return "🎉";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "quotation_expiring":
        return "text-amber-600";
      case "payment_received":
        return "text-emerald-600";
      case "new_subscription":
        return "text-blue-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-rose-500 text-white text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">
            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
          </h3>
          <NotificationSoundToggle />
        </div>
        {unreadCount > 0 && (
          <div className="px-4 py-2 border-b bg-slate-50">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs w-full"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              {language === 'ar' ? 'تعليم الكل كمقروء' : 'Mark all as read'}
            </Button>
          </div>
        )}

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsReadMutation.mutate(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${getNotificationColor(notification.type)}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {format(new Date(notification.created_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}