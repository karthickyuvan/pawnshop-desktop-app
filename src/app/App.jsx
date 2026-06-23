// src/app/App.jsx
import { useEffect, useState, useRef } from "react"; // Added useRef here
import { invoke } from "@tauri-apps/api/core"; 
import { checkOwner } from "../services/tauriApi";
import CreateOwner from "../auth/CreateOwner";
import Login from "../auth/Login";
import { useAuthStore } from "../auth/authStore";
import OwnerDashboard from "../dashboard/OwnerDashboard";
import StaffDashboard from "../dashboard/StaffDashboard";
import toast from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext"; // Import language hook

export default function App() {
  const { t } = useLanguage(); // Initialize translation hook
  const [isDbReady, setIsDbReady] = useState(false); 
  const [ownerExists, setOwnerExists] = useState(null);
  const [dbError, setDbError] = useState(false); 
  const user = useAuthStore((s) => s.user);

  // ── Ref guard to prevent duplicate toast messages ──
  const hasToastedRef = useRef(false);

  // 1. FIRST STEP: Handshake with Rust Backend
  useEffect(() => {
    let isMounted = true;

    async function verifyBackendHandshake() {
      let retries = 0;
      const maxRetries = 50; 

      while (retries < maxRetries && isMounted) {
        try {
          const ready = await invoke("is_backend_ready");
          if (ready) {
            setIsDbReady(true);
            
            // Only fire the toast if it hasn't been shown yet
            if (!hasToastedRef.current) {
              toast.success(t("database_connected", "Database connected successfully!")); 
              hasToastedRef.current = true;
            }
            return; 
          }
        } catch (error) {
          console.log(`Waiting for local SQLite runtime initialization... Attempt: ${retries + 1}`, error);
        }
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 100)); 
      }

      if (isMounted && retries >= maxRetries) {
        setDbError(true);
      }
    }

    verifyBackendHandshake();

    return () => {
      isMounted = false;
    };
  }, [t]);

  // 2. SECOND STEP: Existing Owner Verification
  useEffect(() => {
    if (!isDbReady) return; 

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
        setOwnerExists(false); 
      }
    };

    init();
  }, [isDbReady]);

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
            <h2 style={{ color: "#ef4444" }}>{t("secure_db_handshake_failed", "⚠️ Secure Database Handshake Failed")}</h2>
            <p style={{ color: "#9ca3af" }}>{t("db_error_description", "Please check local AppData folder access writes or restart the app.")}</p>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{
              border: "4px solid rgba(255,255,255,0.1)", width: "40px", height: "40px",
              borderRadius: "50%", borderLeftColor: "#3b82f6", animation: "spin 1s linear infinite",
              margin: "0 auto 20px auto"
            }}></div>
            <h2>{t("pawnshop_system_connecting", "Pawnshop System Connecting...")}</h2>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>{t("configuring_buffers", "Configuring localized single-file environment buffers...")}</p>
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
         <p>{t("verifying_credentials", "Verifying Credentials System...")}</p>
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