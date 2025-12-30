import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.database import SessionLocal
from backend.models import Medicine, Sales
from backend.stock_utils import get_current_stock


def suggest_reorders(days=30, safety_stock=20):
    db = SessionLocal()
    print("\n📦 REORDER SUGGESTIONS\n")

    for med in db.query(Medicine).all():
        sales = db.query(Sales).filter(Sales.medicine_id == med.id).all()
        if len(sales) < 2:
            continue

        total_sold = sum(s.quantity_sold for s in sales)
        active_days = len(set(s.sale_date for s in sales))
        velocity = total_sold / active_days

        predicted = int(velocity * days)
        current_stock, _ = get_current_stock(db, med.id)

        if current_stock < predicted + safety_stock:
            print(f"⚠️ {med.name}")
            print(f"   Stock: {current_stock}")
            print(f"   Predicted: {predicted}")
            print(f"   Reorder: {predicted + safety_stock - current_stock}")
            print("-" * 40)

    db.close()


if __name__ == "__main__":
    suggest_reorders()
