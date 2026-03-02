

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./DashboardCards.css";

export default function DashboardCards() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const result = await invoke("get_owner_dashboard_summary");
      setData(result);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="dashboard-error">Failed to load dashboard data</div>;
  }

  return (
    <div className="dashboard-cards-grid">
      <DashboardCard
        icon="📋"
        title="Active Pledges"
        mainValue={data.active_pledges.count}
        subtitle={
          data.active_pledges.overdue_count > 0
            ? `${data.active_pledges.overdue_count} Overdue`
            : "All Current"
        }
        color="blue"
        subtitleColor={data.active_pledges.overdue_count > 0 ? "red" : "green"}
      />

      <DashboardCard
        icon="💰"
        title="Total Loan Amount"
        mainValue={`₹${data.total_loan_amount.toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`}
        subtitle="Active Pledges"
        color="green"
      />

      <DashboardCard
        icon="👥"
        title="Total Customers"
        mainValue={data.total_customers}
        subtitle="Registered"
        color="purple"
      />

      <DashboardCard
        icon="🏦"
        title="Opening Balance"
        mainValue={`₹${data.opening_balance.toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`}
        subtitle="Start of Day"
        color="teal"
      />

      <DashboardCard
        icon="📈"
        title="Today's Interest"
        mainValue={`₹${data.todays_interest.toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`}
        subtitle="Collected"
        color="orange"
      />

      <DashboardCard
        icon="💸"
        title="Total Expense"
        mainValue={`₹${data.total_expense.toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`}
        subtitle="All Time"
        color="red"
      />

      <DashboardCard
        icon="💳"
        title="Today's Part Payment"
        mainValue={`₹${data.todays_part_payment.amount.toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`}
        subtitle={`${data.todays_part_payment.count} Transactions`}
        color="indigo"
      />

      <DashboardCard
        icon="✅"
        title="Today's Redeem"
        mainValue={`₹${data.todays_redeem.amount.toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`}
        subtitle={`${data.todays_redeem.count} Closures`}
        color="emerald"
      />

      <CashInHandCard data={data.cash_in_hand} />
      <StockSummaryCard data={data.stock_summary} />
    </div>
  );
}

function DashboardCard({ icon, title, mainValue, subtitle, color, subtitleColor }) {
  return (
    <div className={`dashboard-card dashboard-card-${color}`}>
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="card-content">
        <div className="card-main-value">{mainValue}</div>
        <div
          className="card-subtitle"
          style={subtitleColor ? { color: `var(--${subtitleColor})` } : {}}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function CashInHandCard({ data }) {
  return (
    <div className="dashboard-card dashboard-card-cyan dashboard-card-detailed">
      <div className="card-header">
        <span className="card-icon">💵</span>
        <h3 className="card-title">Cash in Hand</h3>
      </div>
      <div className="card-content">
        <div className="card-main-value">
          ₹{data.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </div>
        <div className="card-breakdown">
          <div className="breakdown-item">
            <span>Cash:</span>
            <span>₹{data.cash.toLocaleString("en-IN")}</span>
          </div>
          <div className="breakdown-item">
            <span>Bank:</span>
            <span>₹{data.bank.toLocaleString("en-IN")}</span>
          </div>
          <div className="breakdown-item">
            <span>UPI:</span>
            <span>₹{data.upi.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StockSummaryCard({ data }) {
  return (
    <div className="dashboard-card dashboard-card-amber dashboard-card-detailed">
      <div className="card-header">
        <span className="card-icon">🪙</span>
        <h3 className="card-title">Stock Summary</h3>
      </div>
      <div className="card-content">
        <div className="stock-grid">
          <div className="stock-section">
            <div className="stock-label">
              <span className="gold-dot">●</span> Gold
            </div>
            <div className="stock-values">
              <div className="stock-value">
                <span className="value-label">Gross:</span>
                <span className="value-amount">{data.gold_gross_grams.toFixed(2)}g</span>
              </div>
              <div className="stock-value">
                <span className="value-label">Net:</span>
                <span className="value-amount">{data.gold_net_grams.toFixed(2)}g</span>
              </div>
            </div>
          </div>
          <div className="stock-divider"></div>
          <div className="stock-section">
            <div className="stock-label">
              <span className="silver-dot">●</span> Silver
            </div>
            <div className="stock-values">
              <div className="stock-value">
                <span className="value-label">Gross:</span>
                <span className="value-amount">{data.silver_gross_grams.toFixed(2)}g</span>
              </div>
              <div className="stock-value">
                <span className="value-label">Net:</span>
                <span className="value-amount">{data.silver_net_grams.toFixed(2)}g</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}