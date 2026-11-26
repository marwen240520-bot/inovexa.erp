// components/logistics/icons.tsx
// Pictogrammes du module Logistique (tracés repris de l'ancienne page unique).
// Ils sont décoratifs : le texte voisin ou l'aria-label du bouton porte le sens.
import type { CSSProperties, ReactNode } from "react";

export interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

function Svg({ size, color, style, strokeWidth, children }: Required<Pick<IconProps, "size" | "color">> & { style?: CSSProperties; strokeWidth: number; children: ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  );
}

export const IconTruck = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={1.75}>
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
    <rect x="9" y="11" width="14" height="10" rx="2" />
    <circle cx="12" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
  </Svg>
);

export const IconPackage = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={1.75}>
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </Svg>
);

export const IconClock = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={1.75}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Svg>
);

export const IconCheckCircle = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={1.75}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </Svg>
);

export const IconXCircle = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={1.75}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </Svg>
);

export const IconBarChart = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={1.75}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </Svg>
);

export const IconTrendingUp = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={1.75}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </Svg>
);

export const IconPlus = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

export const IconList = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </Svg>
);

export const IconGrid = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </Svg>
);

export const IconEdit = ({ size = 14, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

export const IconTrash = ({ size = 14, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Svg>
);

export const IconSearch = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);

export const IconSave = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </Svg>
);

export const IconX = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

export const IconUser = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

export const IconMail = ({ size = 14, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </Svg>
);

export const IconPhone = ({ size = 14, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.54 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

export const IconCoins = ({ size = 14, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </Svg>
);

export const IconCalendar = ({ size = 14, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

export const IconMapPin = ({ size = 14, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);

export const IconAlertCircle = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

export const IconTag = ({ size = 14, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </Svg>
);

export const IconBuilding = ({ size = 28, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={1.5}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </Svg>
);

export const IconLock = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

export const IconCheck = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2.5}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);

export const IconChevron = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <polyline points="9 18 15 12 9 6" />
  </Svg>
);

export const IconChevronsEnd = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <polyline points="13 17 18 12 13 7" />
    <polyline points="6 17 11 12 6 7" />
  </Svg>
);

export const IconRefresh = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <Svg size={size} color={color} style={style} strokeWidth={2}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </Svg>
);
