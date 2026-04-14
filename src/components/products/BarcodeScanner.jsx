import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function BarcodeScanner({ open, onClose, onScan }) {
  const { language } = useLanguage();
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (open && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "barcode-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
        },
        false
      );

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          scanner.clear();
          scannerRef.current = null;
          onClose();
        },
        (error) => {
          // Ignore scan errors
        }
      );

      scannerRef.current = scanner;
      setIsScanning(true);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [open, onScan, onClose]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {language === 'ar' ? 'مسح الباركود' : 'Scan Barcode'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div id="barcode-reader" className="w-full"></div>
          
          <div className="text-center text-sm text-slate-600">
            {language === 'ar' 
              ? 'وجّه الكاميرا نحو الباركود'
              : 'Point camera at barcode'}
          </div>

          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full"
          >
            <X className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}