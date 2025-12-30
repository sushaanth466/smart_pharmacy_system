from datetime import date
from database import SessionLocal
from models import Medicine
from sales_service import process_sale


def test_fefo():
    db = SessionLocal()

    # Pick any medicine that exists
    med = db.query(Medicine).first()

    print(f"\n🧪 Testing FEFO for: {med.name}")

    try:
        process_sale(
            db=db,
            medicine_id=med.id,
            quantity_sold=5,
            sale_date=date.today()
        )
        print("✅ Sale processed using FEFO")
    except Exception as e:
        print(str(e))

    db.close()


if __name__ == "__main__":
    test_fefo()
