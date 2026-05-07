"use client";
import React, { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erreur capturée:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          background: "#0a0a0a", 
          minHeight: "100vh", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexDirection: "column",
          padding: "20px"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>⚠️</div>
          <h1 style={{ color: "white", marginBottom: "10px" }}>Une erreur est survenue</h1>
          <p style={{ color: "#94a3b8", marginBottom: "20px", textAlign: "center" }}>
            {this.state.error?.message || "Erreur inattendue"}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ background: "#667eea", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer" }}
          >
            Rafraîchir la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
