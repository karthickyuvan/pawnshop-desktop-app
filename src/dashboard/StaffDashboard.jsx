import { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import PageRenderer from "./PageRenderer";

export default function StaffDashboard({user}) {
  const [activeMenu, setActiveMenu] = useState("home");

  return (
    <DashboardLayout
      role="STAFF"
      onMenuChange={setActiveMenu}
    >
      <PageRenderer activeKey={activeMenu} user={user} setActiveMenu={setActiveMenu}/>
    </DashboardLayout>
  );
}
