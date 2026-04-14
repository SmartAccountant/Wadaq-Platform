const VAT_RATE = 0.15;

/** السعر الإجمالي يُفترض أنه شامل ضريبة 15% */
export function computeVat15Inclusive(totalIncl) {
  const total = Number(totalIncl) || 0;
  const net = total / (1 + VAT_RATE);
  const vat = total - net;
  return {
    net: Math.round(net * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export { VAT_RATE };
