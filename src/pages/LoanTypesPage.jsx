import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { getMetalTypes, createMetalType, toggleMetalType } from "../services/metalTypesApi";
import "./loanTypes.css";

export default function LoanTypesPages() {
  const user = useAuthStore((s) => s.user);

  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
      setMsg("Metal type name required");
      return;
    }

    try {
      await createMetalType({
        name,
        description,
        actorUserId: user.user_id,
      });

      setName("");
      setDescription("");
      setMsg("Metal type created");
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
      <h2 className="page-title">Metal Types</h2>

      {/* CREATE FORM */}
      <div className="metal-form">
        <input
          placeholder="Metal Type (Gold, Silver...)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button onClick={submit}>Add Metal Type</button>

        {msg && <p className="msg">{msg}</p>}
      </div>

      {/* TABLE */}
      <table className="metal-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
        {list.map((m) => (
  <tr key={m.id}>
    <td style={{ fontWeight: '500' }}>{m.name}</td>
    <td style={{ color: '#6b7280' }}>{m.description || "-"}</td>
    <td>
      <span className={`status-pill ${m.is_active ? "status-active" : "status-disabled"}`}>
        {m.is_active ? "Active" : "Disabled"}
      </span>
    </td>
    <td>
      <button
        className={`btn-action ${m.is_active ? "danger" : "success"}`}
        onClick={() => toggleStatus(m.id, m.is_active)}
      >
        {m.is_active ? "Disable" : "Enable"}
      </button>
    </td>
  </tr>
))}

          {list.length === 0 && (
            <tr>
              <td colSpan="4">No metal types created</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
