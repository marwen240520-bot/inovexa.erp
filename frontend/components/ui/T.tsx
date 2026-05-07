"use client";
import { useSettings } from "@/contexts/SettingsContext";

export default function T({ path, className }) {
  const { t } = useSettings();
  return <span className={className}>{t(path)}</span>;
}
