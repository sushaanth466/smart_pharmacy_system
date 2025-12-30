import { useEffect, useState } from "react";

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/purchases")
      .then((res) => res.json())
      .then((data) => setMedicines(data));
  }, []);

  const getStatus = (m) => {
    const expirySoon = new Date(m.expiry_date) < new Date(Date.now() + 30 * 86400000);
    if (m.quantity < 20) return "Low Stock";
    if (expirySoon) return "Expiring Soon";
    return "Healthy";
  };

  const getStatusColor = (status) => {
    if (status === "Low Stock") return "text-red-500";
    if (status === "Expiring Soon") return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">💊 Medicines Inventory</h1>
      <div className="overflow-x-auto bg-slate-900 rounded-xl p-4">
        <table className="w-full text-left text-white">
          <thead className="text-slate-400">
            <tr>
              <th className="p-2">Medicine Name</th>
              <th className="p-2">Batch</th>
              <th className="p-2">Expiry Date</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m, i) => {
              const status = getStatus(m);
              return (
                <tr key={i} className="border-t border-slate-700">
                  <td className="p-2">{m.medicine_name}</td>
                  <td className="p-2">{m.batch_number}</td>
                  <td className="p-2">{m.expiry_date}</td>
                  <td className="p-2">{m.quantity_received}</td>
                  <td className={`p-2 font-bold ${getStatusColor(status)}`}>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
