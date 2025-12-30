from datetime import date
from sqlalchemy.orm import Session
from models import Inventory


def deduct_stock_fefo(
    db: Session,
    medicine_id: int,
    quantity_to_deduct: int
):
    """
    Deduct stock using FEFO (First Expiry First Out)
    """

    today = date.today()

    # Get valid batches sorted by earliest expiry
    batches = (
        db.query(Inventory)
        .filter(
            Inventory.medicine_id == medicine_id,
            Inventory.expiry_date >= today,
            Inventory.quantity_available > 0
        )
        .order_by(Inventory.expiry_date.asc())
        .all()
    )

    remaining = quantity_to_deduct

    for batch in batches:
        if remaining <= 0:
            break

        if batch.quantity_available >= remaining:
            batch.quantity_available -= remaining
            remaining = 0
        else:
            remaining -= batch.quantity_available
            batch.quantity_available = 0

    if remaining > 0:
        raise ValueError("❌ Not enough non-expired stock available")

    db.commit()
    return True
