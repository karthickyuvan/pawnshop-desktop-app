export default function AuthLayout({ title, children }) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>{title}</h1>
          {children}
        </div>
      </div>
    );
  }
  
  const styles = {
    page: {
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    card: {
      width: 360,
      background: "var(--card-bg)",
      padding: 24,
      borderRadius: "var(--radius)",
      boxShadow: "var(--shadow)",
    },
    title: {
      marginBottom: 20,
      fontSize: 20,
      color: "var(--primary)",
      textAlign: "center",
    },
  };
  