



import { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import DashboardCards from "../components/dashboard/DashboardCards";
import PageRenderer from "../dashboard/PageRenderer";
import "./ownerDashboard.css";

export default function OwnerDashboard({ user }) {
  const [activeMenu, setActiveMenu] = useState("home");

  return (
    <DashboardLayout role="OWNER" onMenuChange={setActiveMenu}>
      {/* DASHBOARD HOME */}
      {activeMenu === "home" ? (
        <div className="owner-dashboard">
          <div className="dashboard-header">
            <h2 className="page-title">Owner Dashboard</h2>
            <div className="dashboard-date">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          {/* DASHBOARD CARDS */}
          <DashboardCards />

          {/* QUICK ACTIONS */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-list">
            <ActionItem
                icon="📋"
                label="Create Pledge"
                onClick={() => setActiveMenu("pledges")}
              />
            <ActionItem
                icon="💸"
                label="Manage Expenses"
                onClick={() => setActiveMenu("expenses")}
              />
            <ActionItem
                icon="📄"
                label="View Day Book"
                onClick={() => setActiveMenu("daybook")}
              />
              <ActionItem
                icon="➕"
                label="Create Staff Account"
                onClick={() => setActiveMenu("staff")}
              />
              <ActionItem
                icon="💰"
                label="Add Owner Fund"
                onClick={() => setActiveMenu("fund-management")}
              />
              
              <ActionItem
                icon="📊"
                label="Reports Overview"
                onClick={() => setActiveMenu("reports")}
              />
              <ActionItem
                icon="👥"
                label="Manage Customers"
                onClick={() => setActiveMenu("customers")}
              />
              
              <ActionItem
                icon="⚙️"
                label="System Settings"
                onClick={() => setActiveMenu("settings")}
              />
            </div>
          </div>
        </div>
      ) : (
        // ROUTED CONTENT
        <PageRenderer
          activeKey={activeMenu}
          user={user}
          setActiveMenu={setActiveMenu}
        />
      )}
    </DashboardLayout>
  );
}

function ActionItem({ icon, label, onClick }) {
  return (
    <div className="action-item" onClick={onClick}>
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
    </div>
  );
}