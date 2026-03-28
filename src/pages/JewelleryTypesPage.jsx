
import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { getActiveMetalTypes } from "../services/metalTypesApi";
import { getJewelleryTypes, createJewelleryType, toggleJewelleryType } from "../services/jewelleryTypesApi";
import { useLanguage } from "../context/LanguageContext";
import "./jewelleryTypes.css";

export default function JewelleryTypesPages() {

  const user = useAuthStore((s) => s.user);
  const { t } = useLanguage();

  const [metals, setMetals] = useState([]);
  const [list, setList] = useState([]);
  const [metalId, setMetalId] = useState("");
  const [name, setName] = useState("");


  const load = async () => {
    try {
      const [metalsData, jewelleryData] = await Promise.all([
        getActiveMetalTypes(),
        getJewelleryTypes(),
      ]);
      setMetals(metalsData);
      setList(jewelleryData);
    } catch (e) {
      console.error("Load failed:", e);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredList = list.filter(item => {
    if (!metalId) return false;
    return item.metal_type_id == metalId;
  });

  const submit = async () => {

    if (!metalId) return alert(t("select_metal_type"));
    if (!name.trim()) return alert(t("name_required"));

    try {

      await createJewelleryType({
        metalTypeId: Number(metalId),
        name: name.trim(),
        actorUserId: user.user_id,
      });

      setName("");
      load();

    } catch (e) {
      alert(e.toString());
    }

  };

  const handleToggle = async (id, currentStatus) => {

    try {

      await toggleJewelleryType({
        jewelleryTypeId: id,
        isActive: !currentStatus,
        actorUserId: user.user_id,
      });

      load();

    } catch (e) {
      alert(t("toggle_failed") + e.toString());
    }

  };

  return (
    <div className="jewellery-page">

      <header className="page-header">

        <div className="title-text">
          <h2 className="page-title">{t("jewellery_management")}</h2>
          <p className="page-subtitle">
            {t("jewellery_management_subtitle")}
          </p>
        </div>

      </header>

      <div className="jewellery-form">

        <div className="form-group">

          <label>{t("metal_category")}</label>

          <select value={metalId} onChange={(e) => setMetalId(e.target.value)}>
            <option value="">{t("select_metal")}</option>

            {metals.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}

          </select>

        </div>

        <div className="form-group">

          <label>{t("jewellery_name")}</label>

          <input
            placeholder={t("jewellery_name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

        </div>

        <button className="btn-primary" onClick={submit}>
          {t("add_type")}
        </button>

      </div>

      <div className="table-container">

        <table className="jewellery-table">

          <thead>
            <tr>
              <th>{t("metal")}</th>
              <th>{t("jewellery_type")}</th>
              <th>{t("status")}</th>
              <th className="text-right">{t("action")}</th>
            </tr>
          </thead>

          <tbody>

            {!metalId ? (

              <tr>
                <td colSpan="4" className="empty-state">
                  {t("select_metal_to_view")}
                </td>
              </tr>

            ) : filteredList.length === 0 ? (

              <tr>
                <td colSpan="4" className="empty-state">
                  {t("no_jewellery_types")}
                </td>
              </tr>

            ) : (

              filteredList.map((j) => (

                <tr key={j.id}>

                  <td className="font-medium">{j.metal_name}</td>

                  <td>{j.name}</td>

                  <td className="text-center">
                    <span className={`pill ${j.is_active ? "pill-active" : "pill-disabled"}`}>
                      {j.is_active ? t("active") : t("disabled")}
                    </span>
                  </td>

                  <td className="text-center">
                    <button
                      className={`btn-outline ${j.is_active ? "btn-danger" : "btn-success"}`}
                      onClick={() => handleToggle(j.id, j.is_active)}
                    >
                      {j.is_active ? t("disable") : t("enable")}
                    </button>
                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      

    </div>
  );
}