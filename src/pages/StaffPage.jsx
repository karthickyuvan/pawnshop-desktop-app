// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import "../styles/auth.css";
// import { useAuthStore } from "../auth/authStore";


// export default function StaffPage() {
//   const [staff, setStaff] = useState([]);
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [msg, setMsg] = useState("");
//   const user = useAuthStore((s) => s.user);

//   const loadStaff = async () => {
//     const result = await invoke("get_staff_cmd");
//     setStaff(result);
//   };

//   useEffect(() => {
//     loadStaff();
//   }, []);

//   const createStaff = async () => {
//     try {
//       await invoke("create_staff_cmd", {
//         username,
//         password,
//         actorUserId: user.user_id, // 👈 ADD THIS
//       });
  
//       setMsg("Staff created successfully");
//       setUsername("");
//       setPassword("");
//       loadStaff();
//     } catch (err) {
//       setMsg(err);
//     }
//   };
  

//   const toggleStatus = async (id, isActive) => {
//     await invoke("toggle_staff_cmd", {
//       staffId: id,
//       isActive: !isActive,
//       actorUserId: user.user_id, 
//     });
  
//     loadStaff();
//   };
  


//     return (
//       <div className="admin-container">
//   {/* TOP BAR / BREADCRUMBS */}
//   <header className="page-header">
//     <div className="header-text">
//       <h2>Staff Management</h2>
//       <p>Configure access levels and security for your team.</p>
//     </div>

//   </header>

//   <div className="admin-grid">
//     {/* CREATE STAFF CARD */}
//     <aside className="admin-card sidebar-form">
//       <h3>Add New Staff</h3>
//       <div className="form-group">
//         <label>Username</label>
//         <input
//           className="auth-input"
//           placeholder="e.g. john_doe"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//         />

//         <label>Security PIN / Password</label>
//         <input
//           className="auth-input"
//           type="password"
//           placeholder="••••••"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />

//         <button className="auth-button primary" onClick={createStaff}>
//           Create Account
//         </button>
//       </div>
//       {msg && <div className={`status-msg ${msg.includes("success") ? "success" : "error"}`}>{msg}</div>}
//     </aside>

//     {/* STAFF LIST CARD */}
//     <main className="admin-card main-content">
//       <div className="header">
//         <h3>Staff Accounts</h3>
//       </div>
      
//       <table className="staff-table">
//         <thead>
//           <tr>
//             <th>User Details</th>
//             <th>Status</th>
//             <th className="text-right">Manage</th>
//           </tr>
//         </thead>
//         <tbody>
//           {staff.map((s) => (
//             <tr key={s.id}>
//               <td>
//                 <div className="user-info">
//                   <div className="avatar">{s.username.charAt(0).toUpperCase()}</div>
//                   <div className="user-details">
//                     <span className="username">{s.username}</span>
//                     <span className="user-role">Staff Member</span>
//                   </div>
//                 </div>
//               </td>
//               <td>
//                 <span className={`status-pill ${s.is_active ? "active" : "disabled"}`}>
//                   {s.is_active ? "Active" : "Disabled"}
//                 </span>
//               </td>
//               <td className="center">
//                 <button
//                   className={`action-link ${s.is_active ? "danger" : "success"}`}
//                   onClick={() => toggleStatus(s.id, s.is_active)}
//                 >
//                   {s.is_active ? "Deactivate" : "Activate"}
//                 </button>
//                 <button  className="action-link">Reset Password</button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </main>
//   </div>
// </div>
//     );
//   }



// // StaffPage.jsx
// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import "../styles/auth.css";
// import { useAuthStore } from "../auth/authStore";

// export default function StaffPage() {
//   const [staff, setStaff]       = useState([]);
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [msg, setMsg]           = useState("");
//   const user = useAuthStore((s) => s.user);

//   const loadStaff = async () => {
//     const result = await invoke("get_staff_cmd");
//     setStaff(result);
//   };

//   useEffect(() => { loadStaff(); }, []);

//   const createStaff = async () => {
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
//     await invoke("toggle_staff_cmd", {
//       staffId: id,
//       isActive: !isActive,
//       actorUserId: user.user_id,
//     });
//     loadStaff();
//   };

//   return (
//     <div className="admin-container">
//       <header className="page-header">
//         <div className="header-text">
//           <h2>Staff Management</h2>
//           <p>Configure access levels and security for your team</p>
//         </div>
//       </header>

