"use client";
import { useResponsive } from "@/hooks/useResponsive";

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
}

export default function ResponsiveGrid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 4 },
  gap = 20 
}: ResponsiveGridProps) {
  const { isMobile, isTablet } = useResponsive();
  
  let columnCount = cols.desktop || 4;
  if (isMobile) columnCount = cols.mobile || 1;
  else if (isTablet) columnCount = cols.tablet || 2;
  
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: `${gap}px`,
        width: "100%"
      }}
    >
      {children}
    </div>
  );
}