export function decimalsByPrice(price: number | null, assetClass: string): number {
  if (assetClass === 'commodity_fx') return 4;
  if (assetClass === 'crypto') {
    if (price == null || price >= 100) return 2;
    if (price >= 1) return 4;
    return 6;
  }
  return 2;
}
