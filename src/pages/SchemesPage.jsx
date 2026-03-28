

import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { getActiveMetalTypes } from "../services/metalTypesApi";
import { getSchemes, createScheme, updateScheme, toggleScheme } from "../services/schemesApi";
import { useLanguage } from "../context/LanguageContext";
import "./schemes.css";

export default function SchemesPages() {

  const user = useAuthStore((s) => s.user);
  const { t } = useLanguage();

  const [metals, setMetals] = useState([]);
  const [list, setList] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [metalId, setMetalId] = useState("");
  const [name, setName] = useState("");
  const [loanPct, setLoanPct] = useState("");
  const [priceProgram, setPriceProgram] = useState("TODAY_RATE");
  const [interestRate, setInterestRate] = useState("");
  const [interestType, setInterestType] = useState("MONTHLY");

  const [feeType, setFeeType] = useState("");
  const [feeValue, setFeeValue] = useState("");

  const load = async () => {
    try {
      const [m, s] = await Promise.all([getActiveMetalTypes(), getSchemes()]);
      setMetals(m);
      setList(s);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (s) => {
    setEditingId(s.id);
    setMetalId(s.metal_type_id.toString());
    setName(s.scheme_name);
    setLoanPct(s.loan_percentage);
    setPriceProgram(s.price_program);
    setInterestRate(s.interest_rate);
    setInterestType(s.interest_type);
    setFeeType(s.processing_fee_type);
    setFeeValue(s.processing_fee_value || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setLoanPct("");
    setInterestRate("");
    setFeeValue("");
    setFeeType("");
  };

  const submit = async () => {

    if (!metalId || !name || !loanPct || !interestRate || !feeType) {
      return alert(t("missing_fields"));
    }

    const payload = {
      id: editingId,
      metalTypeId: Number(metalId),
      schemeName: name,
      loanPercentage: Number(loanPct),
      priceProgram,
      interestRate: Number(interestRate),
      interestType,
      processingFeeType: feeType,
      processingFeeValue: feeValue ? Number(feeValue) : null,
      actorUserId: user.user_id,
    };

    try {
      if (editingId) {
        await updateScheme(payload);
      } else {
        await createScheme(payload);
      }

      resetForm();
      load();

    } catch (e) {
      alert(e);
    }

  };

  const filteredList = metalId
    ? list.filter((s) => s.metal_type_id === Number(metalId))
    : [];

  return (
    <div className="scheme-page">

      <h2 className="page-title">
        {editingId ? t("edit_scheme") : t("create_scheme")}
      </h2>

      <div className="scheme-form">

        <select
          value={metalId}
          onChange={(e) => {
            setMetalId(e.target.value);
            resetForm();
          }}
        >
          <option value="">{t("select_metal_type")}</option>
          {metals.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <input
          placeholder={t("scheme_name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder={t("loan_percentage")}
          value={loanPct}
          onChange={(e) => setLoanPct(e.target.value)}
        />

        <input
          placeholder={t("price_program")}
          value={priceProgram}
          onChange={(e) => setPriceProgram(e.target.value)}
        />

        <input
          placeholder={t("interest_rate")}
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
        />

        <select
          value={interestType}
          onChange={(e) => setInterestType(e.target.value)}
        >
          <option value="MONTHLY">{t("monthly")}</option>
          <option value="YEARLY">{t("yearly")}</option>
        </select>

        <select
          value={feeType}
          onChange={(e) => setFeeType(e.target.value)}
        >
          <option value="" disabled>{t("choose_processing_fee")}</option>
          <option value="MANUAL">{t("manual")}</option>
          <option value="FIXED">{t("fixed_amount")}</option>
          <option value="PERCENTAGE">{t("percentage")}</option>
        </select>

        {feeType !== "" && (
          <input
            placeholder={
              feeType === "PERCENTAGE"
                ? t("enter_percentage")
                : t("enter_amount")
            }
            value={feeValue}
            onChange={(e) => setFeeValue(e.target.value)}
          />
        )}

        <div className="scheme-form-actions">
          {editingId && (
            <button onClick={resetForm} className="btn-secondary">
              {t("cancel")}
            </button>
          )}

          <button className="btn-primary" onClick={submit}>
            {editingId ? t("update_scheme") : t("add_scheme")}
          </button>
        </div>

      </div>

      <div className="table-container">

        {!metalId ? (
          <div className="empty-box">
            {t("select_metal_scheme")}
          </div>

        ) : filteredList.length === 0 ? (
          <div className="empty-box">
            {t("no_schemes")}
          </div>

        ) : (

          <table className="scheme-table">

            <thead>
              <tr>
                <th>{t("metal_type")}</th>
                <th>{t("scheme_name")}</th>
                <th>{t("loan_percentage")}</th>
                <th>{t("interest")}</th>
                <th>{t("processing_fee")}</th>
                <th>{t("price_program")}</th>
                <th>{t("status")}</th>
                <th>{t("action")}</th>
              </tr>
            </thead>

            <tbody>

              {filteredList.map((s) => (
                <tr key={s.id}>

                  <td>{s.metal_name}</td>
                  <td className="font-medium">{s.scheme_name}</td>

                  <td>{s.loan_percentage}%</td>

                  <td>
                    {s.interest_rate}% 
                    <span className="text-muted">
                      /{s.interest_type.substring(0, 1)}
                    </span>
                  </td>

                  <td>
                    {s.processing_fee_type === "MANUAL"
                      ? t("manual")
                      : `${s.processing_fee_value} ${
                          s.processing_fee_type === "PERCENTAGE" ? "%" : ""
                        }`}
                  </td>

                  <td>{s.price_program}</td>

                  <td>
                    <span className={`pill ${s.is_active ? "pill-active" : "pill-disabled"}`}>
                      {s.is_active ? t("active") : t("disabled")}
                    </span>
                  </td>

                  <td>
                    <div className="action-buttons">

                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(s)}
                      >
                        {t("edit")}
                      </button>

                      <button
                        className={`btn-toggle ${s.is_active ? "btn-danger" : "btn-success"}`}
                        onClick={() =>
                          toggleScheme({
                            schemeId: s.id,
                            isActive: !s.is_active,
                            actorUserId: user.user_id,
                          }).then(load)
                        }
                      >
                        {s.is_active ? t("disable") : t("enable")}
                      </button>

                    </div>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}