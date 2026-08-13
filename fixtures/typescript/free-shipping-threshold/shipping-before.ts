export function shippingCost(total: number): number {
  return total >= 50 ? 0 : 5;
}

export function shippingMessage(total: number): string {
  return total >= 50 ? "Free shipping" : "Shipping: $5";
}
