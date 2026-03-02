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
    <AuthLayout title="Create Owner Account">
      <input
        className="auth-input"
        placeholder="Owner Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoFocus
      />

      <input
        className="auth-input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="auth-button" onClick={submit}>
        Create Owner
      </button>

      {error && <div className="auth-error">{error}</div>}
    </AuthLayout>
  );
}
