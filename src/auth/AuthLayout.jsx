
// AuthLayout.jsx
import "../styles/auth.css";
import logo from "../assets/logo.jpeg";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-header">
        <div className="auth-logo">
          <img src={logo} alt="Pawnshop Logo" />
        </div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="auth-body">{children}</div>

        <div className="auth-footer">
          Designed and Developed By<span> E3D Design </span> · All access logged
        </div>
      </div>
    </div>
  );
}