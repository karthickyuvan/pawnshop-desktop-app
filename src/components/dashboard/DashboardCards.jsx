// // version 3
// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import { useLanguage } from "../../context/LanguageContext";
// import "./DashboardCards.css";

// export default function DashboardCards({ role }) {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const { t } = useLanguage();

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       const result = await invoke("get_owner_dashboard_summary");
//       setData(result);
//     } catch (err) {
//       console.error("Failed to load dashboard:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return <div className="dashboard-loading">{t("loading_dashboard")}</div>;
//   }

//   if (!data) {
//     return <div className="dashboard-error">{t("dashboard_error")}</div>;
//   }

//   return (
//     <div className="dashboard-overview">
//       <h2 className="dashboard-overview-title">{t("shop_overview")}</h2>

//       <div className="dashboard-cards-grid">
//         <DashboardCard
//           icon="📋"
//           title={t("active_pledges")}
//           mainValue={data.active_pledges.count}
//           subtitle={
//             data.active_pledges.overdue_count > 0
//               ? `${data.active_pledges.overdue_count} ${t("overdue")}`
//               : t("all_current")
//           }
//           color="blue"
//           subtitleColor={
//             data.active_pledges.overdue_count > 0 ? "red" : "green"
//           }
//         />

//         <DashboardCard
//           icon="💰"
//           title={t("total_loan_amount")}
//           mainValue={`₹${data.total_loan_amount.toLocaleString("en-IN", {
//             maximumFractionDigits: 0,
//           })}`}
//           subtitle={t("active_pledges")}
//           color="green"
//         />

//         <DashboardCard
//           icon="👥"
//           title={t("total_customers")}
//           mainValue={data.total_customers}
//           subtitle={t("registered")}
//           color="purple"
//         />

//         {role !== "STAFF" && (
//           <DashboardCard
//             icon="🏦"
//             title={t("opening_balance")}
//             mainValue={`₹${data.opening_balance.toLocaleString("en-IN", {
//               maximumFractionDigits: 0,
//             })}`}
//             subtitle={t("start_of_day")}
//             color="teal"
//           />
//         )}

//         <DashboardCard
//           icon="📈"
//           title={t("todays_interest")}
//           mainValue={`₹${data.todays_interest.toLocaleString("en-IN", {
//             maximumFractionDigits: 0,
//           })}`}
//           subtitle={t("collected")}
//           color="orange"
//         />

//         {role !== "STAFF" && (
//           <DashboardCard
//             icon="💸"
//             title={t("total_expense")}
//             mainValue={`₹${data.total_expense.toLocaleString("en-IN", {
//               maximumFractionDigits: 0,
//             })}`}
//             subtitle={t("all_time")}
//             color="red"
//           />
//         )}

//         <DashboardCard
//           icon="💳"
//           title={t("todays_part_payment")}
//           mainValue={`₹${data.todays_part_payment.amount.toLocaleString(
//             "en-IN",
//             {
//               maximumFractionDigits: 0,
//             },
//           )}`}
//           subtitle={`${data.todays_part_payment.count} ${t("transactions")}`}
//           color="indigo"
//         />

//         <DashboardCard
//           icon="✅"
//           title={t("todays_redeem")}
//           mainValue={`₹${data.todays_redeem.amount.toLocaleString("en-IN", {
//             maximumFractionDigits: 0,
//           })}`}
//           subtitle={`${data.todays_redeem.count} ${t("closures")}`}
//           color="emerald"
//         />

//         <CashInHandCard data={data.cash_in_hand} />
//         <StockSummaryCard data={data.stock_summary} />
//       </div>
//     </div>
//   );
// }

// function DashboardCard({
//   icon,
//   title,
//   mainValue,
//   subtitle,
//   color,
//   subtitleColor,
// }) {
//   return (
//     <div className={`dashboard-card dashboard-card-${color}`}>
//       <div className="card-header">
//         <span className="card-icon">{icon}</span>
//         <h3 className="card-title">{title}</h3>
//       </div>

//       <div className="card-content">
//         <div className="card-main-value">{mainValue}</div>

//         <div
//           className="card-subtitle"
//           style={subtitleColor ? { color: `var(--${subtitleColor})` } : {}}
//         >
//           {subtitle}
//         </div>
//       </div>
//     </div>
//   );
// }

// function CashInHandCard({ data }) {
//   const { t } = useLanguage();

//   return (
//     <div className="dashboard-card dashboard-card-cyan dashboard-card-detailed">
//       <div className="card-header">
//         <span className="card-icon">💵</span>
//         <h3 className="card-title">{t("cash_in_hand")}</h3>
//       </div>

