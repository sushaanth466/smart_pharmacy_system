import "../styles/statscard.css";

export default function StatsCard({ title, value }) {
  return (
    <div className="stat-card-3d">
      <div className="stat-card-title">{title}</div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}
