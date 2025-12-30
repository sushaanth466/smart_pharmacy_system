import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaPills,
  FaExclamationTriangle,
  FaChartLine,
  FaHome,
  FaRobot,
  FaPlusCircle,
  FaMinusCircle,FaChartPie,
} from "react-icons/fa";
import "../styles/sidebar-3d.css";

export default function Sidebar() {
  return (
    <aside className="sidebar-3d">
      {/* LOGO */}
      <div className="sidebar-logo">
        💊 <span>Smart Pharmacy</span>
      </div>

      {/* NAV */}
      <nav className="sidebar-nav">
        <NavLink to="/" className="nav-item">
          <FaHome />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/medicines" className="nav-item">
          <FaPills />
          <span>Medicines</span>
        </NavLink>

        <NavLink to="/add-purchase" className="nav-item">
          <FaPlusCircle />
          <span>Add Purchase</span>
        </NavLink>

        <NavLink to="/add-sale" className="nav-item">
          <FaMinusCircle />
          <span>Add Sale</span>
        </NavLink>

        <NavLink to="/alerts" className="nav-item">
          <FaExclamationTriangle />
          <span>Alerts</span>
        </NavLink>

        <NavLink to="/reports" className="nav-item">
          <FaChartLine />
          <span>Reports</span>
        </NavLink>

        <NavLink  to="/forecast" className="nav-item">
  <FaChartPie /> <span>Demand Forecast</span> 
</NavLink>


        <NavLink to="/chatbot" className="nav-item space">
          <FaRobot />
          <span>Chatbot</span>
        </NavLink>
      </nav>
    </aside>
  );
}
