import { useEffect, useState } from "react";
import {
  FaExclamationTriangle,
  FaSkullCrossbones,
  FaInfoCircle,
} from "react-icons/fa";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("http://127.0.0.1:8000/api/purchases").then((r) => r.json()),
      fetch("http://127.0.0.1:8000/api/sales").then((r) => r.json()),
    ])
      .then(([purchases, sales]) => {
        const generatedAlerts = [];
        const stockMap = {};
        const expiryMap = {};

        const today = new Date();
        const thirtyDaysFromNow = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        );

        /* ---------------- STOCK CALCULATION ---------------- */

        // ➕ Add purchases
        purchases.forEach((p) => {
          stockMap[p.medicine_name] =
            (stockMap[p.medicine_name] || 0) + p.quantity_received;

          // track expiry per batch
          if (p.expiry_date) {
            expiryMap[p.medicine_name] = expiryMap[p.medicine_name] || [];
            expiryMap[p.medicine_name].push({
              batch: p.batch_number,
              expiry: p.expiry_date,
            });
          }
        });

        // ➖ Subtract sales
        sales.forEach((s) => {
          stockMap[s.medicine_name] =
            (stockMap[s.medicine_name] || 0) - s.quantity_sold;
        });

        /* ---------------- ALERT GENERATION ---------------- */

        // 🔴 LOW STOCK ALERT
        Object.entries(stockMap).forEach(([medicine, qty]) => {
          if (qty <= 20) {
            generatedAlerts.push({
              type: "critical",
              title: "Low Stock",
              message: `${medicine} stock is low (${qty} units remaining).`,
              time: "Now",
            });
          }
        });

        // 🟠 EXPIRY ALERT
        Object.entries(expiryMap).forEach(([medicine, batches]) => {
          batches.forEach((b) => {
            const expDate = new Date(b.expiry);

            if (expDate <= thirtyDaysFromNow && expDate >= today) {
              generatedAlerts.push({
                type: "warning",
                title: "Expiry Warning",
                message: `${medicine} (Batch ${b.batch}) expires on ${b.expiry}.`,
                time: "Soon",
              });
            }

            if (expDate < today) {
              generatedAlerts.push({
                type: "critical",
                title: "Expired Medicine",
                message: `${medicine} (Batch ${b.batch}) has EXPIRED on ${b.expiry}.`,
                time: "Expired",
              });
            }
          });
        });

        setAlerts(generatedAlerts);
      })
      .catch((err) => console.error("Error fetching alerts:", err));
  }, []);

  const iconMap = {
    critical: <FaSkullCrossbones />,
    warning: <FaExclamationTriangle />,
    info: <FaInfoCircle />,
  };

  const borderColor = {
    critical: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>🚨 Alerts & Notifications</h1>

      {alerts.length === 0 ? (
        <div style={styles.noAlert}>✅ No active alerts</div>
      ) : (
        <div style={styles.list}>
          {alerts.map((alert, i) => (
            <div
              key={i}
              style={{
                ...styles.card,
                borderLeft: `6px solid ${borderColor[alert.type]}`,
              }}
            >
              <div style={styles.icon}>{iconMap[alert.type]}</div>
              <div style={styles.content}>
                <h2 style={styles.title}>{alert.title}</h2>
                <p style={styles.message}>{alert.message}</p>
                <span style={styles.time}>{alert.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  page: {
    padding: "24px",
    minHeight: "100vh",
    backgroundColor: "#111827",
    color: "#ffffff",
  },
  heading: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "24px",
  },
  noAlert: {
    padding: "16px",
    backgroundColor: "#064e3b",
    color: "#6ee7b7",
    borderRadius: "10px",
    fontWeight: "bold",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    borderRadius: "12px",
    backgroundColor: "#1f2937",
    boxShadow: "0 6px 15px rgba(0,0,0,0.35)",
  },
  icon: {
    fontSize: "26px",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: "18px",
    fontWeight: "bold",
  },
  message: {
    color: "#d1d5db",
    margin: "4px 0",
  },
  time: {
    fontSize: "12px",
    color: "#9ca3af",
  },
};
