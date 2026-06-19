"use client";
import { useSettings } from "@/contexts/SettingsContext";

interface CurrencyProps {
  amount: number;
  className?: string;
}

export default function Currency({ amount, className }: CurrencyProps) {
  const { formatCurrency } = useSettings();
  return <span className={className}>{formatCurrency(amount)}</span>;
}