import { useEffect, useState } from "react";
import { checkOwner } from "../services/tauriApi";
import CreateOwner from "../auth/CreateOwner";
import Login from "../auth/Login";
import { useAuthStore } from "../auth/authStore";
import OwnerDashboard from "../dashboard/OwnerDashboard";
import StaffDashboard from "../dashboard/StaffDashboard";


export default function App() {
  const [ownerExists, setOwnerExists] = useState(null);
  const user = useAuthStore((s) => s.user);

  // useEffect(() => {
  //   checkOwner().then(setOwnerExists);
  // }, []);
useEffect(() => {
  const init = async () => {
    try {
      const result = await checkOwner();

      console.log("OWNER EXISTS:", result);

      // Browser fallback
      if (result === null || result === undefined) {
        setOwnerExists(false);
      } else {
        setOwnerExists(result);
      }
    } catch (err) {
      console.error(err);

      // Prevent infinite loading
      setOwnerExists(false);
    }
  };

  init();
}, []);
  // 🔍 DEBUG (TEMPORARY)
  console.log("AUTH USER:", user);

  if (ownerExists === null) {
    return <p>Loading...</p>;
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
