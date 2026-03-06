// export default function AuthLayout({ title, children }) {
//     return (
//       <div style={styles.page}>
//         <div style={styles.card}>
//           <h1 style={styles.title}>{title}</h1>
//           {children}
//         </div>
//       </div>
//     );
//   }
  
//   const styles = {
//     page: {
//       height: "100vh",
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//     },
//     card: {
//       width: 360,
//       background: "var(--card-bg)",
//       padding: 24,
//       borderRadius: "var(--radius)",
//       boxShadow: "var(--shadow)",
//     },
//     title: {
//       marginBottom: 20,
//       fontSize: 20,
//       color: "var(--primary)",
//       textAlign: "center",
//     },
//   };
  


// AuthLayout.jsx
import "../styles/auth.css";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">⚖️</div>
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