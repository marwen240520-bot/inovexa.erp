"use client";
import { useSettings } from "@/contexts/SettingsContext";

export default function FormattedDate({ date, className }) {
  const { formatDate } = useSettings();
  return <span className={className}>{formatDate(date)}</span>;
}
