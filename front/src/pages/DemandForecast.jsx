import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area, CartesianGrid
} from "recharts";
import "../styles/demand-forecast.css";

export default function DemandForecast() {
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [tablet, setTablet] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/purchases")
      .then(res => res.json())
      .then(setPurchases);

    fetch("http://127.0.0.1:8000/api/sales")
      .then(res => res.json())
      .then(setSales);

    fetch("http://127.0.0.1:8000/api/forecast-reorder?days=30")
      .then(res => res.json())
      .then(d => setForecast(d[0]?.forecast || []));
  }, []);

  // ---------- GLOBAL ----------
  const totalPurchased = purchases.reduce((a, p) => a + p.quantity_received, 0);
  const totalSold = sales.reduce((a, s) => a + s.quantity_sold, 0);
  const available = totalPurchased - totalSold;

  // ---------- TABLET ----------
  const tabletPurchases = purchases.filter(
    p => p.medicine_name.toLowerCase() === tablet.toLowerCase()
  );
  const tabletSales = sales.filter(
    s => s.medicine_name.toLowerCase() === tablet.toLowerCase()
  );

  const tabletPurchased = tabletPurchases.reduce((a, p) => a + p.quantity_received, 0);
  const tabletSold = tabletSales.reduce((a, s) => a + s.quantity_sold, 0);
  const tabletAvailable = tabletPurchased - tabletSold;

  const risk =
    tabletAvailable < 20 ? "CRITICAL" :
    tabletAvailable < 50 ? "MEDIUM" : "SAFE";

  const supplyDemandData = [
    { name: "Supply", value: tablet ? tabletPurchased : totalPurchased },
    { name: "Demand", value: tablet ? tabletSold : totalSold },
  ];

  return (
    <div className="forecast-page powerbi-bg">

      <h1 className="page-title">
        📊 Demand Forecasting & Supply Intelligence
      </h1>

      {/* 🔍 BEAUTIFUL SEARCH BAR */}
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          className="tablet-search"
          placeholder="Search tablet (e.g. Dolo 650)"
          value={tablet}
          onChange={e => setTablet(e.target.value)}
        />
      </div>

      {/* KPI ORBS */}
      <div className="kpi-orbs">
        <div className="orb blue">
          <span>Purchased</span>
          <b>{tablet ? tabletPurchased : totalPurchased}</b>
        </div>

        <div className="orb purple">
          <span>Sold</span>
          <b>{tablet ? tabletSold : totalSold}</b>
        </div>

        <div className="orb green">
          <span>Available</span>
          <b>{tablet ? tabletAvailable : available}</b>
        </div>

        <div className={`orb ${risk.toLowerCase()}`}>
          <span>Risk</span>
          <b>{tablet ? risk : "—"}</b>
        </div>
      </div>

      {/* SUPPLY vs DEMAND */}
      <div className="graph-pod">
        <h2>⚖ Supply vs Demand</h2>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={supplyDemandData}>
            <defs>
              <linearGradient id="supplyDemandGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                background: "#020617",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)"
              }}
            />
            <Bar
              dataKey="value"
              fill="url(#supplyDemandGlow)"
              radius={[18, 18, 6, 6]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* FORECAST */}
      <div className="graph-pod neon">
        <h2>🔮 30-Day Demand Forecast</h2>

        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={forecast}>
            <defs>
              <linearGradient id="forecastWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                <stop offset="70%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#020617" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="ds" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                background: "#020617",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)"
              }}
            />
            <Area
              dataKey="yhat"
              stroke="#22c55e"
              strokeWidth={4}
              fill="url(#forecastWave)"
              activeDot={{ r: 9 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
