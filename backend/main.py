from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func
from collections import defaultdict
from datetime import datetime, timedelta
import os

from openai import OpenAI

from database import get_db
from models import Inventory, Medicine, Sales

# -------------------------------------------------
# APP INIT
# -------------------------------------------------
app = FastAPI()

# -------------------------------------------------
# CORS
# -------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# PURCHASES (READ + ADD)
# -------------------------------------------------

@app.get("/api/purchases")
def get_purchases(db: Session = Depends(get_db)):
    purchases = (
        db.query(
            Inventory.purchase_id,
            Medicine.name.label("medicine_name"),
            Inventory.supplier_name,
            Inventory.batch_number,
            Inventory.quantity_received,
            (
                Inventory.quantity_received
                - func.coalesce(func.sum(Sales.quantity_sold), 0)
            ).label("quantity_available"),
            Inventory.unit_cost_price,
            Inventory.total_purchase_cost,
            Inventory.date_received,
            Inventory.expiry_date,
        )
        .join(Medicine, Inventory.medicine_id == Medicine.id)
        .outerjoin(
            Sales,
            (Sales.medicine_id == Medicine.id) &
            (Sales.batch_number == Inventory.batch_number)
        )
        .group_by(Inventory.id, Medicine.name)
        .order_by(Inventory.expiry_date)
        .all()
    )

    return [
        {
            "purchase_id": p.purchase_id,
            "medicine_name": p.medicine_name,
            "supplier_name": p.supplier_name,
            "batch_number": p.batch_number,
            "quantity_received": p.quantity_received,
            "quantity_available": int(p.quantity_available),
            "unit_cost_price": p.unit_cost_price,
            "total_purchase_cost": p.total_purchase_cost,
            "date_received": p.date_received.strftime("%Y-%m-%d"),
            "expiry_date": p.expiry_date.strftime("%Y-%m-%d"),
        }
        for p in purchases
    ]


@app.post("/api/purchases")
def add_purchase(data: dict, db: Session = Depends(get_db)):
    medicine = db.query(Medicine).filter(
        Medicine.name == data["medicine_name"]
    ).first()

    if not medicine:
        medicine = Medicine(name=data["medicine_name"])
        db.add(medicine)
        db.commit()
        db.refresh(medicine)

    purchase = Inventory(
        purchase_id=data["purchase_id"],
        medicine_id=medicine.id,
        supplier_name=data["supplier_name"],
        batch_number=data["batch_number"],
        quantity_received=data["quantity_received"],
        quantity_available=data["quantity_received"],  # stored but NOT trusted
        unit_cost_price=data["unit_cost_price"],
        total_purchase_cost=data["total_purchase_cost"],
        date_received=datetime.strptime(data["date_received"], "%Y-%m-%d"),
        expiry_date=datetime.strptime(data["expiry_date"], "%Y-%m-%d"),
    )

    db.add(purchase)
    db.commit()

    return {"status": "Purchase added successfully"}

# -------------------------------------------------
# SALES (READ + ADD + VALIDATION)
# -------------------------------------------------

@app.get("/api/sales")
def get_sales(db: Session = Depends(get_db)):
    sales = (
        db.query(
            Sales.transaction_id,
            Medicine.name.label("medicine_name"),
            Sales.batch_number,
            Sales.quantity_sold,
            Sales.mrp_unit_price,
            Sales.total_amount,
            Sales.sale_date,
        )
        .join(Medicine, Sales.medicine_id == Medicine.id)
        .order_by(Sales.sale_date)
        .all()
    )

    return [
        {
            "transaction_id": s.transaction_id,
            "medicine_name": s.medicine_name,
            "batch_number": s.batch_number,
            "quantity_sold": s.quantity_sold,
            "mrp_unit_price": s.mrp_unit_price,
            "total_amount": s.total_amount,
            "sale_date": s.sale_date.strftime("%Y-%m-%d"),
        }
        for s in sales
    ]


