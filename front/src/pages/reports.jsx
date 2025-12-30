import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
  AreaChart, Area
} from "recharts";

export default function AnalyticsDashboard() {
  const [sales, setSales] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [waste, setWaste] = useState([]);

  useEffect(() => {
    // Fetch sales data
    fetch("http://127.0.0.1:8000/api/sales")
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : data.sales || [];
        const grouped = {};
        arr.forEach(s => {
          const name = s.medicine_name;
          grouped[name] = (grouped[name] || 0) + s.quantity_sold;
        });
        setSales(Object.keys(grouped).map(k => ({ name: k, quantity: grouped[k] })));
      })
      .catch(err => console.error("Error fetching sales:", err));

    // Fetch forecast data from updated endpoint
    fetch("http://127.0.0.1:8000/api/forecast-reorder?days=30")
      .then(res => res.json())
      .then(data => {
        if (data.length > 0 && data[0].forecast) {
          const mappedForecast = data[0].forecast.map(f => ({
            date: f.ds,
            predicted: Math.round(f.yhat)
          }));
          setForecast(mappedForecast);
        }
      })
      .catch(err => console.error("Error fetching forecast:", err));

    // Mock waste data
    setWaste([
      { name: "Expired", value: 35 },
      { name: "Damaged", value: 15 },
      { name: "Recalled", value: 5 }
    ]);
  }, []);

  const COLORS = ["#FF4C4C", "#FFA500", "#82ca9d"];

  return (
    <div className="p-6 space-y-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">📊 Smart Pharmacy Analytics Dashboard</h1>

      {/* Top Row: Sales & Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Line Chart */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-2">💰 Sales Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sales} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#444" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Line type="monotone" dataKey="quantity" stroke="#82ca9d" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Area Chart */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-2">📈 Demand Forecast (Next 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecast} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <CartesianGrid stroke="#444" strokeDasharray="3 3" />
              <Tooltip />
              <Area type="monotone" dataKey="predicted" stroke="#8884d8" fillOpacity={1} fill="url(#colorPred)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Waste Pie Chart & Stock Bar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Waste Pie Chart */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-2">🗑️ Waste Analytics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={waste}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {waste.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Bar Chart */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-2">📦 Current Stock Levels</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sales} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#444" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Bar dataKey="quantity" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Combined Line + Area for Forecast Trends */}
      <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-2">📊 Forecast Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecast} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="#444" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Line type="monotone" dataKey="predicted" stroke="#8884d8" strokeWidth={3} />
            <Area type="monotone" dataKey="predicted" fill="#8884d8" fillOpacity={0.2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
