import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/sidebar";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/alerts";
import Reports from "./pages/reports";
import Medicines from "./pages/Medicines";
import Chatbot from "./pages/Chatbot"
import AddPurchase from "./pages/AddPurchase";
import AddSale from "./pages/AddSale";
import "./styles/threeD-theme.css";
import DemandForecast from "./pages/DemandForecast";


function App() {
  return (
    <Router>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/medicines"element={<Medicines/>}/>
            <Route path="/chatbot"element={<Chatbot/>}/>
            <Route path="/add-purchase" element={<AddPurchase />} />
            <Route path="/add-sale" element={<AddSale />} />
<Route path="/forecast" element={<DemandForecast />} />

          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
