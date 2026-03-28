
import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";
import { ownerMenu } from "./menuConfig";
import { staffMenu } from "./staffMenuConfig";
import "./dashboardLayout.css";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../context/LanguageContext";

export default function DashboardLayout({ children, onMenuChange, role }) {

  const logout = useAuthStore((s) => s.logout);

  const [active, setActive] = useState("home");
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [shopName, setShopName] = useState("Pawnshop");

  const menuConfig = role === "STAFF" ? staffMenu : ownerMenu;

  const { language, setLanguage, t } = useLanguage();

  // Accordion toggle
  const toggleExpand = (key) => {
    setExpandedMenu(expandedMenu === key ? null : key);
  };

  // Menu click
  const handleMenuClick = (key) => {
    setActive(key);
    onMenuChange?.(key);
  };

  // Global menu change listener
  useEffect(() => {

    const handler = (e) => {
      setActive(e.detail);
      onMenuChange?.(e.detail);
    };

    window.addEventListener("menu-change", handler);

    return () => window.removeEventListener("menu-change", handler);

  }, [onMenuChange]);

  // Load shop name
  useEffect(() => {

    invoke("get_shop_settings")
      .then((data) => {
        if (data?.shop_name) {
          setShopName(data.shop_name);
        }
      })
      .catch((err) => console.error("Failed to load shop name:", err));

  }, []);

  return (
    <div className="dashboard-wrapper">

      {/* SIDEBAR */}
      <aside className="sidebar">

        {/* SHOP NAME */}
        <div className="sidebar-brand">{shopName}</div>

        {/* MENU */}
        <div className="sidebar-menu">

          {menuConfig.map((menu) => (

            <div key={menu.titleKey}>

              {/* LEVEL 1 */}
              <div
                className="menu-title clickable"
                onClick={() =>
                  menu.children
                    ? toggleExpand(menu.titleKey)
                    : handleMenuClick(menu.key)
                }
              >
                {t(menu.titleKey)}

                {menu.children && (
                  <span className="arrow">
                    {expandedMenu === menu.titleKey ? "▼" : "▶"}
                  </span>
                )}
              </div>

              {/* LEVEL 2 */}
              {menu.children &&
                expandedMenu === menu.titleKey &&
                menu.children.map((child) => {

                  // LEVEL 3 GROUP
                  if (child.children) {
                    return (
                      <div key={child.titleKey}>

                        <div
                          className="sub-group clickable"
                          onClick={() => toggleExpand(child.titleKey)}
                        >
                          {t(child.titleKey)}

                          <span className="arrow">
                            {expandedMenu === child.titleKey ? "▼" : "▶"}
                          </span>
                        </div>

                        {expandedMenu === child.titleKey &&
                          child.children.map((sub) => (
                            <div
                              key={sub.key}
                              className={`menu-item ${
                                active === sub.key ? "active" : ""
                              }`}
                              style={{ paddingLeft: "32px" }}
                              onClick={() => handleMenuClick(sub.key)}
                            >
                              {t(sub.titleKey)}
                            </div>
                          ))}

                      </div>
                    );
                  }

                  // LEVEL 2 NORMAL
                  return (
                    <div
                      key={child.key}
                      className={`menu-item ${
                        active === child.key ? "active" : ""
                      }`}
                      onClick={() => handleMenuClick(child.key)}
                    >
                      {t(child.titleKey)}
                    </div>
                  );

                })}

            </div>

          ))}

        </div>

        {/* SIDEBAR FOOTER */}
        <div className="sidebar-footer">

          <div className="footer-text">
            Designed & Developed By <span>E3D Designs</span>
          </div>

          <button className="sidebar-logout-btn" onClick={logout}>
            {t("logout")}
          </button>

        </div>

      </aside>

      {/* MAIN AREA */}
      <main className="main">

        <header className="header">

          <span className="header-role">{role}</span>

          <div className="language-switcher">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>

        </header>

        <section className="content">
          {children}
        </section>

      </main>

    </div>
  );
}
