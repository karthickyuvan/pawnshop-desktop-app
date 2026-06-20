// import { useEffect, useState } from "react";
// import { getSystemSettings, updateSystemSettings } from "../services/settingsApi";
// import { useLanguage } from "../context/LanguageContext";
// import "./systemsettings.css";

// export default function SystemSettingsPage() {
//   const { t } = useLanguage();
//   const [loading, setLoading] = useState(true);
//   const [settings, setSettings] = useState({
//     interest_calculation_type: "SLAB_WITH_HALF",
//     grace_days: 5,
//     auction_after_months: 36,
//   });
//   const [saving, setSaving] = useState(false); 
//   const [message, setMessage] = useState({ text: "", type: "" }); 

//   const MODE_DESCRIPTIONS = {
//     DAILY: {
//       label: t("fixed_monthly"),
//       description: t("daily_interest_desc", "Interest accrues every single day. Rate = (principal × rate%) ÷ 30 × days elapsed."),
//       example: t("daily_interest_example", "₹50,000 @ 5% — day 15 → ₹1,250 due | day 45 → ₹3,750 due"),
//     },
//     MONTHLY: {
//       label: t("monthly_full_blocks", "Monthly (full months only)"),
//       description: t("monthly_desc", "Only complete 30-day blocks are charged. Partial days within an incomplete month are free."),
//       example: t("monthly_example", "Day 31 → ₹0 extra | Day 61 → ₹2,500 | Day 91 → ₹5,000"),
//     },
//     SLAB_WITH_HALF: {
//       label: t("slab_with_15"), 
//       description: t("slab_with_15_desc", "After each completed month: days 1–15 extra = half month interest, days 16–30 extra = full month interest. No grace period."),
//       example: t("slab_with_15_example", "Day 31–45 → ₹1,250 (half) | Day 46–60 → ₹2,500 (full) | Day 61–75 → ₹3,750"),
//     },
//     SLAB_WITH_CUSTOM: {
//       label: t("slab_custom_grace"), 
//       description: t("slab_custom_grace_desc", "After each completed month: days 1–N = free (grace), days N+1–N+15 = half month interest, days N+16–30 = full month interest."),
//       example: t("slab_custom_grace_example", "Grace = 5: Day 1–35 → ₹0 | Day 36–50 → ₹1,250 (half) | Day 51–60 → ₹2,500 (full)"),
//     },
//   };

//   useEffect(() => {
//     const fetchSettings = async () => {
//       try {
//         const data = await getSystemSettings();
//         if (data) {
//           setSettings({
//             interest_calculation_type: data.interest_calculation_type,
//             grace_days: data.grace_days ?? 5,
//             auction_after_months: data.auction_after_months ?? 36,
//           });
//         }
//       } catch (err) {
//         console.error("Failed to load settings:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchSettings();
//   }, []);

//   const handleSave = async () => {
//     setSaving(true);
//     setMessage({ text: "", type: "" }); 
//     try {
//       await updateSystemSettings(settings);
//       setMessage({ text: t("settings_updated"), type: "success" });
//       setTimeout(() => setMessage({ text: "", type: "" }), 3000);
//     } catch (err) {
//       console.error("Failed to update settings:", err);
//       setMessage({ text: t("settings_update_failed"), type: "error" });
//     } finally {
//       setSaving(false);
//     }
//   };

//   const currentMode = MODE_DESCRIPTIONS[settings.interest_calculation_type];

//   if (loading) return <div className="loading">{t("loading")}</div>;

//   return (
//     <div className="settings-container">
//       <h2>{t("interest_calculation_settings")}</h2>

//       <div className="settings-card">
//         {message.text && (
//           <div className={`status-message ${message.type}`}>
//             {message.text}
//           </div>
//         )}

//         {/* ── Mode selector ── */}
//         <div className="form-group">
//           <label>{t("interest_calculation_type")}</label>
//           <select
//             value={settings.interest_calculation_type}
//             onChange={(e) =>
//               setSettings({ ...settings, interest_calculation_type: e.target.value })
//             }
//           >
//             <option value="DAILY">{t("daily_interest")}</option>
//             <option value="MONTHLY">{t("fixed_monthly")}</option>
//             <option value="SLAB_WITH_HALF">{t("slab_with_15")}</option>
//             <option value="SLAB_WITH_CUSTOM">{t("slab_custom_grace")}</option>
//           </select>
//         </div>

