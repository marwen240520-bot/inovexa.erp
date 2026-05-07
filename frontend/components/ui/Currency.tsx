"use client";
import { useSettings } from "@/contexts/SettingsContext";

export default function Currency({ amount, className }) {
  const { formatCurrency } = useSettings();
  return <span className={className}>{formatCurrency(amount)}</span>;
}
