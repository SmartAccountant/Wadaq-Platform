import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Download, X } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function BarcodeGenerator({ product, onClose }) {
  const { language } = useLanguage();
  const barcodeRef = useRef(null);

  // Generate simple barcode representation
  const generateBarcodePattern = (code) => {
    // Simple pattern: convert each digit to bars
    const patterns = {
      '0': '0001101', '1': '0011001', '2': '0010011', '3': '0111101', '4': '0100011',
      '5': '0110001', '6': '0101111', '7': '0111011', '8': '0110111', '9': '0001011'
    };
    
    let pattern = '101'; // Start guard
    const digits = (code || '').toString().padStart(12, '0').slice(0, 12);
    
    for (let i = 0; i < digits.length; i++) {
      pattern += patterns[digits[i]] || '0000000';
      if (i === 5) pattern += '01010'; // Middle guard
    }
    pattern += '101'; // End guard
    
    return pattern;
  };

  const barcode = product.barcode || product.code || product.id;
  const pattern = generateBarcodePattern(barcode);

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=400');
    const content = barcodeRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${language === 'ar' ? 'طباعة باركود' : 'Print Barcode'}</title>
          <style>
            @page { size: 4in 2in; margin: 0; }
            body { 
              margin: 0; 
              padding: 20px;
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .barcode-print {
              text-align: center;
              background: white;
              padding: 20px;
              border: 2px solid #000;
              border-radius: 8px;
            }
            .barcode-bars {
              display: flex;
              justify-content: center;
              align-items: flex-end;
              height: 80px;
              margin: 15px 0;
              gap: 1px;
            }
            .bar {
              width: 2px;
              height: 100%;
              background: black;
            }
            .space {
              width: 2px;
              height: 100%;
            }
            .product-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #000;
            }
            .barcode-number {
              font-size: 12px;
              letter-spacing: 2px;
              margin-top: 5px;
              font-family: monospace;
              color: #000;
            }
            .price {
              font-size: 16px;
              font-weight: bold;
              margin-top: 8px;
              color: #000;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    // Create canvas from barcode
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 200;
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw product name
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(product.name, canvas.width / 2, 30);
    
    // Draw barcode
    const barWidth = 2;
    let x = 50;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '1') {
        ctx.fillRect(x, 50, barWidth, 80);
      }
      x += barWidth;
    }
    
    // Draw barcode number
    ctx.font = '12px monospace';
    ctx.fillText(barcode, canvas.width / 2, 150);
    
    // Draw price
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${product.selling_price} ${language === 'ar' ? 'ر.س' : 'SAR'}`, canvas.width / 2, 180);
    
    // Download
    const link = document.createElement('a');
    link.download = `barcode-${product.code || product.id}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">
            {language === 'ar' ? '📊 الباركود' : '📊 Barcode'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div ref={barcodeRef} className="barcode-print">
            <div className="product-name">{product.name}</div>
            
            {/* Barcode Visual */}
            <div className="barcode-bars">
              {pattern.split('').map((bit, index) => (
                bit === '1' ? (
                  <div key={index} className="bar" />
                ) : (
                  <div key={index} className="space" />
                )
              ))}
            </div>
            
            <div className="barcode-number">{barcode}</div>
            <div className="price">
              {product.selling_price} {language === 'ar' ? 'ر.س' : 'SAR'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handlePrint}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Printer className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'طباعة' : 'Print'}
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'تحميل' : 'Download'}
            </Button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-4">
            💡 {language === 'ar' 
              ? 'يمكنك طباعة الباركود ولصقه على المنتج لاستخدامه في الكاشير'
              : 'Print the barcode and attach it to the product for cashier use'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}