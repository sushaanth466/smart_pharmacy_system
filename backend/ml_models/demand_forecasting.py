# backend/api/forecast_reorder.py
from fastapi import FastAPI
from backend.database import SessionLocal
from backend.models import Medicine, Sales
from backend.stock_utils import get_current_stock

app = FastAPI()

def forecast_medicine(db, med, days=30):
    sales = db.query(Sales).filter(Sales.medicine_id == med.id).all()
    if len(sales) < 2:
        return None
    total_sold = sum(s.quantity_sold for s in sales)
    active_days = len(set(s.sale_date for s in sales))
    daily_velocity = total_sold / active_days
    forecast = int(daily_velocity * days)
    return forecast

def calculate_reorder(db, med, forecast, safety_stock=20):
    current_stock, _ = get_current_stock(db, med.id)
    reorder_qty = max(0, forecast + safety_stock - current_stock)
    return reorder_qty, current_stock

@app.get("/api/forecast-reorder")
def forecast_reorder(days: int = 30, safety_stock: int = 20):
    db = SessionLocal()
    results = []

    for med in db.query(Medicine).all():
        forecast = forecast_medicine(db, med, days)
        if forecast is None:
            continue
        reorder_qty, current_stock = calculate_reorder(db, med, forecast, safety_stock)
        results.append({
            "medicine": med.name,
            "forecasted_demand": forecast,
            "current_stock": current_stock,
            "suggested_reorder": reorder_qty
        })

    db.close()
    return results
