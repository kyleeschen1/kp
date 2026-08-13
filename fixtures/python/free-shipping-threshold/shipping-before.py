def shipping_cost(total: int) -> int:
    return 0 if total >= 50 else 5


def shipping_message(total: int) -> str:
    return "Free shipping" if total >= 50 else "Shipping: $5"
