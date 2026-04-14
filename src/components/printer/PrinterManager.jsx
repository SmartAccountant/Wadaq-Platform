import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Bluetooth, Wifi, Usb, Plus, Trash2, Check, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { Wadaq } from "@/api/WadaqClient";

export default function PrinterManager() {
  const { language } = useLanguage();
  const [printers, setPrinters] = useState([]);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(null);

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      const user = await Wadaq.auth.me();
      const saved = localStorage.getItem(`printers_${user.email}`);
      if (saved) {
        setPrinters(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading printers:", error);
    }
  };

  const savePrinters = async (newPrinters) => {
    try {
      const user = await Wadaq.auth.me();
      localStorage.setItem(`printers_${user.email}`, JSON.stringify(newPrinters));
      setPrinters(newPrinters);
    } catch (error) {
      console.error("Error saving printers:", error);
    }
  };

  const addPrinter = (printer) => {
    const newPrinters = [...printers, { ...printer, id: Date.now().toString() }];
    savePrinters(newPrinters);
    setShowAddPrinter(false);
  };

  const removePrinter = (id) => {
    const newPrinters = printers.filter(p => p.id !== id);
    savePrinters(newPrinters);
  };

  const testPrinter = (printer) => {
    setTestingPrinter(printer.id);

    const testHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>اختبار طابعة</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    body { font-family: 'Courier New', Arial, monospace; margin: 0; padding: 8px; background: white; color: #000; font-size: 12px; line-height: 1.5; width: 80mm; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size:16px; margin-bottom:8px;">اختبار الطابعة</div>
  <div class="center" style="font-size:11px;">Printer Test - ${printer.name}</div>
  <div class="divider"></div>
  <div class="row"><span>رقم الفاتورة:</span><span>TEST-001</span></div>
  <div class="row"><span>التاريخ:</span><span>${new Date().toLocaleDateString('ar-SA')}</span></div>
  <div class="row"><span>العميل:</span><span>عميل تجريبي</span></div>
  <div class="divider"></div>
  <div class="row"><span>منتج تجريبي × 1</span><span>100.00 ر.س</span></div>
  <div class="divider"></div>
  <div class="row"><span>المجموع الفرعي:</span><span>100.00 ر.س</span></div>
  <div class="row"><span>ضريبة 15%:</span><span>15.00 ر.س</span></div>
  <div class="row bold" style="font-size:14px; border-top: 2px solid #000; padding-top:5px; margin-top:5px;">
    <span>الإجمالي:</span><span>115.00 ر.س</span>
  </div>
  <div class="divider"></div>
  <div class="center" style="font-size:10px; margin-top:8px;">✓ الطابعة تعمل بشكل صحيح</div>
  <div class="center" style="font-size:10px;">${printer.type === 'network' ? 'IP: ' + printer.ipAddress : printer.type}</div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:80mm;height:200mm;border:0;';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(testHtml);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        setTestingPrinter(null);
      }, 1000);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {language === 'ar' ? 'إدارة الطابعات' : 'Printer Management'}
        </h2>
        <Button onClick={() => setShowAddPrinter(true)}>
          <Plus className="w-4 h-4 ml-2" />
          {language === 'ar' ? 'إضافة طابعة' : 'Add Printer'}
        </Button>
      </div>

      {printers.length === 0 && !showAddPrinter && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Printer className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 mb-4">
              {language === 'ar' ? 'لم يتم إضافة طابعات بعد' : 'No printers added yet'}
            </p>
            <Button onClick={() => setShowAddPrinter(true)}>
              <Plus className="w-4 h-4 ml-2" />
              {language === 'ar' ? 'إضافة أول طابعة' : 'Add First Printer'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {printers.map(printer => (
          <Card key={printer.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {printer.type === 'bluetooth' && <Bluetooth className="w-6 h-6 text-blue-500" />}
                  {printer.type === 'network' && <Wifi className="w-6 h-6 text-emerald-500" />}
                  {printer.type === 'usb' && <Usb className="w-6 h-6 text-purple-500" />}
                  
                  <div>
                    <h3 className="font-semibold">{printer.name}</h3>
                    <p className="text-sm text-slate-600">
                      {printer.type === 'bluetooth' && (printer.deviceId || language === 'ar' ? 'بلوتوث' : 'Bluetooth')}
                      {printer.type === 'network' && printer.ipAddress}
                      {printer.type === 'usb' && (language === 'ar' ? 'USB متصل' : 'USB Connected')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testPrinter(printer)}
                    disabled={testingPrinter === printer.id}
                  >
                    {testingPrinter === printer.id ? (
                      language === 'ar' ? 'جاري الاختبار...' : 'Testing...'
                    ) : (
                      language === 'ar' ? 'اختبار' : 'Test'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePrinter(printer.id)}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAddPrinter && (
        <AddPrinterDialog
          onAdd={addPrinter}
          onCancel={() => setShowAddPrinter(false)}
          language={language}
        />
      )}
    </div>
  );
}

function AddPrinterDialog({ onAdd, onCancel, language }) {
  const [printerData, setPrinterData] = useState({
    name: '',
    type: 'bluetooth',
    ipAddress: '',
    port: '9100',
    deviceId: ''
  });

  const connectBluetooth = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['battery_service']
      });
      
      setPrinterData(prev => ({
        ...prev,
        deviceId: device.id,
        name: device.name || language === 'ar' ? 'طابعة بلوتوث' : 'Bluetooth Printer'
      }));
    } catch (error) {
      alert(language === 'ar' ? `فشل الاتصال بالبلوتوث: ${error.message}` : `Bluetooth connection failed: ${error.message}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!printerData.name.trim()) {
      alert(language === 'ar' ? 'يرجى إدخال اسم الطابعة' : 'Please enter printer name');
      return;
    }
    onAdd(printerData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {language === 'ar' ? 'إضافة طابعة جديدة' : 'Add New Printer'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'نوع الاتصال' : 'Connection Type'}</Label>
            <Select value={printerData.type} onValueChange={(value) => setPrinterData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bluetooth">
                  <div className="flex items-center gap-2">
                    <Bluetooth className="w-4 h-4" />
                    {language === 'ar' ? 'بلوتوث' : 'Bluetooth'}
                  </div>
                </SelectItem>
                <SelectItem value="network">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    {language === 'ar' ? 'شبكة (WiFi/LAN)' : 'Network (WiFi/LAN)'}
                  </div>
                </SelectItem>
                <SelectItem value="usb">
                  <div className="flex items-center gap-2">
                    <Usb className="w-4 h-4" />
                    USB
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {printerData.type === 'bluetooth' && (
            <>
              <Button type="button" onClick={connectBluetooth} className="w-full">
                <Bluetooth className="w-4 h-4 ml-2" />
                {language === 'ar' ? 'البحث عن أجهزة بلوتوث' : 'Search Bluetooth Devices'}
              </Button>
              {printerData.deviceId && (
                <div className="text-sm text-emerald-600 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {language === 'ar' ? 'تم الاتصال' : 'Connected'}
                </div>
              )}
            </>
          )}

          {printerData.type === 'network' && (
            <>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'عنوان IP' : 'IP Address'}</Label>
                <Input
                  placeholder="192.168.1.100"
                  value={printerData.ipAddress}
                  onChange={(e) => setPrinterData(prev => ({ ...prev, ipAddress: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'المنفذ (Port)' : 'Port'}</Label>
                <Input
                  placeholder="9100"
                  value={printerData.port}
                  onChange={(e) => setPrinterData(prev => ({ ...prev, port: e.target.value }))}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>{language === 'ar' ? 'اسم الطابعة' : 'Printer Name'}</Label>
            <Input
              placeholder={language === 'ar' ? 'مثال: طابعة الكاشير الرئيسية' : 'e.g., Main Cashier Printer'}
              value={printerData.name}
              onChange={(e) => setPrinterData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Check className="w-4 h-4 ml-2" />
              {language === 'ar' ? 'إضافة' : 'Add'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 ml-2" />
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}