//       <div className="card-content">
//         <div className="card-main-value">
//           ₹{data.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
//         </div>

//         <div className="card-breakdown">
//           <div className="breakdown-item">
//             <span>{t("cash")}:</span>
//             <span>₹{data.cash.toLocaleString("en-IN")}</span>
//           </div>

//           <div className="breakdown-item">
//             <span>{t("bank")}:</span>
//             <span>₹{data.bank.toLocaleString("en-IN")}</span>
//           </div>

//           <div className="breakdown-item">
//             <span>{t("upi")}:</span>
//             <span>₹{data.upi.toLocaleString("en-IN")}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function StockSummaryCard({ data }) {
//   const { t } = useLanguage(); // ✅ Initialized translation hook here

//   const getMetalStyle = (name) => {
//     const metal = name.toLowerCase();

//     if (metal === "gold") {
//       return { icon: "🟡", color: "#f59e0b" };
//     }

//     if (metal === "silver") {
//       return { icon: "⚪", color: "#94a3b8" };
//     }

//     if (metal === "platinum") {
//       return { icon: "🔘", color: "#64748b" };
//     }

//     if (metal === "copper") {
//       return { icon: "🟤", color: "#b45309" };
//     }

//     return { icon: "🪙", color: "#64748b" };
//   };

//   if (!data?.metals?.length) {
//     return null;
//   }

//   // group metals into pairs (2 per row)
//   const rows = [];
//   for (let i = 0; i < data.metals.length; i += 2) {
//     rows.push(data.metals.slice(i, i + 2));
//   }

//   return (
//     <div className="dashboard-card dashboard-card-amber dashboard-card-detailed">
//       <div className="card-header">
//         <span className="card-icon">🪙</span>
//         <h3 className="card-title">{t("stock_summary")}</h3>
//       </div>

//       <div className="card-content">
//         {rows.map((pair, rowIndex) => (
//           <div key={rowIndex}>
//             <div className="stock-grid">
//               {pair.map((metal) => {
//                 const style = getMetalStyle(metal.metal_name);
                
//                 // Dynamic translation lookup for specific material classifications
//                 const normalizedMetalKey = metal.metal_name.toLowerCase();
//                 const localizedMetalName = normalizedMetalKey === "gold" ? t("gold") : normalizedMetalKey === "silver" ? t("silver") : metal.metal_name;

//                 return (
//                   <div key={metal.metal_name} className="stock-section">
//                     <div className="stock-label" style={{ color: style.color }}>
//                       <span style={{ marginRight: "6px" }}>{style.icon}</span>
//                       {localizedMetalName}
//                     </div>

//                     <div className="stock-values">
//                       <div className="stock-value">
//                         {t("gross")}: {metal.gross_weight.toFixed(2)} g
//                       </div>

//                       <div className="stock-value">
//                         {t("net")}: {metal.net_weight.toFixed(2)} g
//                       </div>

//                       <div className="stock-value">
//                         {t("value")}: ₹{metal.stock_value.toLocaleString("en-IN")}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}

//               {pair.length === 1 && <div className="stock-section"></div>}
//             </div>

//             {rowIndex < rows.length - 1 && (
//               <div className="stock-divider"></div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }








import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useLanguage } from "../../context/LanguageContext";
import "./DashboardCards.css";

