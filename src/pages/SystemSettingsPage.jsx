import { useEffect, useState } from "react";
import { getSystemSettings, updateSystemSettings } from "../services/settingsApi";
import "./systemsettings.css";

export default function SystemSettingsPage() {

  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    interest_calculation_type: "SLAB_WITH_15",
    grace_days: 15,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();

        // Safety fallback
        if (data) {
          setSettings({
            interest_calculation_type: data.interest_calculation_type,
            grace_days: data.grace_days ?? 15,
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
      alert("Settings updated successfully");
    } catch (err) {
      console.error("Failed to update settings:", err);
      alert("Failed to update settings");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="settings-container">
      <h2>Interest Calculation Settings</h2>

      <div className="settings-card">
        <div className="form-group">
          <label>Interest Calculation Type</label>
          <select
            value={settings.interest_calculation_type}
            onChange={(e) =>
              setSettings({
                ...settings,
                interest_calculation_type: e.target.value,
              })
            }
          >
            <option value="MONTHLY">Fixed Monthly</option>
            <option value="DAILY">Daily Interest</option>
            <option value="SLAB_WITH_15">Slab With 15 Days (Auto)</option>
            <option value="SLAB_WITH_CUSTOM">Slab With Custom Grace</option>
          </select>
        </div>

        {/* Show Grace Days only for CUSTOM */}
        {settings.interest_calculation_type === "SLAB_WITH_CUSTOM" && (
          <div className="form-group">
            <label>Grace Days</label>
            <input
              type="number"
              min="1"
              value={settings.grace_days}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  grace_days: Number(e.target.value),
                })
              }
            />
          </div>
        )}

        <button className="save-btn" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
