import { useEffect, useState } from "react";

export default function ForecastReorderDashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/forecast-reorder")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <h1 className="text-3xl font-bold text-white mb-6">📊 Forecast & Reorder Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item, i) => (
          <div key={i} className="p-4 rounded-2xl bg-gray-800/70 backdrop-blur-md shadow-lg border-l-4 border-indigo-500 hover:scale-105 transition-transform duration-300">
            <h2 className="text-xl font-semibold text-white">{item.medicine}</h2>
            <p className="text-slate-300">Current Stock: <span className="font-medium">{item.current_stock}</span></p>
            <p className="text-slate-300">Forecasted Demand: <span className="font-medium">{item.forecasted_demand}</span></p>
            <p className="text-green-400 font-semibold">Suggested Reorder: {item.suggested_reorder}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
