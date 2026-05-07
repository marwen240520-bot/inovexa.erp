"use client";

const CACHE_NAME = 'inovexa-v2';
const API_URLS = ['/api/products', '/api/clients', '/api/orders'];

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

export async function syncOfflineData() {
  if (!navigator.onLine) return;
  
  const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
  
  for (const item of offlineQueue) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(item.data)
      });
      
      if (response.ok) {
        const index = offlineQueue.indexOf(item);
        offlineQueue.splice(index, 1);
        localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

window.addEventListener('online', syncOfflineData);
