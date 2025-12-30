import { useEffect, useState } from "react";

export default function Sales({ refreshDashboard }) {
  const [form, setForm] = useState({
    transaction_id: "",
    medicine_name: "",
    batch_number: "",
    quantity_sold: "",
    mrp_unit_price: "",
    total_amount: "",
    sale_date: "",
  });

  const [inventory, setInventory] = useState([]);
  const [sellQty, setSellQty] = useState({});

  // 🔄 Load inventory
  const fetchInventory = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/purchases");
    const data = await res.json();
    setInventory(data);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // 🧮 Manual calc
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...form, [name]: value };

    if (name === "quantity_sold" || name === "mrp_unit_price") {
      const q = Number(updated.quantity_sold) || 0;
      const p = Number(updated.mrp_unit_price) || 0;
      updated.total_amount = (q * p).toFixed(2);
    }

    setForm(updated);
  };

  // 📤 Manual Sale
  const submitManualSale = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity_sold: Number(form.quantity_sold),
          mrp_unit_price: Number(form.mrp_unit_price),
          total_amount: Number(form.total_amount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      alert("✅ Sale recorded");

      setForm({
        transaction_id: "",
        medicine_name: "",
        batch_number: "",
        quantity_sold: "",
        mrp_unit_price: "",
        total_amount: "",
        sale_date: "",
      });

      fetchInventory();
      refreshDashboard?.();
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // ⚡ Quick Sell (NO 404)
  const quickSell = async (m) => {
    const qty = Number(sellQty[m.purchase_id]);
    if (!qty || qty <= 0) return alert("Enter quantity");
    if (qty > m.quantity_received) return alert("Insufficient stock");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: `QS-${Date.now()}`,
          medicine_name: m.medicine_name,
          batch_number: m.batch_number,
          quantity_sold: qty,
          mrp_unit_price: m.unit_cost_price,
          total_amount: qty * m.unit_cost_price,
          sale_date: new Date().toISOString().split("T")[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      alert("✅ Sold");
      setSellQty({ ...sellQty, [m.purchase_id]: "" });
      fetchInventory();
      refreshDashboard?.();
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* 🔝 MANUAL SALE */}
      <div
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h3 style={{ color: "#a5b4fc", marginBottom: "16px" }}>
          ➖ Manual Sale Entry
        </h3>

        <form
          onSubmit={submitManualSale}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          {Object.keys(form).map((k) => (
            <input
              key={k}
              name={k}
              value={form[k]}
              onChange={handleChange}
              placeholder={k.replaceAll("_", " ")}
              required
              style={{
                padding: "10px",
                borderRadius: "8px",
                background: "#020617",
                border: "1px solid #1e293b",
                color: "#fff",
              }}
            />
          ))}

          <button
            type="submit"
            style={{
              gridColumn: "span 3",
              padding: "12px",
              borderRadius: "8px",
              background: "#6366f1",
              color: "#fff",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add Sale
          </button>
        </form>
      </div>

      {/* ⬇ SMART SELL TABLE */}
      <div
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h3 style={{ color: "#a5b4fc", marginBottom: "12px" }}>
          💸 Quick Sell (FEFO)
        </h3>

        <table style={{ width: "100%", color: "#fff", fontSize: "14px" }}>
          <thead>
            <tr style={{ color: "#94a3b8" }}>
              <th align="left">Medicine</th>
              <th align="left">Stock</th>
              <th align="left">Expiry</th>
              <th align="left">Sell</th>
            </tr>
          </thead>

          <tbody>
            {inventory.map((m, i) => {
              const expSoon =
                new Date(m.expiry_date) <
                new Date(Date.now() + 30 * 86400000);

              return (
                <tr key={i} style={{ borderTop: "1px solid #1e293b" }}>
                  <td>{m.medicine_name}</td>

                  <td
                    style={{
                      color:
                        m.quantity_received < 20
                          ? "#f87171"
                          : "#4ade80",
                    }}
                  >
                    {m.quantity_received}
                  </td>

                  <td style={{ color: expSoon ? "#facc15" : "#cbd5f5" }}>
                    {m.expiry_date}
                  </td>

                  <td>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={sellQty[m.purchase_id] || ""}
                      onChange={(e) =>
                        setSellQty({
                          ...sellQty,
                          [m.purchase_id]: e.target.value,
                        })
                      }
                      style={{
                        width: "60px",
                        marginRight: "6px",
                        padding: "4px",
                        background: "#020617",
                        border: "1px solid #1e293b",
                        color: "#fff",
                        borderRadius: "6px",
                      }}
                    />

                    <button
                      onClick={() => quickSell(m)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: "#16a34a",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
