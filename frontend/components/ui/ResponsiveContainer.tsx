"use client";
import { ReactNode } from "react";
import { useResponsive } from "@/hooks/useResponsive";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: boolean | "small" | "medium" | "large";
  centered?: boolean;
  background?: "transparent" | "dark" | "darker" | "card";
  noGutters?: boolean;
}

export default function ResponsiveContainer({ 
  children, 
  className = "", 
  maxWidth = "xl",
  padding = true,
  centered = true,
  background = "transparent",
  noGutters = false
}: ResponsiveContainerProps) {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
  
  // Styles de largeur maximale
  const maxWidthStyles = {
    xs: "480px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
    full: "100%"
  };
  
  // Styles de padding responsif
  const getPadding = () => {
    if (padding === false) return "0";
    if (padding === "small") return isMobile ? "8px" : isTablet ? "12px" : "16px";
    if (padding === "large") return isMobile ? "20px" : isTablet ? "32px" : "48px";
    
    // padding par défaut
    if (noGutters) return "0";
    return isMobile ? "12px" : isTablet ? "20px" : "24px";
  };
  
  // Styles de fond
  const backgroundStyles = {
    transparent: { background: "transparent" },
    dark: { background: "#0a0a0a" },
    darker: { background: "#050505" },
    card: { 
      background: "linear-gradient(135deg, #111 0%, #1a1a1a 100%)",
      borderRadius: "20px",
      border: "1px solid rgba(102,126,234,0.1)"
    }
  };
  
  return (
    <div
      className={`responsive-container ${className}`}
      style={{
        maxWidth: maxWidthStyles[maxWidth],
        margin: centered ? "0 auto" : "0",
        width: "100%",
        padding: getPadding(),
        ...backgroundStyles[background],
        transition: "all 0.3s ease"
      }}
    >
      {children}
      
      <style jsx>{`
        .responsive-container {
          box-sizing: border-box;
        }
        
        @media (max-width: 640px) {
          .responsive-container {
            padding-left: 12px;
            padding-right: 12px;
          }
        }
        
        @media (min-width: 641px) and (max-width: 1024px) {
          .responsive-container {
            padding-left: 20px;
            padding-right: 20px;
          }
        }
        
        @media (min-width: 1025px) {
          .responsive-container {
            padding-left: 24px;
            padding-right: 24px;
          }
        }
      `}</style>
    </div>
  );
}

// Composant Section pour les sections de page
interface SectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  background?: "transparent" | "dark" | "darker" | "gradient";
  spacing?: "small" | "medium" | "large";
}

export function Section({ 
  children, 
  title, 
  subtitle, 
  className = "", 
  background = "transparent",
  spacing = "medium"
}: SectionProps) {
  const { isMobile } = useResponsive();
  
  const spacingStyles = {
    small: { paddingTop: "24px", paddingBottom: "24px" },
    medium: { paddingTop: "48px", paddingBottom: "48px" },
    large: { paddingTop: "80px", paddingBottom: "80px" }
  };
  
  const backgroundStyles = {
    transparent: { background: "transparent" },
    dark: { background: "#0a0a0a" },
    darker: { background: "#050505" },
    gradient: { 
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)"
    }
  };
  
  return (
    <div
      className={`section ${className}`}
      style={{
        ...spacingStyles[spacing],
        ...backgroundStyles[background],
        width: "100%"
      }}
    >
      <ResponsiveContainer>
        {(title || subtitle) && (
          <div style={{ 
            marginBottom: isMobile ? "24px" : "32px",
            textAlign: "center"
          }}>
            {title && (
              <h2 style={{
                fontSize: isMobile ? "24px" : "32px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #fff 0%, #94a3b8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "12px"
              }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p style={{
                fontSize: isMobile ? "14px" : "16px",
                color: "#94a3b8",
                maxWidth: "600px",
                margin: "0 auto"
              }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </ResponsiveContainer>
    </div>
  );
}

// Composant Grid pour les grilles responsives
interface GridProps {
  children: ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function Grid({ 
  children, 
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = 20,
  className = ""
}: GridProps) {
  const { breakpoint } = useResponsive();
  
  const getColumns = () => {
    switch (breakpoint) {
      case 'xs': return cols.xs || 1;
      case 'sm': return cols.sm || cols.xs || 2;
      case 'md': return cols.md || cols.sm || cols.xs || 3;
      case 'lg': return cols.lg || cols.md || cols.sm || cols.xs || 4;
      case 'xl':
      case '2xl': return cols.xl || cols.lg || cols.md || cols.sm || cols.xs || 4;
      default: return 4;
    }
  };
  
  return (
    <div
      className={`grid ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
        gap: `${gap}px`,
        width: "100%"
      }}
    >
      {children}
    </div>
  );
}