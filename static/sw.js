/**
 * UHabit Service Worker
 *
 * Handles push notifications with a "trigger-only" approach:
 * - Server sends minimal wake-up signal
 * - Service worker reads local IndexedDB for notification content
 * - Displays notification using local data (privacy-preserving)
 */

const SW_VERSION = '1.0.0';
const DB_NAME = 'uhabit-notifications';
const DB_VERSION = 1;
const STORE_NAME = 'pending';

// ============================================================================
// IndexedDB Helpers
// ============================================================================

function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'id' });
			}
		};
	});
}

async function getPendingNotifications() {
	try {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const request = store.getAll();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result || []);
		});
	} catch (error) {
		console.error('[SW] Failed to get pending notifications:', error);
		return [];
	}
}

async function clearPendingNotifications() {
	try {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			store.clear();

			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} catch (error) {
		console.error('[SW] Failed to clear pending notifications:', error);
	}
}

// ============================================================================
// Push Event Handler
// ============================================================================

self.addEventListener('push', (event) => {
	console.log('[SW] Push received');

	event.waitUntil(handlePush(event));
});

async function handlePush(event) {
	try {
		// Get pending notifications from IndexedDB
		const pending = await getPendingNotifications();

		if (pending.length === 0) {
			// Fallback: show generic notification if no local data
			return self.registration.showNotification('UHabit', {
				body: 'Check your habits for today!',
				icon: '/favicon.svg',
				badge: '/favicon.svg',
				tag: 'uhabit-reminder',
				data: { url: '/overview' }
			});
		}

		// Show each pending notification
		const notifications = pending.map((n) =>
			self.registration.showNotification(n.title || 'UHabit', {
				body: n.body || 'You have a notification',
				icon: '/favicon.svg',
				badge: '/favicon.svg',
				tag: `uhabit-${n.type || 'notification'}-${n.id}`,
				data: {
					url: n.actionUrl || '/overview',
					notificationId: n.id
				}
			})
		);

		await Promise.all(notifications);

		// Clear pending after display
		await clearPendingNotifications();
	} catch (error) {
		console.error('[SW] Error handling push:', error);

		// Fallback notification on error
		return self.registration.showNotification('UHabit', {
			body: 'You have new updates',
			icon: '/favicon.svg',
			tag: 'uhabit-fallback',
			data: { url: '/overview' }
		});
	}
}

// ============================================================================
// Notification Click Handler
// ============================================================================

self.addEventListener('notificationclick', (event) => {
	console.log('[SW] Notification clicked');

	event.notification.close();

	const url = event.notification.data?.url || '/overview';

	event.waitUntil(
		clients
			.matchAll({ type: 'window', includeUncontrolled: true })
			.then((windowClients) => {
				// Try to focus an existing window
				for (const client of windowClients) {
					if (client.url.includes(self.location.origin) && 'focus' in client) {
						client.navigate(url);
						return client.focus();
					}
				}

				// Open new window if none found
				return clients.openWindow(url);
			})
	);
});

// ============================================================================
// Install & Activate
// ============================================================================

self.addEventListener('install', (event) => {
	console.log('[SW] Installing version', SW_VERSION);
	// Skip waiting to activate immediately
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	console.log('[SW] Activating version', SW_VERSION);
	// Claim all clients immediately
	event.waitUntil(self.clients.claim());
});

// ============================================================================
// Message Handler (for communication with main app)
// ============================================================================

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
