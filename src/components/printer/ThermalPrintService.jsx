/**
 * خدمة الطباعة الحرارية المباشرة
 * تدعم ESC/POS protocol للطابعات الحرارية
 * يدعم الاتصال عبر: Bluetooth, Network (WiFi/LAN), USB
 */

// أوامر ESC/POS
const ESC = '\x1B';
const GS = '\x1D';

const Commands = {
  INIT: ESC + '@',
  FEED: ESC + 'd',
  CUT: GS + 'V' + '\x41' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  SIZE_NORMAL: GS + '!' + '\x00',
  SIZE_DOUBLE: GS + '!' + '\x11',
  SIZE_LARGE: GS + '!' + '\x22',
  LINE: '--------------------------------\n'
};

class ThermalPrintService {
  constructor() {
    this.encoder = new TextEncoder();
  }

  // تحويل النص إلى bytes
  encode(text) {
    return this.encoder.encode(text);
  }

  // إنشاء فاتورة حرارية
  createReceipt(invoice, companyInfo = {}, language = 'ar') {
    let receipt = Commands.INIT;

    // الشعار والعنوان
    receipt += Commands.ALIGN_CENTER;
    receipt += Commands.SIZE_DOUBLE;
    receipt += Commands.BOLD_ON;
    receipt += (companyInfo.name || 'المحاسب الذكي') + '\n';
    receipt += Commands.BOLD_OFF;
    receipt += Commands.SIZE_NORMAL;
    
    if (companyInfo.address) {
      receipt += companyInfo.address + '\n';
    }
    if (companyInfo.phone) {
      receipt += (language === 'ar' ? 'هاتف: ' : 'Tel: ') + companyInfo.phone + '\n';
    }
    if (companyInfo.vat_number) {
      receipt += (language === 'ar' ? 'ض.ق.م: ' : 'VAT: ') + companyInfo.vat_number + '\n';
    }

    receipt += Commands.LINE;
    receipt += Commands.ALIGN_LEFT;

    // معلومات الفاتورة
    receipt += Commands.BOLD_ON;
    receipt += (language === 'ar' ? 'فاتورة #' : 'Invoice #') + invoice.invoice_number + '\n';
    receipt += Commands.BOLD_OFF;
    receipt += (language === 'ar' ? 'التاريخ: ' : 'Date: ') + invoice.date + '\n';
    receipt += (language === 'ar' ? 'العميل: ' : 'Customer: ') + invoice.customer_name + '\n';
    receipt += Commands.LINE;

    // البنود
    receipt += Commands.BOLD_ON;
    receipt += this.padText(language === 'ar' ? 'الصنف' : 'Item', 16) + ' ';
    receipt += this.padText(language === 'ar' ? 'ك' : 'Q', 3, 'right') + ' ';
    receipt += this.padText(language === 'ar' ? 'السعر' : 'Price', 6, 'right') + ' ';
    receipt += this.padText(language === 'ar' ? 'المجموع' : 'Total', 7, 'right') + '\n';
    receipt += Commands.BOLD_OFF;
    receipt += Commands.LINE;

    invoice.items?.forEach(item => {
      const name = (item.product_name || item.name || '').substring(0, 16);
      const qty = item.quantity.toString();
      const price = item.price.toFixed(2);
      const total = item.total.toFixed(2);

      receipt += this.padText(name, 16) + ' ';
      receipt += this.padText(qty, 3, 'right') + ' ';
      receipt += this.padText(price, 6, 'right') + ' ';
      receipt += this.padText(total, 7, 'right') + '\n';
    });

    receipt += Commands.LINE;

    // المجاميع
    receipt += this.padText(language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:', 20) + ' ';
    receipt += this.padText(invoice.subtotal.toFixed(2), 12, 'right') + '\n';

    if (invoice.apply_vat && invoice.tax_amount > 0) {
      receipt += this.padText(language === 'ar' ? 'ض.ق.م 15%:' : 'VAT 15%:', 20) + ' ';
      receipt += this.padText(invoice.tax_amount.toFixed(2), 12, 'right') + '\n';
    }

    if (invoice.discount > 0) {
      receipt += this.padText(language === 'ar' ? 'الخصم:' : 'Discount:', 20) + ' ';
      receipt += this.padText('-' + invoice.discount.toFixed(2), 12, 'right') + '\n';
    }

    receipt += Commands.LINE;
    receipt += Commands.SIZE_DOUBLE;
    receipt += Commands.BOLD_ON;
    receipt += this.padText(language === 'ar' ? 'الإجمالي:' : 'TOTAL:', 16) + ' ';
    receipt += this.padText(invoice.total.toFixed(2), 16, 'right') + '\n';
    receipt += Commands.BOLD_OFF;
    receipt += Commands.SIZE_NORMAL;
    receipt += Commands.LINE;

    // الملاحظات
    if (invoice.notes) {
      receipt += Commands.ALIGN_CENTER;
      receipt += invoice.notes.substring(0, 100) + '\n';
      receipt += Commands.ALIGN_LEFT;
      receipt += Commands.LINE;
    }

    // التذييل
    receipt += Commands.ALIGN_CENTER;
    receipt += (language === 'ar' ? 'شكراً لزيارتكم' : 'Thank You') + '\n';
    receipt += 'RikazAi.com\n';
    
    // قص الورق
    receipt += Commands.FEED + '\x05';
    receipt += Commands.CUT;

    return this.encode(receipt);
  }

  // محاذاة النص
  padText(text, length, align = 'left') {
    text = text.toString();
    if (text.length > length) return text.substring(0, length);
    
    const spaces = ' '.repeat(length - text.length);
    if (align === 'right') return spaces + text;
    if (align === 'center') {
      const leftSpaces = Math.floor((length - text.length) / 2);
      const rightSpaces = length - text.length - leftSpaces;
      return ' '.repeat(leftSpaces) + text + ' '.repeat(rightSpaces);
    }
    return text + spaces;
  }

  // الطباعة عبر Bluetooth
  async printViaBluetooth(receiptData, deviceId) {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      // إرسال البيانات على دفعات (chunk size = 20 bytes)
      const chunkSize = 20;
      for (let i = 0; i < receiptData.length; i += chunkSize) {
        const chunk = receiptData.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
        await new Promise(resolve => setTimeout(resolve, 50)); // تأخير صغير بين الدفعات
      }

      return true;
    } catch (error) {
      console.error('Bluetooth print error:', error);
      throw error;
    }
  }

