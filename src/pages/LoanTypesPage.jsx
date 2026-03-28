// version 2
import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { getMetalTypes, createMetalType, toggleMetalType } from "../services/metalTypesApi";
import { useLanguage } from "../context/LanguageContext";
import "./loanTypes.css";

export default function LoanTypesPages() {

  const user = useAuthStore((s) => s.user);
  const { t } = useLanguage();

  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const data = await getMetalTypes();
    setList(data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {

    if (!name.trim()) {
      setMsg(t("metal_name_required"));
      return;
    }

    try {

      await createMetalType({
        name,
        actorUserId: user.user_id,
      });

      setName("");
      setMsg(t("metal_created"));

      load();

    } catch (e) {
      setMsg(e.toString());
    }

  };

  const toggleStatus = async (id, current) => {

    await toggleMetalType({
      metalTypeId: id,
      isActive: !current,
      actorUserId: user.user_id,
    });

    load();

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
        />

        <button onClick={submit}>
          {t("add_metal_type")}
        </button>

        {msg && <p className="msg">{msg}</p>}

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
              <td colSpan="3">{t("no_metal_types")}</td>
            </tr>
          )}

        </tbody>

      </table>

    </div>
  );
}