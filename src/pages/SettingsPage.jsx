

import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./settingspage.css";
import { useLanguage } from "../context/LanguageContext";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip the data-URL prefix from a FileReader result and return [base64, ext] */
function parseDataUrl(dataUrl) {
  const [meta, data] = dataUrl.split(",");
  const mimeMatch = meta.match(/data:image\/(\w+);base64/);
  const ext = mimeMatch ? mimeMatch[1] : "png";
  return [data, ext === "jpeg" ? "jpg" : ext];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  icon,
  disabled = false
}) {
  const hasValue = value && value.length > 0;

  return (
    <div className={`input-group ${hasValue ? "has-value" : ""}`}>
      <label className="input-label">{label}</label>

      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field ${icon ? "input-field--with-icon" : ""}`}
        />
      </div>
    </div>
  );
}

function SectionTitle({ children, subtitle }) {
  return (
    <div className="section-title">
      <div className="section-title__row">
        <div className="section-title__line-left" />
        <h3 className="section-title__text">{children}</h3>
        <div className="section-title__line-right" />
      </div>
      {subtitle && <p className="section-title__sub">{subtitle}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [
    t("shop_profile"),
    t("change_password")
  ];

  // Shop Profile state
  const [shop, setShop] = useState({
    shop_name: "", address: "", phone: "",
    email: "", website: "", license_number: "", logo_path: "",
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoBase64, setLogoBase64]   = useState(null);
  const [logoExt, setLogoExt]         = useState(null);
  const [logoFilename, setLogoFilename] = useState(null);
  const [shopSaving, setShopSaving]   = useState(false);
  const [shopMsg, setShopMsg]         = useState({ text: "", ok: true });
  const fileInputRef = useRef();

  // Password state
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwMsg, setPwMsg]         = useState({ text: "", ok: true });

  // ── Load settings on mount ─────────────────────────────────────────────
  useEffect(() => {
    invoke("get_shop_settings")
      .then(data => setShop(data))
      .catch(err => console.error("Failed to load shop settings:", err));
  }, []);

  // ── Logo selection ─────────────────────────────────────────────────────
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const [b64, ext] = parseDataUrl(ev.target.result);
      setLogoPreview(ev.target.result);   // full data URL for <img>
      setLogoBase64(b64);                 // raw base64 for backend
      setLogoExt(ext);
    };
    reader.readAsDataURL(file);
  };

  // ── Save shop profile ──────────────────────────────────────────────────
  const handleSaveShop = async () => {
    setShopSaving(true);
    setShopMsg({ text: "", ok: true });
    try {
      const updated = await invoke("save_shop_settings", {
        payload: {
          shop_name:      shop.shop_name,
          address:        shop.address,
          phone:          shop.phone,
          email:          shop.email   || null,
          website:        shop.website || null,
          license_number: shop.license_number || null,
          logo_base64:    logoBase64 || null,
          logo_extension: logoExt    || null,
        },
      });
      setShop(updated);
      setLogoBase64(null);  // clear pending upload
      setLogoExt(null);
      setShopMsg({ text: "Shop profile saved successfully.", ok: true });
      setTimeout(() => setShopMsg({ text: "", ok: true }), 3500);
    } catch (err) {
      setShopMsg({ text: String(err), ok: false });
    } finally {
      setShopSaving(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwMsg({ text: "", ok: true });
    if (!passwords.current)
      return setPwMsg({ text: "Enter your current password.", ok: false });
    if (passwords.newPass.length < 8)
      return setPwMsg({ text: "New password must be at least 8 characters.", ok: false });
    if (passwords.newPass !== passwords.confirm)
      return setPwMsg({ text: "Passwords do not match.", ok: false });

    setPwSaving(true);
    try {
      // user_id should come from your auth context / localStorage
      const userId = Number(localStorage.getItem("user_id") ?? 1);
      const msg = await invoke("change_password", {
        payload: {
          user_id:          userId,
          current_password: passwords.current,
          new_password:     passwords.newPass,
        },
      });
      setPwMsg({ text: msg, ok: true });
      setPasswords({ current: "", newPass: "", confirm: "" });
      setTimeout(() => setPwMsg({ text: "", ok: true }), 4000);
    } catch (err) {
      setPwMsg({ text: String(err), ok: false });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Password strength ──────────────────────────────────────────────────
  const getPasswordScore = () => {
    const len = passwords.newPass.length;
    const hasSpecial = /[!@#$%^&*]/.test(passwords.newPass);
    const hasUpper   = /[A-Z]/.test(passwords.newPass);
    return (
      (len >= 8 ? 1 : 0) +
      (len >= 12 || hasSpecial ? 1 : 0) +
      (len >= 16 || (hasSpecial && hasUpper) ? 1 : 0)
    );
  };

  const strengthLabel = ["Too short", "Weak — add more characters", "Moderate — add symbols or uppercase", "Strong — well done"];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="settings-page">
      <div className="settings-container">

        {/* ── Page Header ── */}
        <div className="settings-header">
          <div className="settings-header__title-group">
            <div className="settings-header__icon-row">
              <div className="settings-header__icon">⚙</div>
              <h1 className="settings-header__title">{t("settings")}</h1>
            </div>
            <p className="settings-header__subtitle">{t("manage_shop_settings")}</p>
          </div>

        </div>
        <div className="settings-header__rule" />

        {/* ── Main Card ── */}
        <div className="settings-card" style={{ marginTop: "32px" }}>

          {/* Tabs */}
          <div className="settings-tabs">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                className={`settings-tab${activeTab === i ? " settings-tab--active" : ""}`}
                onClick={() => setActiveTab(i)}
              >{tab}</button>
            ))}
          </div>

          <div className="settings-panel">

            {/* ══════════════════════════════════════════════
                TAB 1 — SHOP PROFILE
                ══════════════════════════════════════════════ */}
            {activeTab === 0 && (
              <div className="settings-sections">

                {/* Logo Upload */}
                <div>
                  <SectionTitle subtitle={t("logo_receipt_description")}>
                  {t("store_logo")}
                  </SectionTitle>
                  <div className="logo-row">
                    <div className="logo-preview">
                      {(logoPreview || shop.logo_path) ? (
                        <img src={logoPreview ?? `asset://localhost/${shop.logo_path}`} alt="Shop logo" />
                      ) : (
                        <div className="logo-preview__empty">
                          <span className="logo-preview__empty-icon">🏪</span>
                          <span className="logo-preview__empty-text">NO LOGO</span>
                        </div>
                      )}
                    </div>
                    <div className="logo-dropzone" onClick={() => fileInputRef.current.click()}>
                      <div className="logo-dropzone__icon">📁</div>
                      <p className="logo-dropzone__label">{t("click_upload_logo")}</p>
                      <p className="logo-dropzone__hint">{t("logo_format_hint")}</p>
                      {logoFilename && (
                        <span className="logo-dropzone__filename">{logoFilename}</span>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLogoChange}
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div>
                  <SectionTitle subtitle={t("receipt_core_details")}>
                  {t("business_information")}
                  </SectionTitle>
                  <div className="grid-2">
                    <div className="col-span-2">
                      <InputField label={t("shop_name")} value={shop.shop_name}
                        onChange={v => setShop({ ...shop, shop_name: v })}
                        placeholder="e.g. Royal Gold &amp; Jewels" icon="🏪" />
                    </div>
                    <div className="col-span-2">
                      <InputField label={t("full_address")} value={shop.address}
                        onChange={v => setShop({ ...shop, address: v })}
                        placeholder="Street, City, State, PIN — as shown on receipts" icon="📍" />
                    </div>
                    <InputField label={t("phone_number")} value={shop.phone}
                      onChange={v => setShop({ ...shop, phone: v })}
                      placeholder="+91 98765 43210" icon="📞" />
                    <InputField label={t("email_address")} type="email" value={shop.email}
                      onChange={v => setShop({ ...shop, email: v })}
                      placeholder="shop@example.com" icon="✉" />
                  </div>
                </div>

                {/* Legal & Online */}
                <div>
                  <SectionTitle subtitle="Regulatory and online presence">
                    Legal &amp; Online
                  </SectionTitle>
                  <div className="grid-2">
                    <InputField label={t("website")} value={shop.website}
                      onChange={v => setShop({ ...shop, website: v })}
                      placeholder="www.yourshop.com" icon="🌐" />
                    <InputField label={t("license_number")} value={shop.license_number}
                      onChange={v => setShop({ ...shop, license_number: v })}
                      placeholder="e.g. PLM-2024-00123" icon="📋" />
                  </div>
                </div>

                {/* Live Receipt Preview */}
                {(shop.shop_name || shop.phone || shop.address) && (
                  <div>
                    <SectionTitle subtitle="How this appears on printed receipts">
                    {t("receipt_preview")}
                    </SectionTitle>
                    <div className="receipt-preview">
                      <div className="receipt-preview__header">
                        {logoPreview && (
                          <img src={logoPreview} alt="" className="receipt-preview__logo" />
                        )}
                        <div>
                          <div className="receipt-preview__shop-name">
                            {shop.shop_name || "Shop Name"}
                          </div>
                          {shop.license_number && (
                            <div className="receipt-preview__license">
                              Lic: {shop.license_number}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="receipt-preview__info">
                        {shop.address  && <div>📍 {shop.address}</div>}
                        {shop.phone    && <div>📞 {shop.phone}</div>}
                        {shop.email    && <div>✉ {shop.email}</div>}
                        {shop.website  && <div>🌐 {shop.website}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Bar */}
                <div className="save-bar">
                  <button
                    className="btn btn--gold"
                    onClick={handleSaveShop}
                    disabled={shopSaving}
                  >
                    {shopSaving
                      ? <><span className="btn__spinner">◌</span> {t("saving")}</>
                      : "✓ Save Profile"
                    }
                  </button>
                  {shopMsg.text && (
                    <span className={`save-bar__message save-bar__message--${shopMsg.ok ? "success" : "error"}`}>
                      {shopMsg.ok ? "✓" : "✕"} {shopMsg.text}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════
                TAB 2 — CHANGE PASSWORD
                ══════════════════════════════════════════════ */}
            {activeTab === 1 && (
              <div className="password-panel">
                <SectionTitle subtitle={t("password_security_subtitle")}>{t("update_password")}</SectionTitle>

                <div className="security-notice">
                  <span className="security-notice__icon">🔐</span>
                  <div>
                    <div className="security-notice__title">{t("security_notice")}</div>
                    <div className="security-notice__body">
                    {t("strong_password_hint")}
                    </div>
                  </div>
                </div>

                <div className="password-fields">
                  <InputField label={t("current_password")}type="password"
                    value={passwords.current}
                    onChange={v => setPasswords({ ...passwords, current: v })}
                    placeholder="Enter your current password" icon="🔑" />

                  <div className="field-divider" />

                  <InputField label={t("new_password")} type="password"
                    value={passwords.newPass}
                    onChange={v => setPasswords({ ...passwords, newPass: v })}
                    placeholder="Minimum 8 characters" icon="🔒" />

                  {/* Strength Meter */}
                  {passwords.newPass && (() => {
                    const score = getPasswordScore();
                    const colors = ["", "strength-meter__bar--1", "strength-meter__bar--2", "strength-meter__bar--3"];
                    return (
                      <div className="strength-meter">
                        <div className="strength-meter__label">{t("password_strength")}</div>
                        <div className="strength-meter__bars">
                          {[1, 2, 3].map(t => (
                            <div key={t}
                              className={`strength-meter__bar${score >= t ? ` ${colors[Math.min(score, 3)]}` : ""}`}
                            />
                          ))}
                        </div>
                        <div className="strength-meter__hint">
                          {strengthLabel[Math.min(score, 3)]}
                        </div>
                      </div>
                    );
                  })()}

                  <InputField label={t("confirm_new_password")} type="password"
                    value={passwords.confirm}
                    onChange={v => setPasswords({ ...passwords, confirm: v })}
                    placeholder="Re-enter new password" icon="🔒" />

                  {/* Match indicator */}
                  {passwords.confirm && passwords.newPass && (
                    <div className={`match-indicator match-indicator--${passwords.confirm === passwords.newPass ? "ok" : "bad"}`}>
                      {passwords.confirm === passwords.newPass
                        ? "✓ Passwords match"
                        : "✕ Passwords do not match"}
                    </div>
                  )}

                  {/* Feedback message */}
                  {pwMsg.text && (
                    <div className={`inline-message inline-message--${pwMsg.ok ? "success" : "error"}`}>
                      <span>{pwMsg.ok ? "✓" : "✕"}</span>
                      {pwMsg.text}
                    </div>
                  )}

                  <button
                    className="btn btn--gold"
                    onClick={handleChangePassword}
                    disabled={pwSaving}
                    style={{ alignSelf: "flex-start" }}
                  >
                    {pwSaving ? t("updating") : "🔐 Update Password"}
                  </button>
                </div>
              </div>
            )}

          </div>{/* /settings-panel */}
        </div>{/* /settings-card */}

        <div className="settings-footer">
          <p className="settings-footer__text">{t("pawn_system_settings")}</p>
        </div>
      </div>
    </div>
  );
}