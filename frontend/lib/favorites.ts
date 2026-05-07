"use client";
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const addFavorite = (item) => {
    const newFavorites = [...favorites, item];
    setFavorites(newFavorites);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
  };

  const removeFavorite = (id) => {
    const newFavorites = favorites.filter(f => f.id !== id);
    setFavorites(newFavorites);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
  };

  const isFavorite = (id) => {
    return favorites.some(f => f.id === id);
  };

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
