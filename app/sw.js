// Service Worker for Background Sync and Offline Support
const CACHE_NAME = 'attendance-cache-v3';
const STATIC_CACHE_NAME = 'attendance-static-v3';
const DYNAMIC_CACHE_NAME = 'attendance-dynamic-v3';
const ATTENDANCE_SYNC_QUEUE = 'attendance-sync-queue';
const AUTO_CHECKOUT_SYNC_TAG = 'auto-checkout-sync';

// Essential files to cache during installation
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/attendance/dashboard',
  '/attendance/history',
  '/attendance/statistics',
  // Add CSS, JS, and image assets that should be available offline
];

// Rest of your service worker code...
