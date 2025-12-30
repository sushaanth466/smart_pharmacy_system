import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from openai import OpenAI

# =================================================
# 🔑 OpenRouter Setup
# =================================================
API_KEY = os.getenv("OPENROUTER_API_KEY")
if not API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY not set")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://openrouter.ai/api/v1",
)

MODEL = "mistralai/mixtral-8x7b-instruct"

# =================================================
# 🗄️ PostgreSQL Connection (CHANGE THIS)
# =================================================
DATABASE_URL = "postgresql://postgres:$u$hi466@localhost:5432/pharmacy_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# =================================================
# 🧠 SYSTEM PROMPT (ANTI-HALLUCINATION)
# =================================================
SYSTEM_PROMPT = (
    "You are a pharmacy assistant.\n"
    "Rules:\n"
    "• For medicine availability, batch, expiry, stock, or sales questions, "
    "you MUST rely ONLY on database data.\n"
    "• NEVER guess pharmacy data.\n"
    "• If data is unavailable, clearly say so.\n"
    "• For general questions, answer like ChatGPT.\n"
)

# =================================================
# 🔍 RULE-BASED MEDICINE DETECTION (CRITICAL)
# =================================================
def looks_like_medicine_query(user_input: str) -> bool:
    keywords = ["tablet", "tablets", "capsule", "capsules", "syrup", "mg"]
    words = user_input.lower().split()

    if len(words) <= 3:
        return True

    if any(k in user_input.lower() for k in keywords):
        return True

    return False

# =================================================
# 🔍 INTENT DETECTION (LLM)
# =================================================
def detect_intent(user_input: str) -> str:
    prompt = f"""
Classify the intent.

Return ONLY one word:
- DETAIL
- STOCK
- EXPIRY
- SALES
- GENERAL

Query:
{user_input}
"""
    res = client.chat.completions.create(
        model=MODEL,
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )
    return res.choices[0].message.content.strip().upper()

# =================================================
# 🏥 DATABASE FUNCTIONS
# =================================================
def get_full_medicine_details(name: str) -> str:
    db = SessionLocal()
    try:
        rows = db.execute(text("""
            SELECT 
                m.name,
                i.batch_number,
                i.quantity_received,
                i.quantity_available,
                i.expiry_date,
                COALESCE(SUM(s.quantity_sold), 0) AS total_sold
            FROM medicines m
            JOIN inventory i ON i.medicine_id = m.id
            LEFT JOIN sales s 
              ON s.medicine_id = m.id 
             AND s.batch_number = i.batch_number
            WHERE LOWER(m.name) LIKE LOWER(:name)
            GROUP BY m.name, i.batch_number,
                     i.quantity_received,
                     i.quantity_available,
                     i.expiry_date
            ORDER BY i.expiry_date
        """), {"name": f"%{name}%"}).fetchall()

        if not rows:
            return None

        output = [f"📦 Medicine: {rows[0].name}\n"]
        for r in rows:
            output.append(
                f"""• Batch No: {r.batch_number}
  - Quantity Received: {r.quantity_received}
  - Quantity Available: {r.quantity_available}
  - Quantity Sold: {r.total_sold}
  - Expiry Date: {r.expiry_date}
"""
            )
        return "\n".join(output)

    finally:
        db.close()

def get_stock(name: str) -> str:
    db = SessionLocal()
    try:
        row = db.execute(text("""
            SELECT m.name, COALESCE(SUM(i.quantity_available), 0) AS stock
            FROM medicines m
            JOIN inventory i ON i.medicine_id = m.id
            WHERE LOWER(m.name) LIKE LOWER(:name)
            GROUP BY m.name
        """), {"name": f"%{name}%"}).fetchone()

        if not row:
            return None

        return f"{row.name} currently has {row.stock} units available."

    finally:
        db.close()

def get_expiry(name: str = None) -> str:
    db = SessionLocal()
    try:
        query = """
            SELECT m.name, i.batch_number, i.expiry_date
            FROM inventory i
            JOIN medicines m ON m.id = i.medicine_id
        """
        params = {}
        if name:
            query += " WHERE LOWER(m.name) LIKE LOWER(:name)"
            params["name"] = f"%{name}%"

        rows = db.execute(text(query), params).fetchall()
        if not rows:
            return None

        return "\n".join(
            f"{r.name} (Batch {r.batch_number}) expires on {r.expiry_date}"
            for r in rows
        )

    finally:
        db.close()

# =================================================
# 🤖 CHAT LOOP
# =================================================
def chatbot():
    print("🤖 Smart Pharmacy Chatbot")
    print("Type a medicine name or ask anything. Type 'exit' to quit.\n")

    while True:
        user_input = input("> ").strip()
        if not user_input:
            continue

        if user_input.lower() == "exit":
            print("👋 Goodbye!")
            break

        # 🔥 HARD OVERRIDE
        if looks_like_medicine_query(user_input):
            intent = "DETAIL"
        else:
            intent = detect_intent(user_input)

        # Extract medicine name
        extract_prompt = f"""
Extract ONLY the medicine name.
If none found, return NONE.

Sentence:
{user_input}
"""
        med_res = client.chat.completions.create(
            model=MODEL,
            temperature=0,
            messages=[{"role": "user", "content": extract_prompt}],
        )
        medicine = med_res.choices[0].message.content.strip()

        context = None

        if intent == "DETAIL" and medicine != "NONE":
            context = get_full_medicine_details(medicine)
            if not context:
                print("No data found for this medicine.")
                continue

        elif intent == "STOCK" and medicine != "NONE":
            context = get_stock(medicine)
            if not context:
                print("Stock information not available.")
                continue

        elif intent == "EXPIRY":
            context = get_expiry(medicine if medicine != "NONE" else None)
            if not context:
                print("No expiry data found.")
                continue

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]

        if context:
            messages.append(
                {"role": "system", "content": f"Verified pharmacy data:\n{context}"}
            )

        messages.append({"role": "user", "content": user_input})

        response = client.chat.completions.create(
            model=MODEL,
            temperature=0.6,
            messages=messages,
        )

        print(response.choices[0].message.content.strip())

# =================================================
# ▶️ RUN
# =================================================
if __name__ == "__main__":
    chatbot()
