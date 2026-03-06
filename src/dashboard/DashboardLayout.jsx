import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";
import { ownerMenu } from "./menuConfig";
import { staffMenu } from "./staffMenuConfig";
import "./dashboardLayout.css";

export default function DashboardLayout({ children, onMenuChange, role }) {
  const logout = useAuthStore((s) => s.logout);

  const [active, setActive] = useState("home");
  
  // ✅ CHANGED: Single state to track which ONE menu is expanded
  const [expandedMenu, setExpandedMenu] = useState(null);

  const menuConfig = role === "STAFF" ? staffMenu : ownerMenu;

  // ✅ CHANGED: Accordion toggle - only one menu open at a time
  const toggleExpand = (key) => {
    if (expandedMenu === key) {
      // If clicking the already-open menu, close it
      setExpandedMenu(null);
    } else {
      // Otherwise, open this menu (and close any other)
      setExpandedMenu(key);
    }
  };

  // Centralized menu handler
  const handleMenuClick = (key) => {
    setActive(key);
    onMenuChange?.(key);
  };

  // Listen for menu-change events (from buttons like Bank Mapping)
  useEffect(() => {
    const handler = (e) => {
      setActive(e.detail);
      onMenuChange?.(e.detail);
    };

    window.addEventListener("menu-change", handler);
    return () => window.removeEventListener("menu-change", handler);
  }, [onMenuChange]);

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">Pawnshop</div>

        {menuConfig.map((menu) => (
          <div key={menu.title}>
            {/* LEVEL 1 */}
            <div
              className="menu-title clickable"
              onClick={() =>
                menu.children
                  ? toggleExpand(menu.title)
                  : handleMenuClick(menu.key)
              }
            >
              {menu.title}
              {menu.children && (
                <span className="arrow">
                  {/* ✅ CHANGED: Check against expandedMenu instead of expanded[menu.title] */}
                  {expandedMenu === menu.title ? "▼" : "▶"}
                </span>
              )}
            </div>

            {/* LEVEL 2 */}
            {/* ✅ CHANGED: Check against expandedMenu instead of expanded[menu.title] */}
            {menu.children &&
              expandedMenu === menu.title &&
              menu.children.map((child) => {
                // LEVEL 3 (nested submenu)
                if (child.children) {
                  return (
                    <div key={child.title}>
                      <div
                        className="sub-group clickable"
                        onClick={() => toggleExpand(child.title)}
                      >
                        {child.title}
                        <span className="arrow">
                          {/* ✅ CHANGED: Check against expandedMenu */}
                          {expandedMenu === child.title ? "▼" : "▶"}
                        </span>
                      </div>

                      {/* ✅ CHANGED: Check against expandedMenu */}
                      {expandedMenu === child.title &&
                        child.children.map((sub) => (
                          <div
                            key={sub.key}
                            className={`menu-item ${
                              active === sub.key ? "active" : ""
                            }`}
                            style={{ paddingLeft: "32px" }}
                            onClick={() => handleMenuClick(sub.key)}
                          >
                            {sub.title}
                          </div>
                        ))}
                    </div>
                  );
                }

                // NORMAL LEVEL 2
                return (
                  <div
                    key={child.key}
                    className={`menu-item ${
                      active === child.key ? "active" : ""
                    }`}
                    onClick={() => handleMenuClick(child.key)}
                  >
                    {child.title}
                  </div>
                );
              })}
          </div>
        ))}
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="header">
          <span className="header-role">{role}</span>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </header>

        <section className="content">{children}</section>
      </main>
    </div>
  );
}