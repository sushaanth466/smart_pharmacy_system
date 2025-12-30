import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { useEffect, useState } from "react";
import axios from "axios";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

export default function DemandTrends() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/api/demand-trends")
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* 🥧 Demand Share */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl text-white mb-4">🥧 Demand Share</h2>

        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data.slice(0, 6)}
              dataKey="units"
              nameKey="medicine"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 📊 Demand Trends */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl text-white mb-4">📊 Demand Trends</h2>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <XAxis dataKey="medicine" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="units" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
