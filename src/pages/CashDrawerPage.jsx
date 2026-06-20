// import React, { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import { useLanguage } from "../context/LanguageContext";
// import DrawerExchangeModal from "../components/fund/DrawerExchangeModal";
// import { RefreshCw } from "lucide-react";
// import CashDenominationInput, {
//   calcDenomTotal,
// } from "../constants/CashDenominationInput";
// import "./CashDrawerPage.css";

// export default function CashDrawerPage({ user }) {
//   const { t } = useLanguage();
//   const [stock, setStock] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [showExchange, setShowExchange] = useState(false);

//   useEffect(() => {
//     loadDrawerStock();
//   }, []);

//   const loadDrawerStock = async () => {
//     setLoading(true);
//     try {
//       const result = await invoke("get_current_denominations_cmd");
//       const stockObj = {};
//       result.forEach(([denom, qty]) => {
//         stockObj[Number(denom)] = Number(qty);
//       });
//       setStock(stockObj);
//     } catch (err) {
//       console.error("Failed to load drawer stock:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="cash-drawer-page">
//       {/* Header */}
//       <div className="report-header">
//         <div>
//           <h2>Cash Drawer Management</h2>
//           <p>Monitor real-time physical note inventories and execute change exchanges</p>
//         </div>
//         <div className="header-actions-group">
//           <button 
//             onClick={() => setShowExchange(true)} 
//             className="save-btn"
//           >
//             🔄 Make Change / Exchange
//           </button>
//           <button 
//             onClick={loadDrawerStock} 
//             className="btn-print"
//           >
//             <RefreshCw size={14} /> Refresh Stock
//           </button>
//         </div>
//       </div>

//       {loading ? (
//         <div className="drawer-loading-state">Loading Drawer Stock...</div>
//       ) : (
//         <div className="drawer-stock-card">
//           <CashDenominationInput
//             title="Current Physical Drawer Stock"
//             data={stock}
//             readOnly={true}
//             showTotal={true}
//           />
//         </div>
//       )}

//       {/* Mounting the dynamic denomination exchange modal */}
//       {showExchange && (
//         <DrawerExchangeModal
//           user={user}
//           onClose={() => setShowExchange(false)}
//           onSuccess={loadDrawerStock}
//         />
//       )}
//     </div>
//   );
// }



// import React, { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import { useLanguage } from "../context/LanguageContext";
// import DrawerExchangeModal from "../components/fund/DrawerExchangeModal";
// import { RefreshCw } from "lucide-react";
// import CashDenominationInput, {
//   calcDenomTotal,
// } from "../constants/CashDenominationInput";
// import "./CashDrawerPage.css";

// export default function CashDrawerPage({ user }) {
//   const { t } = useLanguage();
//   const [stock, setStock] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [showExchange, setShowExchange] = useState(false);

//   useEffect(() => {
//     loadDrawerStock();
//   }, []);

//   const loadDrawerStock = async () => {
//     setLoading(true);
//     try {
//       const result = await invoke("get_current_denominations_cmd");
//       const stockObj = {};
//       result.forEach(([denom, qty]) => {
//         stockObj[Number(denom)] = Number(qty);
//       });
//       setStock(stockObj);
//     } catch (err) {
//       console.error("Failed to load drawer stock:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="cash-drawer-page">
//       {/* Header */}
//       <div className="report-header">
//         <div>
//           <h2>{t("cash_drawer", "Cash Drawer Management")}</h2>
//           <p>{t("cash_drawer_desc", "Monitor real-time physical note inventories and execute change exchanges")}</p>
//         </div>
//         <div className="header-actions-group">
//           <button 
//             onClick={() => setShowExchange(true)} 
//             className="save-btn"
//           >
//             🔄 {t("process_exchange_btn", "Make Change / Exchange")}
//           </button>
//           <button 
//             onClick={loadDrawerStock} 
//             className="btn-print"
//           >
//             <RefreshCw size={14} /> {t("refresh", "Refresh Stock")}
//           </button>
//         </div>
//       </div>

//       {loading ? (
//         <div className="drawer-loading-state">{t("loading_dashboard", "Loading Drawer Stock...")}</div>
//       ) : (
//         <div className="drawer-stock-card">
//           <CashDenominationInput
//             title={t("physical_denominations", "Current Physical Drawer Stock")}
//             data={stock}
//             readOnly={true}
//             showTotal={true}
//           />
//         </div>
//       )}

//       {/* Mounting the dynamic denomination exchange modal */}
//       {showExchange && (
//         <DrawerExchangeModal
//           user={user}
//           onClose={() => setShowExchange(false)}
//           onSuccess={loadDrawerStock}
//         />
//       )}
//     </div>
//   );
// }



import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useLanguage } from "../context/LanguageContext";
import DrawerExchangeModal from "../components/fund/DrawerExchangeModal";
import { RefreshCw } from "lucide-react";
import CashDenominationInput, {
  calcDenomTotal,
} from "../constants/CashDenominationInput";
import "./CashDrawerPage.css";

export default function CashDrawerPage({ user }) {
  const { t } = useLanguage();
  const [stock, setStock] = useState({});
  const [loading, setLoading] = useState(true);
  const [showExchange, setShowExchange] = useState(false);

  useEffect(() => {
    loadDrawerStock();
  }, []);

  const loadDrawerStock = async () => {
    setLoading(true);
    try {
      const result = await invoke("get_current_denominations_cmd");
      const stockObj = {};
      result.forEach(([denom, qty]) => {
        stockObj[Number(denom)] = Number(qty);
      });
      setStock(stockObj);
    } catch (err) {
      console.error("Failed to load drawer stock:", err);
      toast.error(t("failed_to_load_stock", "Failed to retrieve real-time drawer balance.")); // 🚀 Async Error Toast
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    await loadDrawerStock();
    toast.success(t("drawer_refreshed", "Drawer inventory snapshot updated!")); // 🚀 Action Feedback Toast
  };

  return (
    <div className="cash-drawer-page">
      {/* Header */}
      <div className="report-header">
        <div>
          <h2>{t("cash_drawer", "Cash Drawer Management")}</h2>
          <p>{t("cash_drawer_desc", "Monitor real-time physical note inventories and execute change exchanges")}</p>
        </div>
        <div className="header-actions-group">
          <button 
            onClick={() => setShowExchange(true)} 
            className="save-btn"
          >
            🔄 {t("process_exchange_btn", "Make Change / Exchange")}
          </button>
          <button 
            onClick={handleManualRefresh} 
            className="btn-print"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> {t("refresh", "Refresh Stock")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="drawer-loading-state">{t("loading_dashboard", "Loading Drawer Stock...")}</div>
      ) : (
        <div className="drawer-stock-card">
          <CashDenominationInput
            title={t("physical_denominations", "Current Physical Drawer Stock")}
            data={stock}
            readOnly={true}
            showTotal={true}
          />
        </div>
      )}

      {/* Mounting the dynamic denomination exchange modal */}
      {showExchange && (
        <DrawerExchangeModal
          user={user}
          onClose={() => setShowExchange(false)}
          onSuccess={loadDrawerStock}
        />
      )}
    </div>
  );
}