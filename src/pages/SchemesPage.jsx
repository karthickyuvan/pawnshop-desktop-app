import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { getMetalTypes } from "../services/metalTypesApi";
import { getSchemes, createScheme, updateScheme, toggleScheme } from "../services/schemesApi";
import "./schemes.css";

export default function SchemesPages() {
  const user = useAuthStore((s) => s.user);

  const [metals, setMetals] = useState([]);
  const [list, setList] = useState([]);
  
  // Form States
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
        const [m, s] = await Promise.all([getMetalTypes(), getSchemes()]);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ FIX: Do NOT clear metalId here, so the table stays visible
  const resetForm = () => {
    setEditingId(null);
    setName(""); 
    setLoanPct(""); 
    setInterestRate(""); 
    setFeeValue(""); 
    setFeeType(""); 
    // setMetalId("");  <-- REMOVED THIS LINE
  };

  const submit = async () => {
    if (!metalId || !name || !loanPct || !interestRate || !feeType) return alert("Missing fields");

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
        // alert("Scheme updated successfully"); // Optional: Remove alert for smoother flow
      } else {
        await createScheme(payload);
        // alert("Scheme created successfully");
      }
      resetForm(); // Clears inputs but keeps Metal Type selected
      load();      // Refreshes table data
    } catch (e) { alert(e); }
  };

  // Filter list based on Metal Dropdown
  const filteredList = metalId 
    ? list.filter(s => s.metal_type_id === Number(metalId)) 
    : [];

  return (
    <div className="scheme-page">
      <h2 className="page-title">{editingId ? "Edit Scheme" : "Create New Scheme"}</h2>

      <div className="scheme-form">
       {/* Metal Dropdown */}
       <select 
         value={metalId} 
         onChange={(e) => {
             setMetalId(e.target.value);
             resetForm(); // Clear inputs when switching categories manually
         }}
       >
           <option value="">Select Metal Type</option>
           {metals.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Scheme Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Loan %"
          value={loanPct}
          onChange={(e) => setLoanPct(e.target.value)}
        />

        <input
          placeholder="Price Program"
          value={priceProgram}
          onChange={(e) => setPriceProgram(e.target.value)}
        />

        <input
          placeholder="Interest %"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
        />

        <select
          value={interestType}
          onChange={(e) => setInterestType(e.target.value)}
        >
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly</option>
        </select>

        <select value={feeType} onChange={(e) => setFeeType(e.target.value)}>
          <option value="" disabled>Choose Processing Fees Type</option>
          <option value="MANUAL">Manual</option>
          <option value="FIXED">Fixed Amount</option>
          <option value="PERCENTAGE">Flat %</option>
        </select>

        {feeType !== "" && (
          <input
            placeholder={feeType === 'PERCENTAGE' ? "Enter %" : "Enter Amount"}
            value={feeValue}
            onChange={(e) => setFeeValue(e.target.value)}
          />
        )}

        <div className="scheme-form-actions">
           {editingId && <button onClick={resetForm} className="btn-secondary">Cancel</button>}
           <button className="btn-primary" onClick={submit}>
             {editingId ? "Update Scheme" : "Add Scheme"}
           </button>
        </div>
      </div>

      <div className="table-container">
        {!metalId ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                <h3>Please select a metal category to view its Scheme details</h3>
            </div>
        ) : filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                No schemes found for this metal type.
            </div>
        ) : (
            <table className="scheme-table">
            <thead>
                <tr>
                <th>Metal Type</th>
                <th>Scheme Name</th>
                <th>Loan %</th>
                <th>Interest</th>
                <th>Processing Fee</th>
                <th>Price Program</th>
                <th className="text-center">Status</th>
                <th className="text-center">Action</th>
                </tr>
            </thead>
            <tbody>
                {filteredList.map((s) => (
                <tr key={s.id}>
                    <td>{s.metal_name}</td>
                    <td className="font-medium">{s.scheme_name}</td>
                    <td>{s.loan_percentage}%</td>
                    <td>{s.interest_rate}% <span className="text-muted">/{s.interest_type.substring(0,1)}</span></td>
                    <td>
                        {s.processing_fee_type === 'MANUAL' 
                            ? "Manual" 
                            : `${s.processing_fee_value} ${s.processing_fee_type === 'PERCENTAGE' ? '%' : ''}`}
                    </td>
                    <td>{s.price_program}</td>
                    <td className="text-center">
                    <span className={`pill ${s.is_active ? "pill-active" : "pill-disabled"}`}>
                        {s.is_active ? "Active" : "Disabled"}
                    </span>
                    </td>
                    <td className="text-center">
                    <div className="action-buttons">
                        <button className="btn-edit" onClick={() => handleEdit(s)}>Edit</button>
                        <button 
                        className={`btn-toggle ${s.is_active ? "btn-danger" : "btn-success"}`}
                        onClick={() => toggleScheme({ schemeId: s.id, isActive: !s.is_active, actorUserId: user.user_id }).then(load)}
                        >
                        {s.is_active ? "Disable" : "Enable"}
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