export default function DashboardCards({ role }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { t } = useLanguage();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const result = await invoke("get_owner_dashboard_summary");
      setData(result);
      // Optional: Add a success toast if you want feedback on every manual refresh
      // toast.success(t("dashboard_loaded_success")); 
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      // 🚀 Trigger error toast with localized message
      toast.error(`${t("dashboard_error")}: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">{t("loading_dashboard")}</div>;
  }

  if (!data) {
    return <div className="dashboard-error">{t("dashboard_error")}</div>;
  }

  return (
    <div className="dashboard-overview">
      <h2 className="dashboard-overview-title">{t("shop_overview")}</h2>

      <div className="dashboard-cards-grid">
        <DashboardCard
          icon="📋"
          title={t("active_pledges")}
          mainValue={data.active_pledges.count}
          subtitle={
            data.active_pledges.overdue_count > 0
              ? `${data.active_pledges.overdue_count} ${t("overdue")}`
              : t("all_current")
          }
          color="blue"
          subtitleColor={
            data.active_pledges.overdue_count > 0 ? "red" : "green"
          }
        />

        <DashboardCard
          icon="💰"
          title={t("total_loan_amount")}
          mainValue={`₹${data.total_loan_amount.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}`}
          subtitle={t("active_pledges")}
          color="green"
        />

        <DashboardCard
          icon="👥"
          title={t("total_customers")}
          mainValue={data.total_customers}
          subtitle={t("registered")}
          color="purple"
        />

        {role !== "STAFF" && (
          <DashboardCard
            icon="🏦"
            title={t("opening_balance")}
            mainValue={`₹${data.opening_balance.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}`}
            subtitle={t("start_of_day")}
            color="teal"
          />
        )}

        <DashboardCard
          icon="📈"
          title={t("todays_interest")}
          mainValue={`₹${data.todays_interest.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}`}
          subtitle={t("collected")}
          color="orange"
        />

        {role !== "STAFF" && (
          <DashboardCard
            icon="💸"
            title={t("total_expense")}
            mainValue={`₹${data.total_expense.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}`}
            subtitle={t("all_time")}
            color="red"
          />
        )}

        <DashboardCard
          icon="💳"
          title={t("todays_part_payment")}
          mainValue={`₹${data.todays_part_payment.amount.toLocaleString(
            "en-IN",
            {
              maximumFractionDigits: 0,
            },
          )}`}
          subtitle={`${data.todays_part_payment.count} ${t("transactions")}`}
          color="indigo"
        />

        <DashboardCard
          icon="✅"
          title={t("todays_redeem")}
          mainValue={`₹${data.todays_redeem.amount.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}`}
          subtitle={`${data.todays_redeem.count} ${t("closures")}`}
          color="emerald"
        />

        <CashInHandCard data={data.cash_in_hand} />
        <StockSummaryCard data={data.stock_summary} />
      </div>
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  mainValue,
  subtitle,
  color,
  subtitleColor,
}) {
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
  const { t } = useLanguage();

  return (
    <div className="dashboard-card dashboard-card-cyan dashboard-card-detailed">
      <div className="card-header">
        <span className="card-icon">💵</span>
        <h3 className="card-title">{t("cash_in_hand")}</h3>
      </div>

      <div className="card-content">
        <div className="card-main-value">
          ₹{data.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </div>

        <div className="card-breakdown">
          <div className="breakdown-item">
            <span>{t("cash")}:</span>
            <span>₹{data.cash.toLocaleString("en-IN")}</span>
          </div>

          <div className="breakdown-item">
            <span>{t("bank")}:</span>
            <span>₹{data.bank.toLocaleString("en-IN")}</span>
          </div>

          <div className="breakdown-item">
            <span>{t("upi")}:</span>
            <span>₹{data.upi.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StockSummaryCard({ data }) {
  const { t } = useLanguage();

  const getMetalStyle = (name) => {
    const metal = name.toLowerCase();
    if (metal === "gold") return { icon: "🟡", color: "#f59e0b" };
    if (metal === "silver") return { icon: "⚪", color: "#94a3b8" };
    if (metal === "platinum") return { icon: "🔘", color: "#64748b" };
    if (metal === "copper") return { icon: "🟤", color: "#b45309" };
    return { icon: "🪙", color: "#64748b" };
  };

  if (!data?.metals?.length) {
    return null;
  }

  const rows = [];
  for (let i = 0; i < data.metals.length; i += 2) {
    rows.push(data.metals.slice(i, i + 2));
  }

  return (
    <div className="dashboard-card dashboard-card-amber dashboard-card-detailed">
      <div className="card-header">
        <span className="card-icon">🪙</span>
        <h3 className="card-title">{t("stock_summary")}</h3>
      </div>

      <div className="card-content">
        {rows.map((pair, rowIndex) => (
          <div key={rowIndex}>
            <div className="stock-grid">
              {pair.map((metal) => {
                const style = getMetalStyle(metal.metal_name);
                const normalizedMetalKey = metal.metal_name.toLowerCase();
                const localizedMetalName =
                  normalizedMetalKey === "gold"
                    ? t("gold")
                    : normalizedMetalKey === "silver"
                    ? t("silver")
                    : metal.metal_name;

                return (
                  <div key={metal.metal_name} className="stock-section">
                    <div className="stock-label" style={{ color: style.color }}>
                      <span style={{ marginRight: "6px" }}>{style.icon}</span>
                      {localizedMetalName}
                    </div>

                    <div className="stock-values">
                      <div className="stock-value">
                        {t("gross")}: {metal.gross_weight.toFixed(2)} g
                      </div>

                      <div className="stock-value">
                        {t("net")}: {metal.net_weight.toFixed(2)} g
                      </div>

                      <div className="stock-value">
                        {t("value")}: ₹{metal.stock_value.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                );
              })}
              {pair.length === 1 && <div className="stock-section"></div>}
            </div>
            {rowIndex < rows.length - 1 && <div className="stock-divider"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}