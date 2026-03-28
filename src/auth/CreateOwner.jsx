

// CreateOwner.jsx
import { useState } from "react";
import { createOwner } from "../services/tauriApi";
import AuthLayout from "./AuthLayout";
import "../styles/auth.css";

export default function CreateOwner({ onCreated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      await createOwner({ username, password });
      onCreated();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <AuthLayout
      title="Create Owner Account"
      subtitle="Set up the primary administrator for this branch"
    >
      <input
        className="auth-input"
        placeholder="Owner username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoFocus
      />

      <input
        className="auth-input"
        type="password"
        placeholder="Master password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      <button className="auth-button" onClick={submit}>
        Create Owner Account
      </button>

      {error && <div className="auth-error">{String(error)}</div>}
    </AuthLayout>
  );
}