
import { useEffect, useState } from "react";
import { getSystemSettings, updateSystemSettings } from "../services/settingsApi";
import { useLanguage } from "../context/LanguageContext";
import "./systemsettings.css";

// ─── What each mode means (shown as helper text under the dropdown) ───────────
const MODE_DESCRIPTIONS = {
  DAILY: {
    label: "Daily Interest",
    description:
      "Interest accrues every single day. Rate = (principal × rate%) ÷ 30 × days elapsed.",
    example: "₹50,000 @ 5% — day 15 → ₹1,250 due | day 45 → ₹3,750 due",
  },
  MONTHLY: {
    label: "Monthly (full months only)",
    description:
      "Only complete 30-day blocks are charged. Partial days within an incomplete month are free.",
    example: "Day 31 → ₹0 extra | Day 61 → ₹2,500 | Day 91 → ₹5,000",
  },
  SLAB_WITH_HALF: {
    label: "Slab — Half month / Full month (15-day boundary)",
    description:
      "After each completed month: days 1–15 extra = half month interest, days 16–30 extra = full month interest. No grace period.",
    example: "Day 31–45 → ₹1,250 (half) | Day 46–60 → ₹2,500 (full) | Day 61–75 → ₹3,750",
  },
  SLAB_WITH_CUSTOM: {
    label: "Slab — Grace + Half + Full (configurable grace days)",
    description:
      "After each completed month: days 1–N = free (grace), days N+1–N+15 = half month interest, days N+16–30 = full month interest.",
    example:
      "Grace = 5: Day 1–35 → ₹0 | Day 36–50 → ₹1,250 (half) | Day 51–60 → ₹2,500 (full)",
  },
};

export default function SystemSettingsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    interest_calculation_type: "SLAB_WITH_HALF",
    grace_days: 5,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();
        if (data) {
          setSettings({
            interest_calculation_type: data.interest_calculation_type,
            grace_days: data.grace_days ?? 5,
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await updateSystemSettings(settings);
      alert(t("settings_updated"));
    } catch (err) {
      console.error("Failed to update settings:", err);
      alert(t("settings_update_failed"));
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
          >
            <option value="DAILY">Daily interest</option>
            <option value="MONTHLY">Monthly (full months only)</option>
            <option value="SLAB_WITH_HALF">Slab — half month / full month (15-day split)</option>
            <option value="SLAB_WITH_CUSTOM">Slab — grace + half + full (custom grace days)</option>
          </select>
        </div>

        {/* ── Mode description card ── */}
        {currentMode && (
          <div
            style={{
              background: "var(--color-background-info, #eff6ff)",
              border: "1px solid var(--color-border-info, #93c5fd)",
              borderRadius: "10px",
              padding: "14px 16px",
              marginTop: "4px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontWeight: "500",
                fontSize: "13px",
                marginBottom: "6px",
                color: "var(--color-text-info, #1d4ed8)",
              }}
            >
              {currentMode.label}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--color-text-secondary)",
                marginBottom: "6px",
                lineHeight: "1.5",
              }}
            >
              {currentMode.description}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                fontStyle: "italic",
              }}
            >
              Example (₹50,000 @ 5%): {currentMode.example}
            </div>
          </div>
        )}

        {/* ── Grace days input — only for SLAB_WITH_CUSTOM ── */}
        {settings.interest_calculation_type === "SLAB_WITH_CUSTOM" && (
          <div className="form-group">
            <label>
              {t("grace_days")}
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "400",
                  color: "var(--color-text-secondary)",
                  marginLeft: "8px",
                }}
              >
                (days 1–N after a completed month are free)
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
            />
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                marginTop: "4px",
              }}
            >
              After grace: days {settings.grace_days + 1}–{settings.grace_days + 15} = half
              month interest, days {settings.grace_days + 16}–30 = full month interest.
            </div>
          </div>
        )}

        <button className="save-btn" onClick={handleSave}>
          {t("save_settings")}
        </button>
      </div>
    </div>
  );
}