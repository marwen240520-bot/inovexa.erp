"use client";
import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeApplier() {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return null;
}
