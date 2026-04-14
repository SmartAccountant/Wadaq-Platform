import QRCode from 'npm:qrcode@1.5.3';

Deno.serve(async (req) => {
  try {
    const { 
      seller_name, 
      vat_number, 
      timestamp, 
      total_with_vat, 
      vat_amount 
    } = await req.json();

    // التحقق من البيانات المطلوبة
    if (!seller_name || !vat_number || !timestamp || total_with_vat === undefined || vat_amount === undefined) {
      return Response.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // إنشاء TLV (Tag-Length-Value) حسب معيار ZATCA
    const tlvData = [
      { tag: 1, value: seller_name },           // اسم البائع
      { tag: 2, value: vat_number },            // الرقم الضريبي
      { tag: 3, value: timestamp },             // التاريخ والوقت
      { tag: 4, value: total_with_vat.toFixed(2) },  // الإجمالي مع الضريبة
      { tag: 5, value: vat_amount.toFixed(2) }       // مبلغ الضريبة
    ];

    // تحويل إلى Base64 TLV
    let tlvString = '';
    tlvData.forEach(item => {
      const tagHex = item.tag.toString(16).padStart(2, '0');
      const valueBytes = new TextEncoder().encode(item.value.toString());
      const lengthHex = valueBytes.length.toString(16).padStart(2, '0');
      const valueHex = Array.from(valueBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      tlvString += tagHex + lengthHex + valueHex;
    });

    // تحويل hex إلى bytes ثم Base64
    const bytes = new Uint8Array(tlvString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const base64 = btoa(String.fromCharCode(...bytes));

    // توليد QR Code كـ Data URL
    const qrDataURL = await QRCode.toDataURL(base64, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return Response.json({
      qr_code: qrDataURL,
      base64_data: base64
    });

  } catch (error) {
    console.error('Error generating ZATCA QR:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});