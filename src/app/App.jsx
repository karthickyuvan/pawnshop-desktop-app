// import { useEffect, useState } from "react";
// import { checkOwner } from "../services/tauriApi";
// import CreateOwner from "../auth/CreateOwner";
// import Login from "../auth/Login";
// import { useAuthStore } from "../auth/authStore";
// import OwnerDashboard from "../dashboard/OwnerDashboard";
// import StaffDashboard from "../dashboard/StaffDashboard";


// export default function App() {
//   const [ownerExists, setOwnerExists] = useState(null);
//   const user = useAuthStore((s) => s.user);

//   // useEffect(() => {
//   //   checkOwner().then(setOwnerExists);
//   // }, []);
// useEffect(() => {
//   const init = async () => {
//     try {
//       const result = await checkOwner();

//       console.log("OWNER EXISTS:", result);

//       // Browser fallback
//       if (result === null || result === undefined) {
//         setOwnerExists(false);
//       } else {
//         setOwnerExists(result);
//       }
//     } catch (err) {
//       console.error(err);

//       // Prevent infinite loading
//       setOwnerExists(false);
//     }
//   };

//   init();
// }, []);
//   // 🔍 DEBUG (TEMPORARY)
//   console.log("AUTH USER:", user);

//   if (ownerExists === null) {
//     return <p>Loading...</p>;
//   }

//   // FIRST TIME → CREATE OWNER
//   if (!ownerExists) {
//     return <CreateOwner onCreated={() => setOwnerExists(true)} />;
//   }

//   // NOT LOGGED IN
//   if (!user) {
//     return <Login />;
//   }

//   // OWNER DASHBOARD
//   if (user.role === "OWNER") {
//     return <OwnerDashboard user={user}/>;
//   }

//   // STAFF DASHBOARD 
//   if (user.role === "STAFF") {
//     return <StaffDashboard user={user}/>;
//   }
// }






import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core"; // 🔥 Tauri v2 core call-ku idhu venum boss
import { checkOwner } from "../services/tauriApi";
import CreateOwner from "../auth/CreateOwner";
import Login from "../auth/Login";
import { useAuthStore } from "../auth/authStore";
import OwnerDashboard from "../dashboard/OwnerDashboard";
import StaffDashboard from "../dashboard/StaffDashboard";

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false); // 🔥 New state for DB verification
  const [ownerExists, setOwnerExists] = useState(null);
  const [dbError, setDbError] = useState(false); // 🔥 New safety error indicator
  const user = useAuthStore((s) => s.user);

  // 1. 🔥 FIRST STEP: Handshake with Rust Backend
  useEffect(() => {
    let isMounted = true;

    async function verifyBackendHandshake() {
      let retries = 0;
      const maxRetries = 50; // Max 5 seconds total timeout wait

      while (retries < maxRetries && isMounted) {
        try {
          // Namma Rust-la ezhudhiya command-a trigger panrom
          const ready = await invoke("is_backend_ready");
          if (ready) {
            setIsDbReady(true);
            return; // Exit loop, connection successful!
          }
        } catch (error) {
          console.log(`Waiting for local SQLite runtime initialization... Attempt: ${retries + 1}`,error);
        }
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms slow loop delay
      }

      if (isMounted && retries >= maxRetries) {
        setDbError(true);
      }
    }

    verifyBackendHandshake();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. ⚡ SECOND STEP: Existing Owner Verification (Run aagum conditionally after DB is ready)
  useEffect(() => {
    if (!isDbReady) return; // 🛑 DB ready aagla na indha initialize trigger-e aagadhu!

    const init = async () => {
      try {
        const result = await checkOwner();
        console.log("OWNER EXISTS:", result);

        if (result === null || result === undefined) {
          setOwnerExists(false);
        } else {
          setOwnerExists(result);
        }
      } catch (err) {
        console.error(err);
        setOwnerExists(false); // Prevent infinite block screens
      }
    };

    init();
  }, [isDbReady]); // 🔥 Listens directly to dynamic database ready status change!

  // 🔍 DEBUG (TEMPORARY)
  console.log("AUTH USER:", user);

  // Phase A: Database is securing connection hooks
  if (!isDbReady) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        height: "100vh", backgroundColor: "#111827", color: "#ffffff", fontFamily: "sans-serif"
      }}>
        {dbError ? (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "#ef4444" }}>⚠️ Secure Database Handshake Failed</h2>
            <p style={{ color: "#9ca3af" }}>Please check local AppData folder access writes or restart the app.</p>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{
              border: "4px solid rgba(255,255,255,0.1)", width: "40px", height: "40px",
              borderRadius: "50%", borderLeftColor: "#3b82f6", animation: "spin 1s linear infinite",
              margin: "0 auto 20px auto"
            }}></div>
            <h2>Pawnshop System Connecting...</h2>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>Configuring localized single-file environment buffers...</p>
          </div>
        )}
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Phase B: Waiting for database owner table configuration check
  if (ownerExists === null) {
    return (
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        height: "100vh", backgroundColor: "#111827", color: "#ffffff", fontFamily: "sans-serif"
      }}>
         <p>Verifying Credentials System...</p>
      </div>
    );
  }

  // FIRST TIME → CREATE OWNER
  if (!ownerExists) {
    return <CreateOwner onCreated={() => setOwnerExists(true)} />;
  }

  // NOT LOGGED IN
  if (!user) {
    return <Login />;
  }

  // OWNER DASHBOARD
  if (user.role === "OWNER") {
    return <OwnerDashboard user={user}/>;
  }

  // STAFF DASHBOARD 
  if (user.role === "STAFF") {
    return <StaffDashboard user={user}/>;
  }
}