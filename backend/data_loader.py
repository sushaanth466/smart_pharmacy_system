from database import SessionLocal
from models import Medicine, Inventory, Sales
from sqlalchemy.orm import Session

# GET ALL PURCHASES
def get_all_purchases(db: Session):
    return db.query(Inventory).all()

# GET ALL SALES
def get_all_sales(db: Session):
    return db.query(Sales).all()
