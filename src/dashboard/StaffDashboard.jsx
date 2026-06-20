

import { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import DashboardCards from "../components/dashboard/DashboardCards";
import PageRenderer from "./PageRenderer";
import { useLanguage } from "../context/LanguageContext";
import "./ownerDashboard.css";


export default function StaffDashboard({ user }) {

  const [activeMenu, setActiveMenu] = useState("home");

  const { t } = useLanguage();

  return (
    <DashboardLayout role="STAFF" onMenuChange={setActiveMenu}>

      {activeMenu === "home" ? (

        <div className="owner-dashboard">

          {/* HEADER */}

          <div className="dashboard-header">

            <h2 className="page-title">
              {t("staff_dashboard")}
            </h2>

            <div className="dashboard-date">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>

          </div>

          {/* QUICK ACTIONS */}

          <div className="quick-actions">

            <h3>{t("quick_actions")}</h3>

            <div className="action-list">

              <ActionItem
                icon="📋"
                label={t("create_pledge")}
                onClick={() => setActiveMenu("pledges")}
              />

              <ActionItem
                icon="💳"
                label={t("receive_payment")}
                onClick={() => setActiveMenu("payments")}
              />

              <ActionItem
                icon="📑"
                label={t("view_pledges")}
                onClick={() => setActiveMenu("viewpledges")}
              />

              <ActionItem
                icon="👥"
                label={t("customers")}
                onClick={() => setActiveMenu("customers")}
              />
              <ActionItem
                icon="💵"
                label={t("cash_drawer", "Cash Drawer")}
                onClick={() => setActiveMenu("cash-drawer")}
              />

              <ActionItem
                icon="💸"
                label={t("expenses")}
                onClick={() => setActiveMenu("expenses")}
              />

              <ActionItem
                icon="📖"
                label={t("daybook")}
                onClick={() => setActiveMenu("daybook")}
              />

            </div>

          </div>

          {/* DASHBOARD CARDS */}

          <DashboardCards role="STAFF" />

        </div>

      ) : (

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

