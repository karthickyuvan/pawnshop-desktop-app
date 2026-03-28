// import { useState } from "react";
// import DashboardLayout from "./DashboardLayout";
// import PageRenderer from "./PageRenderer";

// export default function StaffDashboard({user}) {
//   const [activeMenu, setActiveMenu] = useState("home");

//   return (
//     <DashboardLayout
//       role="STAFF"
//       onMenuChange={setActiveMenu}
//     >
//       <PageRenderer activeKey={activeMenu} user={user} setActiveMenu={setActiveMenu}/>
//     </DashboardLayout>
//   );
// }


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


// // v3 

// import { useState, useEffect } from "react";
// import DashboardLayout from "./DashboardLayout";
// import DashboardCards from "../components/dashboard/DashboardCards";
// import PageRenderer from "./PageRenderer";
// import { useLanguage } from "../context/LanguageContext";
// import "./ownerDashboard.css";

// import { getActiveShift } from "../services/shiftApi";
// import { getAvailableCash } from "../services/fundServiceApi";

// import StartShiftModal from "../components/shift/StartShiftModal";
// import EndShiftModal from "../components/shift/EndShiftModal";

// export default function StaffDashboard({ user }) {

//   const { t } = useLanguage();

//   const [activeMenu, setActiveMenu] = useState("home");

//   const [activeShift, setActiveShift] = useState(null);

//   const [showStartShift, setShowStartShift] = useState(false);
//   const [showEndShift, setShowEndShift] = useState(false);

//   const [expectedCash, setExpectedCash] = useState(0);

//   // ---------------- CHECK SHIFT ----------------

//   const checkShift = async () => {

//     try {

//       if (!user) return;

//       const userId = user?.user_id || user?.id;

//       const shift = await getActiveShift(userId);

//       if (!shift) {

//         setShowStartShift(true);

//       } else {

//         setActiveShift(shift);

//       }

//     } catch (err) {

//       console.error("Shift check failed:", err);

//     }
//   };

//   // ---------------- OPEN END SHIFT ----------------

//   const openEndShiftModal = async () => {

//     try {

//       const cash = await getAvailableCash();

//       setExpectedCash(cash);

//       setShowEndShift(true);

//     } catch (err) {

//       console.error("Failed to load expected cash:", err);

//     }

//   };

//   // ---------------- LOAD SHIFT ----------------

//   useEffect(() => {

//     checkShift();

//   }, [user]);

//   // ---------------- UI ----------------

//   return (
//     <>
//       <DashboardLayout role="STAFF" onMenuChange={setActiveMenu}>

//         {activeMenu === "home" ? (

//           <div className="owner-dashboard">

//             {/* HEADER */}

//             <div className="dashboard-header">

//               <h2 className="page-title">
//                 {t("staff_dashboard")}
//               </h2>

//               <div className="dashboard-date">
//                 {new Date().toLocaleDateString("en-IN", {
//                   weekday: "long",
//                   year: "numeric",
//                   month: "long",
//                   day: "numeric",
//                 })}
//               </div>

//             </div>

//             {/* SHIFT INFO */}

//             {activeShift && (

//               <div className="shift-info-card">

//                 <h3>Cashier Shift</h3>

//                 <p>
//                   Started:{" "}
//                   {new Date(activeShift.shift_start).toLocaleTimeString()}
//                 </p>

//                 <p>
//                   Opening Cash: ₹
//                   {activeShift.opening_cash.toLocaleString("en-IN")}
//                 </p>

//                 <button
//                   className="fund-btn danger"
//                   onClick={openEndShiftModal}
//                   style={{ marginTop: "10px" }}
//                 >
//                   End Shift
//                 </button>

//               </div>

//             )}

//             {/* QUICK ACTIONS */}

//             <div className="quick-actions">

//               <h3>{t("quick_actions")}</h3>

//               <div className="action-list">

//                 <ActionItem
//                   icon="📋"
//                   label={t("create_pledge")}
//                   onClick={() => setActiveMenu("pledges")}
//                 />

//                 <ActionItem
//                   icon="💳"
//                   label={t("receive_payment")}
//                   onClick={() => setActiveMenu("payments")}
//                 />

//                 <ActionItem
//                   icon="📑"
//                   label={t("view_pledges")}
//                   onClick={() => setActiveMenu("viewpledges")}
//                 />

//                 <ActionItem
//                   icon="👥"
//                   label={t("customers")}
//                   onClick={() => setActiveMenu("customers")}
//                 />

//                 <ActionItem
//                   icon="💸"
//                   label={t("expenses")}
//                   onClick={() => setActiveMenu("expenses")}
//                 />

//                 <ActionItem
//                   icon="📖"
//                   label={t("daybook")}
//                   onClick={() => setActiveMenu("daybook")}
//                 />

//               </div>

//             </div>

//             {/* DASHBOARD CARDS */}

//             <DashboardCards role="STAFF" />

//           </div>

//         ) : (

//           <PageRenderer
//             activeKey={activeMenu}
//             user={user}
//             setActiveMenu={setActiveMenu}
//           />

//         )}

//       </DashboardLayout>

//       {/* START SHIFT MODAL */}

//       {showStartShift && (

//         <StartShiftModal
//           user={user}
//           onSuccess={() => {

//             setShowStartShift(false);

//             checkShift();

//           }}
//         />

//       )}

//       {/* END SHIFT MODAL */}

//       {showEndShift && (

//         <EndShiftModal
//           user={user}
//           expectedCash={expectedCash}
//           onClose={() => setShowEndShift(false)}
//           onSuccess={() => {

//             setShowEndShift(false);

//             setActiveShift(null);

//           }}
//         />

//       )}

//     </>
//   );
// }

// // ---------------- ACTION ITEM ----------------

// function ActionItem({ icon, label, onClick }) {

//   return (

//     <div className="action-item" onClick={onClick}>

//       <span className="action-icon">{icon}</span>

//       <span className="action-label">{label}</span>

//     </div>

//   );

// }