/**
 * Service Worker Registration Utility
 *
 * This file handles the registration of the service worker and provides
 * utilities for working with background sync.
 */

// Check if service workers and background sync are supported
export const isServiceWorkerSupported = () =>
  'serviceWorker' in navigator;

export const isBackgroundSyncSupported = () =>
  'serviceWorker' in navigator &&
  'SyncManager' in window;

// Register the service worker with retry mechanism
export async function registerServiceWorker(maxRetries = 3) {
  if (!isServiceWorkerSupported()) {
    console.log('Service Workers are not supported in this browser');
    return false;
  }

  let retries = 0;

  while (retries < maxRetries) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered with scope:', registration.scope);

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready');

      return true;
    } catch (error) {
      retries++;
      console.error(`Service Worker registration failed (attempt ${retries}/${maxRetries}):`, error);

      if (retries >= maxRetries) {
        console.error('Max retries reached for Service Worker registration');
        return false;
      }

      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return false;
}

// Request background sync permission
export async function requestBackgroundSyncPermission() {
  if (!isBackgroundSyncSupported()) {
    console.log('Background Sync is not supported in this browser');
    return false;
  }

  try {
    // Request notification permission (often needed for background sync)
    const notificationPermission = await Notification.requestPermission();
    if (notificationPermission !== 'granted') {
      console.log('Notification permission not granted');
    }

    return true;
  } catch (error) {
    console.error('Error requesting background sync permission:', error);
    return false;
  }
}

// Register a background sync
export async function registerBackgroundSync() {
  if (!isBackgroundSyncSupported()) {
    console.log('Background Sync is not supported in this browser');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('attendance-sync');
    console.log('Background sync registered!');
    return true;
  } catch (error) {
    console.error('Background sync registration failed:', error);
    return false;
  }
}

// Listen for messages from the service worker
export function listenForServiceWorkerMessages(callback: (data: any) => void) {
  if (!isServiceWorkerSupported()) {
    return () => {}; // Return a no-op cleanup function
  }

  const messageHandler = (event: MessageEvent) => {
    if (event.data && (
      event.data.type === 'SYNC_SUCCESS' ||
      event.data.type === 'SYNC_COMPLETED'
    )) {
      callback(event.data);
    }
  };

  navigator.serviceWorker.addEventListener('message', messageHandler);

  // Return a cleanup function
  return () => {
    navigator.serviceWorker.removeEventListener('message', messageHandler);
  };
}
