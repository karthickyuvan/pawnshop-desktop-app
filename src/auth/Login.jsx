// import { useState } from "react";
// import { login } from "../services/tauriApi";
// import { useAuthStore } from "./authStore";
// import AuthLayout from "./AuthLayout";
// // import "../styles/auth.css";
// import "../auth/login.css";

// export default function Login() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const loginSuccess = useAuthStore((s) => s.loginSuccess);

//   const submit = async () => {
//     setLoading(true);
//     setError(""); // Clear previous errors
//     try {
//       const result = await login({ username, password });
//       loginSuccess(result);
//     } catch (err) {
//       setError(err.message || "Invalid credentials");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <AuthLayout title="Pawnshop Login">
//       <input
//         className="user-input"
//         placeholder="Username"
//         value={username}
//         onChange={(e) => setUsername(e.target.value)}
//         autoFocus
//       />

//       <input
//         className="user-input"
//         type="password"
//         placeholder="Password / PIN"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//       />

//       <button 
//         className="login-button" 
//         onClick={submit} 
//         disabled={loading}
//       >
//         {loading ? "Verifying..." : "Login"}
//       </button>

//       {error && <div className="auth-error">{error}</div>}
//     </AuthLayout>
//   );
// }



// Login.jsx
import { useState } from "react";
import { login } from "../services/tauriApi";
import { useAuthStore } from "./authStore";
import AuthLayout from "./AuthLayout";
import "../styles/auth.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const loginSuccess = useAuthStore((s) => s.loginSuccess);

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await login({ username, password });
      loginSuccess(result);
    } catch (err) {
      setError(err.message || "Invalid credentials. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to access the pawnshop dashboard"
    >
      <input
        className="user-input"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoFocus
      />

      <input
        className="user-input"
        type="password"
        placeholder="Password / PIN"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      <button
        className="login-button"
        onClick={submit}
        disabled={loading}
      >
        {loading ? "Verifying…" : "Sign In"}
      </button>

      {error && <div className="auth-error">{error}</div>}
    </AuthLayout>
  );
}