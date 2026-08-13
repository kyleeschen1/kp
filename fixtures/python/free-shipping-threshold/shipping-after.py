def qualifies_for_free_shipping(total: int) -> bool:
    return total >= 50


def shipping_cost(total: int) -> int:
    return 0 if qualifies_for_free_shipping(total) else 5


def shipping_message(total: int) -> str:
    return "Free shipping" if qualifies_for_free_shipping(total) else "Shipping: $5"
