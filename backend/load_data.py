import json
from datetime import datetime
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Medicine, Inventory, Sales


def get_or_create_medicine(db, name):
    name = name.strip().lower()
    medicine = db.query(Medicine).filter_by(name=name).first()
    if not medicine:
        medicine = Medicine(name=name)
        db.add(medicine)
        db.flush()  # get ID without commit
    return medicine


def load_purchases(db: Session, file_path: str):
    with open(file_path, "r") as f:
        purchases = json.load(f)

    for item in purchases:
        # Skip if already inserted
        exists = db.query(Inventory).filter_by(
            purchase_id=item["Purchase_ID"]
        ).first()
        if exists:
            continue

        medicine = get_or_create_medicine(db, item["Drug_Name"])

        inventory = Inventory(
    purchase_id=item["Purchase_ID"],
    medicine_id=medicine.id,
    supplier_name=item.get("Supplier_Name"),
    batch_number=item.get("Batch_Number"),
    quantity_received=item["Qty_Received"],
    quantity_available=item["Qty_Received"],
    unit_cost_price=item.get("Unit_Cost_Price"),
    total_purchase_cost=item.get("Total_Purchase_Cost"),
    date_received=(
        datetime.strptime(item["Date_Received"], "%Y-%m-%d").date()
        if item.get("Date_Received")
        else None
    ),
    expiry_date=datetime.strptime(item["Expiry_Date"], "%Y-%m-%d").date()
)


        db.add(inventory)

    db.commit()
    print("✅ Purchases loaded")


def load_sales(db: Session, file_path: str):
    with open(file_path, "r") as f:
        sales = json.load(f)

    for item in sales:
        # Skip duplicate transaction
        exists = db.query(Sales).filter_by(
            transaction_id=item["Transaction_ID"]
        ).first()
        if exists:
            continue

        medicine = get_or_create_medicine(db, item["Drug_Name"])
        qty_to_sell = item["Qty_Sold"]

        # FEFO stock deduction
        inventory_batches = (
            db.query(Inventory)
            .filter(
                Inventory.medicine_id == medicine.id,
                Inventory.quantity_available > 0
            )
            .order_by(Inventory.expiry_date)
            .all()
        )

        for batch in inventory_batches:
            if qty_to_sell <= 0:
                break

            deduct = min(batch.quantity_available, qty_to_sell)
            batch.quantity_available -= deduct
            qty_to_sell -= deduct

        sale = Sales(
            transaction_id=item["Transaction_ID"],
            medicine_id=medicine.id,
            batch_number=item.get("Batch_Number"),
            quantity_sold=item["Qty_Sold"],
            mrp_unit_price=item["MRP_Unit_Price"],
            total_amount=item["Total_Amount"],
            sale_date=datetime.strptime(item["Date"], "%Y-%m-%d").date()
        )

        db.add(sale)

    db.commit()
    print("✅ Sales loaded")


if __name__ == "__main__":
    db = SessionLocal()

    load_purchases(db, "./data/pharmacy_purchases_noisy.json")
    load_sales(db, "./data/pharmacy_sales_noisy.json")

    db.close()
    print("🎉 All data loaded successfully")