@app.post("/api/sales")
def add_sale(data: dict, db: Session = Depends(get_db)):

    # 1️⃣ Medicine check
    medicine = db.query(Medicine).filter(
        Medicine.name == data["medicine_name"]
    ).first()

    if not medicine:
        raise HTTPException(status_code=400, detail="Medicine not found")

    # 2️⃣ Inventory batch check
    inventory = db.query(Inventory).filter(
        Inventory.medicine_id == medicine.id,
        Inventory.batch_number == data["batch_number"]
    ).first()

    if not inventory:
        raise HTTPException(status_code=404, detail="Batch not found")

    # 3️⃣ Calculate available stock (SAFE METHOD)
    sold_qty = db.query(
        func.coalesce(func.sum(Sales.quantity_sold), 0)
    ).filter(
        Sales.medicine_id == medicine.id,
        Sales.batch_number == data["batch_number"]
    ).scalar()

    available_qty = inventory.quantity_received - sold_qty

    if available_qty < data["quantity_sold"]:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {available_qty}"
        )

    # 4️⃣ Record sale
    sale = Sales(
        transaction_id=data["transaction_id"],
        medicine_id=medicine.id,
        batch_number=data["batch_number"],
        quantity_sold=data["quantity_sold"],
        mrp_unit_price=data["mrp_unit_price"],
        total_amount=data["total_amount"],
        sale_date=datetime.strptime(data["sale_date"], "%Y-%m-%d"),
    )

    db.add(sale)
    db.commit()

    return {
        "status": "Sale recorded successfully",
        "remaining_stock": available_qty - data["quantity_sold"]
    }

# -------------------------------------------------
# DEMAND TRENDS
# -------------------------------------------------

@app.get("/api/demand-trends")
def demand_trends(db: Session = Depends(get_db)):
    data = (
        db.query(
            Medicine.name.label("medicine"),
            func.sum(Sales.quantity_sold).label("total_sold")
        )
        .join(Sales, Sales.medicine_id == Medicine.id)
        .group_by(Medicine.name)
        .order_by(func.sum(Sales.quantity_sold).desc())
        .all()
    )

    return [
        {"medicine": d.medicine, "units": d.total_sold}
        for d in data
    ]

# -------------------------------------------------
# FORECAST (UNCHANGED)
# -------------------------------------------------

def simple_demand_forecast(sales, days=30):
    if not sales:
        return []

    avg_daily_sales = sum(sales) / len(sales)
    today = datetime.today()

    return [
        {
            "ds": (today + timedelta(days=i + 1)).strftime("%Y-%m-%d"),
            "yhat": round(avg_daily_sales, 2),
        }
        for i in range(days)
    ]


@app.get("/api/forecast-reorder")
def forecast_reorder(days: int = 30, db: Session = Depends(get_db)):
    sales_data = db.query(Sales.sale_date, Sales.quantity_sold).all()

    if not sales_data:
        return []

    daily_sales = defaultdict(int)
    for sale_date, qty in sales_data:
        daily_sales[sale_date.strftime("%Y-%m-%d")] += qty

    forecast = simple_demand_forecast(list(daily_sales.values()), days)

    return [
        {
            "medicine": "All Medicines",
            "forecast": forecast
        }
    ]

# -------------------------------------------------
# CHATBOT (UNCHANGED)
# -------------------------------------------------

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

CHAT_MODEL = "mistralai/mixtral-8x7b-instruct"

conversation = [
    {"role": "system", "content": "You are ChatGPT, a friendly assistant."}
]

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@app.post("/api/chatbot", response_model=ChatResponse)
def chatbot_api(request: ChatRequest):
    conversation.append({"role": "user", "content": request.message})

    response = client.chat.completions.create(
        model=CHAT_MODEL,
        temperature=0.7,
        messages=conversation,
    )

    reply = response.choices[0].message.content.strip()
    conversation.append({"role": "assistant", "content": reply})

    return {"reply": reply}
