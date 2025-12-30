from database import SessionLocal
from models import Sales, Medicine
from crud import add_inventory_stock

db = SessionLocal()

sales = db.query(Sales).all()

for sale in sales:
    medicine = db.query(Medicine).filter(Medicine.id == sale.medicine_id).first()

    # Simulate stock arrival BEFORE sale
    add_inventory_stock(
        db,
        medicine_id=medicine.id,
        quantity=sale.quantity_sold + 20,
        category=medicine.category
    )

db.close()
print("✅ Inventory built successfully")
