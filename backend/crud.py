from sqlalchemy.orm import Session
from models import Medicine, Sales
from datetime import datetime


def get_or_create_medicine(db: Session, name: str, category: str, manufacturer: str):
    medicine = db.query(Medicine).filter(Medicine.name == name).first()
    if medicine:
        return medicine

    medicine = Medicine(
        name=name,
        category=category,
        manufacturer=manufacturer
    )
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return medicine


def create_sale(
    db: Session,
    medicine_id: int,
    sale_date: datetime,
    quantity: int
):
    sale = Sales(
        medicine_id=medicine_id,
        sale_date=sale_date,
        quantity_sold=quantity
    )
    db.add(sale)
    db.commit()



from models import Inventory
from datetime import date, timedelta
import random


def add_inventory_stock(db, medicine_id: int, quantity: int, category: str):
    # Simulated expiry logic
    if category.lower() == "tablet":
        expiry_days = 540
    elif category.lower() == "syrup":
        expiry_days = 365
    else:
        expiry_days = 270

    expiry_date = date.today() + timedelta(days=expiry_days)

    inventory = Inventory(
        medicine_id=medicine_id,
        batch_number=f"BATCH-{random.randint(1000,9999)}",
        expiry_date=expiry_date,
        quantity=quantity,
        created_at=date.today()
    )

    db.add(inventory)
    db.commit()
