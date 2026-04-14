import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function PWAInstallPrompt() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Update PWA manifest dynamically
    const updateManifest = async () => {
      try {
        const link = document.querySelector('link[rel="manifest"]');
        if (link) {
          // Force manifest reload with cache busting
          const timestamp = Date.now();
          link.href = `/api/updatePWAManifest?t=${timestamp}`;
        }
      } catch (error) {
        console.error('Failed to update manifest:', error);
      }
    };

    updateManifest();

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 z-50 animate-in slide-in-from-bottom">
      <Card className="border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-white shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">
                  {language === 'ar' ? 'ثبّت التطبيق' : 'Install App'}
                </h3>
                <p className="text-xs text-slate-600">
                  {language === 'ar' 
                    ? 'استخدم التطبيق دون الحاجة للمتصفح' 
                    : 'Use the app without a browser'}
                </p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {language === 'ar' ? 'تثبيت' : 'Install'}
            </Button>
            <Button variant="outline" onClick={handleDismiss} className="flex-1">
              {language === 'ar' ? 'لاحقاً' : 'Later'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}