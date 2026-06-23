
// version 3
import { useEffect, useState } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast
import { useAuthStore } from "../auth/authStore";
import { getMetalTypes, createMetalType, toggleMetalType } from "../services/metalTypesApi";
import { useLanguage } from "../context/LanguageContext";
import "./loanTypes.css";

export default function LoanTypesPages() {
  const user = useAuthStore((s) => s.user);
  const { t } = useLanguage();

  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false); // 🚀 Track submission state

  const load = async () => {
    try {
      const data = await getMetalTypes();
      setList(data || []);
    } catch (err) {
      console.error(err);
      toast.error(t("failed_to_load_metals", "Failed to load metal configurations."));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!name.trim()) {
      toast.error(t("metal_name_required", "Metal category name is required.")); // 🚀 Converted status message banner to clean error toast
      return;
    }

    const userId = user?.user_id || user?.id;
    if (!userId) {
      toast.error(t("session_expired", "Session expired. Please log in again."));
      return;
    }

    try {
      setLoading(true);
      await createMetalType({
        name: name.trim(),
        actorUserId: userId,
      });

      toast.success(t("metal_created", "Metal category added successfully!")); // 🚀 Success feedback toast
      setName("");
      await load();
    } catch (e) {
      toast.error(e?.toString() || t("operation_failed"));
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, current) => {
    const userId = user?.user_id || user?.id;
    try {
      await toggleMetalType({
        metalTypeId: id,
        isActive: !current,
        actorUserId: userId,
      });

      toast.success(
        !current 
          ? t("metal_enabled", "Metal category enabled!") 
          : t("metal_disabled", "Metal category disabled!")
      ); // 🚀 Contextual toggle success feedback toast
      await load();
    } catch (e) {
      toast.error(t("toggle_failed", "Failed to change status: ") + e.toString());
    }
  };

  return (
    <div className="metal-page">
      <h2 className="page-title">{t("metal_types")}</h2>

      {/* CREATE FORM */}
      <div className="metal-form">
        <input
          placeholder={t("metal_type_placeholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        <button onClick={submit} disabled={loading}>
          {loading ? t("adding", "Adding...") : t("add_metal_type")}
        </button>
      </div>

      {/* TABLE */}
      <table className="metal-table">
        <thead>
          <tr>
            <th>{t("name")}</th>
            <th>{t("status")}</th>
            <th>{t("action")}</th>
          </tr>
        </thead>

        <tbody>
          {list.map((m) => (
            <tr key={m.id}>
              <td style={{ fontWeight: "500" }}>{m.name}</td>

              <td>
                <span
                  className={`status-pill ${
                    m.is_active ? "status-active" : "status-disabled"
                  }`}
                >
                  {m.is_active ? t("active") : t("disabled")}
                </span>
              </td>

              <td>
                <button
                  className={`btn-action ${
                    m.is_active ? "danger" : "success"
                  }`}
                  onClick={() => toggleStatus(m.id, m.is_active)}
                >
                  {m.is_active ? t("disable") : t("enable")}
                </button>
              </td>
            </tr>
          ))}

          {list.length === 0 && (
            <tr>
              <td colSpan="3" style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                {t("no_metal_types")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}