//         {/* ── Mode description card ── */}
//         {currentMode && (
//           <div className="mode-info-banner">
//             <div className="mode-info-title">
//               {currentMode.label}
//             </div>
//             <div className="mode-info-description">
//               {currentMode.description}
//             </div>
//             <div className="mode-info-example">
//               {t("example", "Example")} ({t("example_values", "₹50,000 @ 5%")}): {currentMode.example}
//             </div>
//           </div>
//         )}

//         {/* ── Grace days input — only for SLAB_WITH_CUSTOM ── */}
//         {settings.interest_calculation_type === "SLAB_WITH_CUSTOM" && (
//           <div className="form-group">
//             <label>
//               {t("grace_days")}
//               <span className="label-hint-span">
//                 ({t("grace_days_hint", "days 1–N after a completed month are free")})
//               </span>
//             </label>
//             <input
//               type="number"
//               min="1"
//               max="14"
//               value={settings.grace_days}
//               onChange={(e) =>
//                 setSettings({ ...settings, grace_days: Number(e.target.value) })
//               }
//             />
//             <div className="form-group-helper-text">
//               {t("after_grace_prefix", "After grace: days")} {settings.grace_days + 1}–{settings.grace_days + 15} = {t("half_month_interest", "half month interest")}, {t("days", "days")} {settings.grace_days + 16}–30 = {t("full_month_interest", "full month interest")}.
//             </div>
//           </div>
//         )}

//         <hr className="settings-divider" />

//         {/* ── Auction settings section ── */}
//         <h3>{t("auction_settings", "Auction Settings")}</h3>

//         <div className="form-group">
//           <label>{t("auction_eligible_months", "Auction Eligible After (Months)")}</label>
//           <input
//             type="number"
//             min="1"
//             max="120"
//             value={settings.auction_after_months}
//             onChange={(e) =>
//               setSettings({
//                 ...settings,
//                 auction_after_months: Number(e.target.value),
//               })
//             }
//           />

//           <div className="form-group-helper-text">
//             {t("auction_eligibility_rules", "A pledge becomes auction eligible only when:")}
//             <br />
//             • {t("pledge_age_rule", "Pledge age is at least")} {settings.auction_after_months} {t("months", "months")}
//             <br />
//             • {t("no_payment_rule", "No payment has been received for at least")} {settings.auction_after_months} {t("months", "months")}
//           </div>
//         </div>

//         <button className="save-btn" onClick={handleSave} disabled={saving}>
//           {saving ? t("saving") : t("save_settings")}
//         </button>
//       </div>
//     </div>
//   );
// }




import { useEffect, useState } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { getSystemSettings, updateSystemSettings } from "../services/settingsApi";
import { useLanguage } from "../context/LanguageContext";
import "./systemsettings.css";

