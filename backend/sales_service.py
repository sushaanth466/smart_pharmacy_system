from datetime import date
from sqlalchemy.orm import Session
from models import Sales
from fefo import deduct_stock_fefo


def process_sale(
    db: Session,
    medicine_id: int,
    quantity_sold: int,
    sale_date: date,
    batch_number: str = None,
    mrp_unit_price: float = None
):
    """
    Process a sale and deduct stock using FEFO
    """

    # 1️⃣ Deduct stock
    deduct_stock_fefo(db, medicine_id, quantity_sold)

    # 2️⃣ Record sale
    sale = Sales(
        medicine_id=medicine_id,
        batch_number=batch_number,
        quantity_sold=quantity_sold,
        sale_date=sale_date,
        mrp_unit_price=mrp_unit_price
    )

    db.add(sale)
    db.commit()
    return sale
