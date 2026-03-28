

// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import { Users, UserPlus, ShieldCheck, ShieldAlert } from "lucide-react";
// import "./staffPage.css"; // Using a dedicated CSS file
// import { useAuthStore } from "../auth/authStore";

// export default function StaffPage() {
//   const [staff, setStaff]       = useState([]);
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [msg, setMsg]           = useState("");
//   const user = useAuthStore((s) => s.user);

//   const loadStaff = async () => {
//     try {
//       const result = await invoke("get_staff_cmd");
//       setStaff(result);
//     } catch (err) {
//       console.error("Failed to load staff:", err);
//     }
//   };

//   useEffect(() => { loadStaff(); }, []);

//   const createStaff = async () => {
//     if (!username.trim() || !password.trim()) {
//       setMsg("Username and PIN are required");
//       return;
//     }
//     try {
//       await invoke("create_staff_cmd", {
//         username,
//         password,
//         actorUserId: user.user_id,
//       });
//       setMsg("Staff created successfully");
//       setUsername("");
//       setPassword("");
//       loadStaff();
//     } catch (err) {
//       setMsg(String(err));
//     }
//   };

//   const toggleStatus = async (id, isActive) => {
//     try {
//       await invoke("toggle_staff_cmd", {
//         staffId: id,
//         isActive: !isActive,
//         actorUserId: user.user_id,
//       });
//       loadStaff();
//     } catch (err) {
//       alert("Status toggle failed");
//     }
//   };

//   return (
//     <div className="staff-container">
//       <header className="page-header">
//         <div className="title-group">
//           <Users className="icon-main" />
//           <div className="title-text">
//             <h1>Staff Management</h1>
//             <p>Configure access levels and security for your team</p>
//           </div>
//         </div>
//       </header>

//       <div className="staff-grid">
//         {/* Add New Staff Section */}
//         <section className="admin-card">
//           <div className="card-header">
//             <h3><UserPlus size={18} /> Add New Staff</h3>
//           </div>
//           <div className="form-content">
//             <div className="form-group">
//               <label>Username</label>
//               <input
//                 placeholder="e.g. john_doe"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//               />
//             </div>

//             <div className="form-group">
//               <label>Security PIN / Password</label>
//               <input
//                 type="password"
//                 placeholder="••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && createStaff()}
//               />
//             </div>

//             <button className="btn-primary-staff" onClick={createStaff}>
//               Create Account
//             </button>

//             {msg && (
//               <div className={`status-msg ${msg.toLowerCase().includes("success") ? "success" : "error"}`}>
//                 {msg.toLowerCase().includes("success") ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}
//                 {msg}
//               </div>
//             )}
//           </div>
//         </section>