  // الطباعة عبر الشبكة (Network)
  async printViaNetwork(receiptData, ipAddress, port = 9100) {
    try {
      // محاولة الاتصال عبر WebSocket أو HTTP
      const response = await fetch(`http://${ipAddress}:${port}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: receiptData
      });

      if (!response.ok) {
        throw new Error('Network print failed');
      }

      return true;
    } catch (error) {
      console.error('Network print error:', error);
      throw error;
    }
  }

  // الطباعة عبر USB (Web Serial API)
  async printViaUSB(receiptData) {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });

      const writer = port.writable.getWriter();
      await writer.write(receiptData);
      await writer.close();

      await port.close();
      return true;
    } catch (error) {
      console.error('USB print error:', error);
      throw error;
    }
  }
}

// تصدير instance واحد
const thermalPrintService = new ThermalPrintService();

// إضافة الدالة للنافذة العامة
window.printToThermal = async (invoice, printer, companyInfo = {}, language = 'ar') => {
  const receiptData = thermalPrintService.createReceipt(invoice, companyInfo, language);

  switch (printer.type) {
    case 'bluetooth':
      return await thermalPrintService.printViaBluetooth(receiptData, printer.deviceId);
    
    case 'network':
      return await thermalPrintService.printViaNetwork(receiptData, printer.ipAddress, printer.port);
    
    case 'usb':
      return await thermalPrintService.printViaUSB(receiptData);
    
    default:
      throw new Error('Unsupported printer type');
  }
};

export default thermalPrintService;