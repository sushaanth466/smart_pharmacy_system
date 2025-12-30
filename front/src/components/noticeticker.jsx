import "../styles/alert_ticker.css";

export default function AlertTicker() {
  return (
    <div className="alert-ticker-wrapper">
      <div className="alert-ticker">
        <span className="alert-badge">NEW</span>

        <div className="alert-marquee">
          <div className="alert-text">
            ⚠️ Dolo 650 batch expiring in 28 days    •    
            Low stock alert for Azithromycin    •    
            AI suggests reorder for Paracetamol    •    
            Click Reports for demand insights    •   
            
          </div>
        </div>
      </div>
    </div>
  );
}