//         {/* Staff List Section */}
//         <section className="table-card">
//           <div className="table-header">
//             <h3>Active Team Members</h3>
//           </div>
//           <div className="table-wrapper">
//             <table className="staff-table">
//               <thead>
//                 <tr>
//                   <th>User Details</th>
//                   <th>Status</th>
//                   <th className="text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {staff.map((s) => (
//                   <tr key={s.id}>
//                     <td>
//                       <div className="user-info">
//                         <div className="avatar">
//                           {s.username.charAt(0).toUpperCase()}
//                         </div>
//                         <div className="user-meta">
//                           <span className="username">{s.username}</span>
//                           <span className="user-role">Staff Member</span>
//                         </div>
//                       </div>
//                     </td>
//                     <td>
//                       <span className={`pill ${s.is_active ? "pill-active" : "pill-disabled"}`}>
//                         {s.is_active ? "Active" : "Disabled"}
//                       </span>
//                     </td>
//                     <td className="text-right">
//                       <div className="action-cell">
//                         <button
//                           className={`btn-outline ${s.is_active ? "btn-danger" : "btn-success"}`}
//                           onClick={() => toggleStatus(s.id, s.is_active)}
//                         >
//                           {s.is_active ? "Deactivate" : "Activate"}
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 {staff.length === 0 && (
//                   <tr>
//                     <td colSpan="3" className="empty-state">No staff accounts found.</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }




import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Users, UserPlus, ShieldCheck, ShieldAlert } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import "./staffPage.css";
import { useAuthStore } from "../auth/authStore";

export default function StaffPage() {

  const { t } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const [staff, setStaff]       = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg]           = useState("");

  const loadStaff = async () => {
    try {
      const result = await invoke("get_staff_cmd");
      setStaff(result);
    } catch (err) {
      console.error("Failed to load staff:", err);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const createStaff = async () => {

    if (!username.trim() || !password.trim()) {
      setMsg(t("username_pin_required"));
      return;
    }

    try {

      await invoke("create_staff_cmd", {
        username,
        password,
        actorUserId: user.user_id,
      });

      setMsg(t("staff_created_success"));
      setUsername("");
      setPassword("");

      loadStaff();

    } catch (err) {
      setMsg(String(err));
    }

  };

  const toggleStatus = async (id, isActive) => {
    try {

      await invoke("toggle_staff_cmd", {
        staffId: id,
        isActive: !isActive,
        actorUserId: user.user_id,
      });

      loadStaff();

    } catch (err) {
      alert(t(err,"status_toggle_failed"));
    }
  };

  return (
    <div className="staff-container">

      <header className="page-header">

        <div className="title-group">

          <Users className="icon-main" />

          <div className="title-text">
            <h1>{t("staff_management")}</h1>
            <p>{t("staff_management_desc")}</p>
          </div>

        </div>

      </header>

      <div className="staff-grid">

        {/* Add Staff */}
        <section className="admin-card">

          <div className="card-header">
            <h3><UserPlus size={18} /> {t("add_new_staff")}</h3>
          </div>

          <div className="form-content">

            <div className="form-group">

              <label>{t("username")}</label>

              <input
                placeholder="e.g. john_doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

            </div>

            <div className="form-group">

              <label>{t("security_pin")}</label>

              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createStaff()}
              />

            </div>

            <button
              className="btn-primary-staff"
              onClick={createStaff}
            >
              {t("create_account")}
            </button>

            {msg && (

              <div
                className={`status-msg ${
                  msg.toLowerCase().includes("success")
                    ? "success"
                    : "error"
                }`}
              >
                {msg.toLowerCase().includes("success")
                  ? <ShieldCheck size={14}/>
                  : <ShieldAlert size={14}/>}

                {msg}

              </div>

            )}

          </div>

        </section>

        {/* Staff List */}
        <section className="table-card">

          <div className="table-header">
            <h3>{t("active_team_members")}</h3>
          </div>

          <div className="table-wrapper">

            <table className="staff-table">

              <thead>

                <tr>
                  <th>{t("user_details")}</th>
                  <th>{t("status")}</th>
                  <th className="text-right">{t("actions")}</th>
                </tr>

              </thead>

              <tbody>

                {staff.map((s) => (

                  <tr key={s.id}>

                    <td>

                      <div className="user-info">

                        <div className="avatar">
                          {s.username.charAt(0).toUpperCase()}
                        </div>

                        <div className="user-meta">

                          <span className="username">
                            {s.username}
                          </span>

                          <span className="user-role">
                            {t("staff_member")}
                          </span>

                        </div>

                      </div>

                    </td>

                    <td>

                      <span
                        className={`pill ${
                          s.is_active
                            ? "pill-active"
                            : "pill-disabled"
                        }`}
                      >
                        {s.is_active
                          ? t("active")
                          : t("disabled")}
                      </span>

                    </td>

                    <td className="text-right">

                      <div className="action-cell">

                        <button
                          className={`btn-outline ${
                            s.is_active
                              ? "btn-danger"
                              : "btn-success"
                          }`}
                          onClick={() =>
                            toggleStatus(s.id, s.is_active)
                          }
                        >
                          {s.is_active
                            ? t("deactivate")
                            : t("activate")}
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

                {staff.length === 0 && (

                  <tr>
                    <td colSpan="3" className="empty-state">
                      {t("no_staff_accounts")}
                    </td>
                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>

    </div>
  );
}