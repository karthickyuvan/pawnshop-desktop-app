

import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { getMetalTypes } from "../services/metalTypesApi";
import { getJewelleryTypes, createJewelleryType, toggleJewelleryType } from "../services/jewelleryTypesApi";
import "./jewelleryTypes.css";

export default function JewelleryTypesPages() {
  const user = useAuthStore((s) => s.user);
  const [metals, setMetals] = useState([]);
  const [list, setList] = useState([]);
  const [metalId, setMetalId] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const load = async () => {
    try {
      const [metalsData, jewelleryData] = await Promise.all([
        getMetalTypes(),
        getJewelleryTypes()
      ]);
      setMetals(metalsData);
      setList(jewelleryData);
    } catch (e) {
      console.error("Load failed:", e);
    }
  };

  useEffect(() => { load(); }, []);

  // FILTER LOGIC: Matches 'metal_type_id' from your Rust struct/DB
  const filteredList = list.filter(item => {
    if (!metalId) return false;
    return item.metal_type_id == metalId; // Loose equality for string vs number comparison
  });

  const submit = async () => {
    if (!metalId) return alert("Please select a metal type");
    if (!name.trim()) return alert("Name required");

    try {
      await createJewelleryType({
        metalTypeId: Number(metalId),
        name: name.trim(),
        description: desc || null,
        actorUserId: user.user_id,
      });
      setName("");
      setDesc("");
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
      alert("Toggle failed: " + e.toString());
    }
  };

  return (
    <div className="jewellery-page">
      <header className="page-header">
        <h2 className="page-title">Jewellery Management</h2>
        <p className="page-subtitle">Configure jewellery types and categorize them by metal.</p>
      </header>
  
      <div className="jewellery-form">
        <div className="form-group">
          <label>Metal Category</label>
          <select 
            value={metalId} 
            onChange={(e) => setMetalId(e.target.value)}
          >
            <option value="">Select Metal</option>
            {metals.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
  
        <div className="form-group">
          <label>Jewellery Name</label>
          <input
            placeholder="e.g. Diamond Ring"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
  
        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Optional details..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
  
        <button className="btn-primary" onClick={submit}>Add Type</button>
      </div>
  
      <div className="table-container">
        <table className="jewellery-table">
          <thead>
            <tr>
              <th>Metal</th>
              <th>Jewellery Type</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {!metalId ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  Please select a metal category to view its jewellery types.
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  No jewellery types found for the selected metal.
                </td>
              </tr>
            ) : (
              filteredList.map((j) => (
                <tr key={j.id}>
                  <td className="font-medium">{j.metal_name}</td>
                  <td>{j.name}</td>
                  <td className="text-center">
                    <span className={`pill ${j.is_active ? "pill-active" : "pill-disabled"}`}>
                      {j.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      className={`btn-outline ${j.is_active ? "btn-danger" : "btn-success"}`}
                      onClick={() => handleToggle(j.id, j.is_active)}
                    >
                      {j.is_active ? "Disable" : "Enable"}
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