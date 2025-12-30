from datetime import date
from backend.models import Inventory


def get_current_stock(db, medicine_id):
    today = date.today()

    batches = (
        db.query(Inventory)
        .filter(
            Inventory.medicine_id == medicine_id,
            Inventory.expiry_date >= today,
            Inventory.quantity_available > 0,
        )
        .order_by(Inventory.expiry_date.asc())
        .all()
    )

    total_stock = sum(b.quantity_available for b in batches)
    return total_stock, batches
