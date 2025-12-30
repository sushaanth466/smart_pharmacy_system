from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


# ------------------------
# MEDICINE MASTER TABLE
# ------------------------
class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)

    # From Drug_Name (normalized)
    name = Column(String, unique=True, index=True, nullable=False)

    # Optional future use
    category = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)

    inventory_items = relationship("Inventory", back_populates="medicine")
    sales_items = relationship("Sales", back_populates="medicine")


# ------------------------
# INVENTORY / PURCHASES
# ------------------------
class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)

    # Purchase dataset columns
    purchase_id = Column(String, unique=True, index=True, nullable=False)
    date_received = Column(Date, nullable=False)

    supplier_name = Column(String, nullable=True)
    batch_number = Column(String, nullable=True)

    quantity_received = Column(Integer, nullable=False)
    quantity_available = Column(Integer, nullable=False)

    unit_cost_price = Column(Float, nullable=True)
    total_purchase_cost = Column(Float, nullable=True)

    expiry_date = Column(Date, nullable=False)

    # FK
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)

    medicine = relationship("Medicine", back_populates="inventory_items")


# ------------------------
# SALES / TRANSACTIONS
# ------------------------
class Sales(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    # Sales dataset columns
    transaction_id = Column(String, unique=True, index=True, nullable=False)
    sale_date = Column(Date, nullable=False)

    batch_number = Column(String, nullable=True)

    quantity_sold = Column(Integer, nullable=False)

    mrp_unit_price = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)

    # FK
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)

    medicine = relationship("Medicine", back_populates="sales_items")