export default function SystemSettingsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    interest_calculation_type: "SLAB_WITH_HALF",
    grace_days: 5,
    auction_after_months: 36,
  });
  const [saving, setSaving] = useState(false); 

  const MODE_DESCRIPTIONS = {
    DAILY: {
      label: t("fixed_monthly"),
      description: t("daily_interest_desc", "Interest accrues every single day. Rate = (principal × rate%) ÷ 30 × days elapsed."),
      example: t("daily_interest_example", "₹50,000 @ 5% — day 15 → ₹1,250 due | day 45 → ₹3,750 due"),
    },
    MONTHLY: {
      label: t("monthly_full_blocks", "Monthly (full months only)"),
      description: t("monthly_desc", "Only complete 30-day blocks are charged. Partial days within an incomplete month are free."),
      example: t("monthly_example", "Day 31 → ₹0 extra | Day 61 → ₹2,500 | Day 91 → ₹5,000"),
    },
    SLAB_WITH_HALF: {
      label: t("slab_with_15"), 
      description: t("slab_with_15_desc", "After each completed month: days 1–15 extra = half month interest, days 16–30 extra = full month interest. No grace period."),
      example: t("slab_with_15_example", "Day 31–45 → ₹1,250 (half) | Day 46–60 → ₹2,500 (full) | Day 61–75 → ₹3,750"),
    },
    SLAB_WITH_CUSTOM: {
      label: t("slab_custom_grace"), 
      description: t("slab_custom_grace_desc", "After each completed month: days 1–N = free (grace), days N+1–N+15 = half month interest, days N+16–30 = full month interest."),
      example: t("slab_custom_grace_example", "Grace = 5: Day 1–35 → ₹0 | Day 36–50 → ₹1,250 (half) | Day 51–60 → ₹2,500 (full)"),
    },
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();
        if (data) {
          setSettings({
            interest_calculation_type: data.interest_calculation_type,
            grace_days: data.grace_days ?? 5,
            auction_after_months: data.auction_after_months ?? 36,
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        toast.error(t("failed_load_settings", "Failed to retrieve calculation rules metadata."));
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      toast.success(t("settings_updated", "System parameters updated successfully!")); // 🚀 Success Toast
    } catch (err) {
      console.error("Failed to update settings:", err);
      toast.error(t("settings_update_failed", "Failed to rewrite system settings schemas.")); // 🚀 Failure Toast
    } finally {
      setSaving(false);
    }
  };

  const currentMode = MODE_DESCRIPTIONS[settings.interest_calculation_type];

  if (loading) return <div className="loading">{t("loading")}</div>;

  return (
    <div className="settings-container">
      <h2>{t("interest_calculation_settings")}</h2>

      <div className="settings-card">
        {/* ── Mode selector ── */}
        <div className="form-group">
          <label>{t("interest_calculation_type")}</label>
          <select
            value={settings.interest_calculation_type}
            onChange={(e) =>
              setSettings({ ...settings, interest_calculation_type: e.target.value })
            }
            disabled={saving}
          >
            <option value="DAILY">{t("daily_interest")}</option>
            <option value="MONTHLY">{t("fixed_monthly")}</option>
            <option value="SLAB_WITH_HALF">{t("slab_with_15")}</option>
            <option value="SLAB_WITH_CUSTOM">{t("slab_custom_grace")}</option>
          </select>
        </div>

        {/* ── Mode description card ── */}
        {currentMode && (
          <div className="mode-info-banner">
            <div className="mode-info-title">
              {currentMode.label}
            </div>
            <div className="mode-info-description">
              {currentMode.description}
            </div>
            <div className="mode-info-example">
              {t("example", "Example")} ({t("example_values", "₹50,000 @ 5%")}): {currentMode.example}
            </div>
          </div>
        )}

        {/* ── Grace days input — only for SLAB_WITH_CUSTOM ── */}
        {settings.interest_calculation_type === "SLAB_WITH_CUSTOM" && (
          <div className="form-group">
            <label>
              {t("grace_days")}
              <span className="label-hint-span">
                ({t("grace_days_hint", "days 1–N after a completed month are free")})
              </span>
            </label>
            <input
              type="number"
              min="1"
              max="14"
              value={settings.grace_days}
              onChange={(e) =>
                setSettings({ ...settings, grace_days: Number(e.target.value) })
              }
              disabled={saving}
            />
            <div className="form-group-helper-text">
              {t("after_grace_prefix", "After grace: days")} {settings.grace_days + 1}–{settings.grace_days + 15} = {t("half_month_interest", "half month interest")}, {t("days", "days")} {settings.grace_days + 16}–30 = {t("full_month_interest", "full month interest")}.
            </div>
          </div>
        )}

        <hr className="settings-divider" />

        {/* ── Auction settings section ── */}
        <h3>{t("auction_settings", "Auction Settings")}</h3>

        <div className="form-group">
          <label>{t("auction_eligible_months", "Auction Eligible After (Months)")}</label>
          <input
            type="number"
            min="1"
            max="120"
            value={settings.auction_after_months}
            onChange={(e) =>
              setSettings({
                ...settings,
                auction_after_months: Number(e.target.value),
              })
            }
            disabled={saving}
          />

          <div className="form-group-helper-text">
            {t("auction_eligibility_rules", "A pledge becomes auction eligible only when:")}
            <br />
            • {t("pledge_age_rule", "Pledge age is at least")} {settings.auction_after_months} {t("months", "months")}
            <br />
            • {t("no_payment_rule", "No payment has been received for at least")} {settings.auction_after_months} {t("months", "months")}
          </div>
        </div>

        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? t("saving") : t("save_settings")}
        </button>
      </div>
    </div>
  );
}