//       <div className="admin-grid">
//         {/* ── Create Staff Card ── */}
//         <aside className="admin-card sidebar-form">
//           <h3>Add New Staff</h3>
//           <div className="form-group">
//             <label>Username</label>
//             <input
//               className="auth-input"
//               placeholder="e.g. john_doe"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//             />

//             <label>Security PIN / Password</label>
//             <input
//               className="auth-input"
//               type="password"
//               placeholder="••••••"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && createStaff()}
//             />

//             <button className="auth-button" onClick={createStaff}>
//               Create Account
//             </button>
//           </div>

//           {msg && (
//             <div
//               className={`status-msg ${
//                 msg.toLowerCase().includes("success") ? "success" : "error"
//               }`}
//             >
//               {msg}
//             </div>
//           )}
//         </aside>

//         {/* ── Staff List Card ── */}
//         <main className="admin-card main-content">
//           <h3>Staff Accounts</h3>

//           {staff.length === 0 ? (
//             <div style={{
//               padding: "48px 24px",
//               textAlign: "center",
//               color: "var(--vault-400)",
//               fontSize: "14px",
//             }}>
//               No staff accounts yet. Add your first team member.
//             </div>
//           ) : (
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
//                         <div>
//                           <span className="username">{s.username}</span>
//                           <span className="user-role">Staff Member</span>
//                         </div>
//                       </div>
//                     </td>
//                     <td>
//                       <span className={`status-pill ${s.is_active ? "active" : "disabled"}`}>
//                         {s.is_active ? "Active" : "Disabled"}
//                       </span>
//                     </td>
//                     <td className="text-right">
//                       <button
//                         className={`action-link ${s.is_active ? "danger" : "success"}`}
//                         onClick={() => toggleStatus(s.id, s.is_active)}
//                       >
//                         {s.is_active ? "Deactivate" : "Activate"}
//                       </button>
//                       <button className="action-link">
//                         Reset PIN
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }





import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Users, UserPlus, ShieldCheck, ShieldAlert } from "lucide-react";
import "./staffPage.css"; // Using a dedicated CSS file
import { useAuthStore } from "../auth/authStore";

export default function StaffPage() {
  const [staff, setStaff]       = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg]           = useState("");
  const user = useAuthStore((s) => s.user);

  const loadStaff = async () => {
    try {
      const result = await invoke("get_staff_cmd");
      setStaff(result);
    } catch (err) {
      console.error("Failed to load staff:", err);
    }
  };

  useEffect(() => { loadStaff(); }, []);

  const createStaff = async () => {
    if (!username.trim() || !password.trim()) {
      setMsg("Username and PIN are required");
      return;
    }
    try {
      await invoke("create_staff_cmd", {
        username,
        password,
        actorUserId: user.user_id,
      });
      setMsg("Staff created successfully");
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
      alert("Status toggle failed");
    }
  };

  return (
    <div className="staff-container">
      <header className="page-header">
        <div className="title-group">
          <Users className="icon-main" />
          <div className="title-text">
            <h1>Staff Management</h1>
            <p>Configure access levels and security for your team</p>
          </div>
        </div>
      </header>

      <div className="staff-grid">
        {/* Add New Staff Section */}
        <section className="admin-card">
          <div className="card-header">
            <h3><UserPlus size={18} /> Add New Staff</h3>
          </div>
          <div className="form-content">
            <div className="form-group">
              <label>Username</label>
              <input
                placeholder="e.g. john_doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Security PIN / Password</label>
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createStaff()}
              />
            </div>

            <button className="btn-primary-staff" onClick={createStaff}>
              Create Account
            </button>

            {msg && (
              <div className={`status-msg ${msg.toLowerCase().includes("success") ? "success" : "error"}`}>
                {msg.toLowerCase().includes("success") ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}
                {msg}
              </div>
            )}
          </div>
        </section>

        {/* Staff List Section */}
        <section className="table-card">
          <div className="table-header">
            <h3>Active Team Members</h3>
          </div>
          <div className="table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
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
                          <span className="username">{s.username}</span>
                          <span className="user-role">Staff Member</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`pill ${s.is_active ? "pill-active" : "pill-disabled"}`}>
                        {s.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-cell">
                        <button
                          className={`btn-outline ${s.is_active ? "btn-danger" : "btn-success"}`}
                          onClick={() => toggleStatus(s.id, s.is_active)}
                        >
                          {s.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan="3" className="empty-state">No staff accounts found.</td>
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