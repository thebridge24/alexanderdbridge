export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  };

  const swContent = `importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const targetLink = (payload.fcmOptions && payload.fcmOptions.link) || data.link || '/devotional';

  self.registration.showNotification(notification.title || 'Daily Devotional', {
    body: notification.body || 'Your daily devotional is ready.',
    icon: '/devotional.png',
    badge: '/devotional.png',
    vibrate: [200, 100, 200],
    data: {
      url: targetLink,
      ...data,
    },
  });
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const raw = event.data.json();
    const notification = raw.notification || (raw.data && raw.data.notification) || {};
    const data = raw.data || {};
    const title = notification.title || data.title || 'Daily Devotional';
    const body = notification.body || data.body || 'You have a new notification';
    const link = (raw.fcmOptions && raw.fcmOptions.link) || data.link || '/devotional';

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/devotional.png',
        badge: '/devotional.png',
        vibrate: [200, 100, 200],
        data: {
          url: link,
          ...data,
        },
      })
    );
  } catch (e) {
    // Fallback if data is not JSON
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Daily Devotional', {
        body: text || 'You have a new notification',
        icon: '/devotional.png',
        badge: '/devotional.png',
        data: { url: '/devotional' },
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/devotional';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
`;

  return new NextResponse(swContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-store',
    },
  });
}
