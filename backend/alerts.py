from datetime import date, timedelta
from database import SessionLocal
from models import Inventory


def expiry_alerts(days=30):
    db = SessionLocal()
    today = date.today()
    limit = today + timedelta(days=days)

    print("\n⏰ EXPIRY ALERTS\n")

    items = (
        db.query(Inventory)
        .filter(
            Inventory.expiry_date <= limit,
            Inventory.quantity_available > 0
        )
        .order_by(Inventory.expiry_date)
        .all()
    )

    for i in items:
        print(
            f"⚠️ {i.medicine.name} | "
            f"Batch {i.batch_number} | "
            f"Qty {i.quantity_available} | "
            f"Exp {i.expiry_date}"
        )

    db.close()


if __name__ == "__main__":
    expiry_alerts()
