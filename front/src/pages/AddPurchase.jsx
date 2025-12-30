import { useState, useEffect } from "react";

export default function AddPurchase({ refreshDashboard }) {
  const [form, setForm] = useState({
    purchase_id: "",
    medicine_name: "",
    supplier_name: "",
    batch_number: "",
    quantity_received: "",
    unit_cost_price: "",
    total_purchase_cost: "",
    date_received: "",
    expiry_date: "",
  });

  const [medicines, setMedicines] = useState([]);
  const [reorderQty, setReorderQty] = useState({});

  const fetchMedicines = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/purchases");
      const data = await res.json();
      setMedicines(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...form, [name]: value };

    if (name === "quantity_received" || name === "unit_cost_price") {
      const q = Number(updatedForm.quantity_received) || 0;
      const p = Number(updatedForm.unit_cost_price) || 0;
      updatedForm.total_purchase_cost = (q * p).toFixed(2);
    }

    setForm(updatedForm);
  };

  const submitForm = async (purchaseForm) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...purchaseForm,
          quantity_received: Number(purchaseForm.quantity_received),
          unit_cost_price: Number(purchaseForm.unit_cost_price),
          total_purchase_cost: Number(purchaseForm.total_purchase_cost),
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      alert("✅ Purchase added successfully");

      if (purchaseForm === form) {
        setForm({
          purchase_id: "",
          medicine_name: "",
          supplier_name: "",
          batch_number: "",
          quantity_received: "",
          unit_cost_price: "",
          total_purchase_cost: "",
          date_received: "",
          expiry_date: "",
        });
      }

      fetchMedicines();
      refreshDashboard?.();
    } catch (err) {
      alert("❌ Backend not reachable or validation failed");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        gap: "20px",
        padding: "20px",
        background: "linear-gradient(135deg, #0b1220, #0e1629)",
      }}
    >
      {/* 🔼 TOP MANUAL FORM */}
      <div
        style={{
          background: "#0e1629",
          border: "1px solid #1f2a44",
          borderRadius: "16px",
          padding: "20px",
          color: "#fff",
        }}
      >
        <h2 style={{ marginBottom: "16px" }}>➕ Add Purchase</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitForm(form);
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
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
                background: "#0b1220",
                border: "1px solid #1f2a44",
                color: "#e5e7eb",
              }}
            />
          ))}

          <button
            type="submit"
            style={{
              gridColumn: "1 / -1",
              padding: "12px",
              borderRadius: "10px",
              background: "#2563eb",
              color: "#fff",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add Purchase
          </button>
        </form>
      </div>

      {/* 🔽 BOTTOM TABLE */}
      <div
        style={{
          flex: 1,
          background: "#0e1629",
          border: "1px solid #1f2a44",
          borderRadius: "16px",
          padding: "20px",
          overflow: "auto",
        }}
      >
        <h3 style={{ marginBottom: "12px", color: "#fff" }}>
          💊 Existing Medicines & Reorder
        </h3>

        <table style={{ width: "100%", borderCollapse: "collapse", color: "#e5e7eb" }}>
          <thead>
            <tr style={{ color: "#8fa6c9", borderBottom: "1px solid #1f2a44" }}>
              <th align="left">Name</th>
              <th align="left">Batch</th>
              <th align="left">Qty</th>
              <th align="left">Unit Price</th>
              <th align="left">Total</th>
              <th align="left">Expiry</th>
              <th align="left">Received</th>
              <th align="left">Reorder</th>
            </tr>
          </thead>

          <tbody>
            {medicines.map((m, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #1f2a44" }}>
                <td>{m.medicine_name}</td>
                <td>{m.batch_number}</td>
                <td>{m.quantity_received}</td>
                <td>{m.unit_cost_price}</td>
                <td>{m.total_purchase_cost}</td>
                <td>{m.expiry_date}</td>
                <td>{m.date_received}</td>
                <td>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={reorderQty[m.purchase_id] || ""}
                    onChange={(e) =>
                      setReorderQty({ ...reorderQty, [m.purchase_id]: e.target.value })
                    }
                    style={{
                      width: "60px",
                      marginRight: "6px",
                      padding: "4px",
                      background: "#0b1220",
                      border: "1px solid #1f2a44",
                      color: "#fff",
                      borderRadius: "6px",
                    }}
                  />
                  <button
                    onClick={() => {
                      const qty = reorderQty[m.purchase_id];
                      if (!qty) return alert("Enter quantity");

                      submitForm({
                        purchase_id: `RE-${Date.now()}`,
                        medicine_name: m.medicine_name,
                        supplier_name: m.supplier_name,
                        batch_number: m.batch_number,
                        quantity_received: qty,
                        unit_cost_price: m.unit_cost_price,
                        total_purchase_cost: (qty * m.unit_cost_price).toFixed(2),
                        date_received: new Date().toISOString().split("T")[0],
                        expiry_date: m.expiry_date,
                      });

                      setReorderQty({ ...reorderQty, [m.purchase_id]: "" });
                    }}
                    style={{
                      padding: "4px 8px",
                      background: "#2563eb",
                      color: "#fff",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
