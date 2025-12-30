export default function MedicinesTable({ medicines }) {
  return (
    <div className="bg-slate-900 p-4 rounded-xl">
      <h2 className="text-slate-100 text-xl mb-3">💊 Smart Shelf (FEFO)</h2>

      <table className="w-full text-sm table-auto">
        <thead>
          <tr className="text-slate-400">
            <th className="text-left px-2 py-1">Name</th>
            <th className="text-left px-2 py-1">Batch</th>
            <th className="text-left px-2 py-1">Expiry</th>
            <th className="text-left px-2 py-1">Qty</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((m, i) => {
            const expiring =
              new Date(m.expiry_date) < new Date(Date.now() + 30 * 86400000);

            return (
              <tr key={i} className="text-slate-100 border-t border-slate-700">
                <td className="px-2 py-1">{m.medicine_name || "-"}</td>
                <td className="px-2 py-1">{m.batch_number || "-"}</td>
                <td className={`px-2 py-1 ${expiring ? "text-yellow-400" : "text-green-400"}`}>
                  {m.expiry_date || "-"}
                </td>
                <td className={`px-2 py-1 ${m.quantity < 20 ? "text-red-400" : ""}`}>
                  {m.quantity_received ?? "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
