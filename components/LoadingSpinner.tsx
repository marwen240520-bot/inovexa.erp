"use client";

export default function LoadingSpinner({ message = "Chargement..." }) {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <div style={styles.pulseRing}></div>
      <p style={styles.text}>{message}</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "3px solid rgba(102,126,234,0.2)",
    borderTopColor: "#667eea",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  pulseRing: {
    position: "absolute",
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "rgba(102,126,234,0.1)",
    animation: "pulse 1.5s ease-out infinite",
  },
  text: {
    color: "#94a3b8",
    fontSize: "14px",
    marginTop: "20px",
  },
};
