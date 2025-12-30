import { useEffect, useState, useCallback } from "react";
import StatsCard from "../components/statscard";
import Charts from "../components/Charts";
import MedicinesTable from "../components/MedicinesTable";
import AlertTicker from "../components/noticeticker";

import "../styles/Dashboard.css";
import "../styles/panel.css";

export default function Dashboard() {
  const [medicines, setMedicines] = useState([]);

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/purchases");
      const data = await res.json();
      setMedicines(data);
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
    }
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const expiringSoon = medicines.filter(
    (m) => new Date(m.expiry_date) < new Date(Date.now() + 30 * 86400000)
  );

  const lowStock = medicines.filter((m) => m.quantity_available < 20);

  return (
    <div className="dashboard-3d">
      <div className="dashboard-surface space-y-8">

        <h1 className="text-3xl font-bold text-white">
          🧠 Smart Pharmacy Inventory
        </h1>

        {/* 🔔 ALERT SLIDER (SAFE ZONE) */}
        <div className="panel-3d">
          <AlertTicker />
        </div>

        {/* 3D Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard title="AI Forecast (30 Days)" value="Auto" />
          <StatsCard title="Expiring Soon" value={expiringSoon.length} />
          <StatsCard title="Low Stock Alerts" value={lowStock.length} />
          <StatsCard title="Total Medicines" value={medicines.length} />
        </div>

        {/* Charts */}
        <div className="panel-3d">
          <Charts salesEndpoint="http://127.0.0.1:8000/api/sales" />
        </div>

        {/* Medicines Table */}
        <div className="panel-3d">
          <MedicinesTable medicines={medicines} />
        </div>

      </div>
    </div>
  );
}
