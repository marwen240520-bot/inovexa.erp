"use client";

export function initPushNotifications() {
  if (!('Notification' in window)) {
    console.log('Ce navigateur ne supporte pas les notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    console.log('Notifications déjà autorisées');
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notifications autorisées');
      }
    });
  }
}

export function showNotification(title, body, icon = '/logo.png') {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon });
  }
}
