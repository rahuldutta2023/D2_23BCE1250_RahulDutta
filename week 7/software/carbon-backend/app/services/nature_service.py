"""nature_service.py"""

TREE_MONTHLY_KG      = 1.83
KWH_PER_CHARGE       = 0.02
HOURS_PER_CHARGE     = 5.0
GRID_FACTOR          = 0.82


def get_nature_equivalents(user_co2: float, peer_avg: float) -> dict:
    excess = max(round(user_co2 - peer_avg, 2), 0.0)
    saved  = max(round(peer_avg - user_co2, 2), 0.0)
    trees  = round(excess / TREE_MONTHLY_KG) if excess > 0 else 0
    phones = round((saved / GRID_FACTOR / KWH_PER_CHARGE) * HOURS_PER_CHARGE) if saved > 0 else 0
    return {
        "trees_to_offset":        trees,
        "smartphone_hours_saved": phones,
        "excess_kg":              excess,
        "saved_kg":               saved,
    }
