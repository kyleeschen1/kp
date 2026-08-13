function qualifiesForFreeShipping(total: number): boolean {
  return total >= 50;
}

export function shippingCost(total: number): number {
  return qualifiesForFreeShipping(total) ? 0 : 5;
}

export function shippingMessage(total: number): string {
  return qualifiesForFreeShipping(total) ? "Free shipping" : "Shipping: $5";
}
