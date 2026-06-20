
// version 3 

import { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import DashboardCards from "../components/dashboard/DashboardCards";
import PageRenderer from "../dashboard/PageRenderer";
import "./ownerDashboard.css";
import { useLanguage } from "../context/LanguageContext";

export default function OwnerDashboard({ user }) {

  const [activeMenu, setActiveMenu] = useState("home");

  const { t } = useLanguage();

  return (
    <DashboardLayout role="OWNER" onMenuChange={setActiveMenu}>

      {activeMenu === "home" ? (

        <div className="owner-dashboard">

          {/* HEADER */}
          <div className="dashboard-header">

            <h2 className="page-title">
              {t("owner_dashboard")}
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
                icon="💸"
                label={t("manage_expenses")}
                onClick={() => setActiveMenu("expenses")}
              />

              <ActionItem
                icon="📄"
                label={t("view_daybook")}
                onClick={() => setActiveMenu("daybook")}
              />

              <ActionItem
                icon="➕"
                label={t("create_staff")}
                onClick={() => setActiveMenu("staff")}
              />

              <ActionItem
                icon="💰"
                label={t("add_owner_fund")}
                onClick={() => setActiveMenu("fund-management")}
              />

              <ActionItem
                icon="📊"
                label={t("reports_overview")}
                onClick={() => setActiveMenu("reports")}
              />

              <ActionItem
                icon="👥"
                label={t("manage_customers")}
                onClick={() => setActiveMenu("customers")}
              />

              <ActionItem
                icon="⚙️"
                label={t("system_settings")}
                onClick={() => setActiveMenu("settings")}
              />

              <ActionItem
                icon="📑"
                label={t("view_all_pledges")}
                onClick={() => setActiveMenu("viewpledges")}
              />

              <ActionItem
                icon="🔄"
                label={t("repledge")}
                onClick={() => setActiveMenu("repledges")}
              />

              {/* ✅ NEW: Overlimit Pledges Quick Action */}
              <ActionItem
                icon="⚠️"
                label={t("overlimit_pledges")}
                onClick={() => setActiveMenu("overlimit-pledges")}
                variant="warning"
              />

              <ActionItem
                icon="💵"
                label={t("cash_drawer", "Cash Drawer")}
                onClick={() => setActiveMenu("cash-drawer")}
              />

              <ActionItem
                icon="🏦"
                label={t("fund_ledger")}
                onClick={() => setActiveMenu("fund-management")}
              />

              <ActionItem
                icon="🔨"
                label={t("auction_list")}
                onClick={() => setActiveMenu("auction-list")}
              />

            </div>

          </div>

          {/* DASHBOARD CARDS */}
          <DashboardCards />

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

function ActionItem({ icon, label, onClick, variant }) {
  return (
    <div 
      className={`action-item ${variant === "warning" ? "action-item-warning" : ""}`}
      onClick={onClick}
    >
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
    </div>
  );
}