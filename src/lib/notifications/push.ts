/**
 * Push notification subscription manager
 *
 * Handles browser push notification subscription lifecycle:
 * - Check support and permission status
 * - Subscribe/unsubscribe from push notifications
 * - Sync subscription with server
 */

export type PushStatus = 'subscribed' | 'unsubscribed' | 'denied' | 'unsupported';

/**
 * Check if push notifications are supported in this browser
 */
export function isPushSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}

/**
 * Get the current push notification status
 */
export async function getPushStatus(): Promise<PushStatus> {
	if (!isPushSupported()) {
		return 'unsupported';
	}

	// Check notification permission
	if (Notification.permission === 'denied') {
		return 'denied';
	}

	// Check if we have an active subscription
	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		return subscription ? 'subscribed' : 'unsubscribed';
	} catch {
		return 'unsubscribed';
	}
}

/**
 * Request notification permission from the user
 * @returns The permission state after the request
 */
export async function requestPermission(): Promise<NotificationPermission> {
	if (!('Notification' in window)) {
		throw new Error('Notifications not supported');
	}
	return Notification.requestPermission();
}

/**
 * Subscribe to push notifications
 * This will request permission if not already granted
 * @returns true if subscription was successful
 */
export async function subscribeToPush(): Promise<boolean> {
	if (!isPushSupported()) {
		console.warn('[Push] Push notifications not supported');
		return false;
	}

	// Request permission
	const permission = await requestPermission();
	if (permission !== 'granted') {
		console.warn('[Push] Notification permission denied');
		return false;
	}

	try {
		// Get VAPID public key from server
		const keyResponse = await fetch('/api/push/vapid-public-key');
		if (!keyResponse.ok) {
			console.error('[Push] Push notifications not configured on server');
			return false;
		}
		const { publicKey } = (await keyResponse.json()) as { publicKey: string };

		// Wait for service worker to be ready
		const registration = await navigator.serviceWorker.ready;

		// Subscribe to push
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer
		});

		// Send subscription to server
		const subscribeResponse = await fetch('/api/push/subscribe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				endpoint: subscription.endpoint,
				keys: {
					p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
					auth: arrayBufferToBase64(subscription.getKey('auth')!)
				}
			})
		});

		if (!subscribeResponse.ok) {
			console.error('[Push] Failed to save subscription to server');
			// Try to unsubscribe locally since server sync failed
			await subscription.unsubscribe();
			return false;
		}

		console.log('[Push] Successfully subscribed to push notifications');
		return true;
	} catch (error) {
		console.error('[Push] Failed to subscribe:', error);
		return false;
	}
}

/**
 * Unsubscribe from push notifications
 * @returns true if unsubscription was successful
 */
export async function unsubscribeFromPush(): Promise<boolean> {
	if (!isPushSupported()) {
		return true; // Nothing to unsubscribe
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (!subscription) {
			return true; // Already unsubscribed
		}

		// Unsubscribe locally
		await subscription.unsubscribe();

		// Remove from server
		await fetch('/api/push/subscribe', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ endpoint: subscription.endpoint })
		});

		console.log('[Push] Successfully unsubscribed from push notifications');
		return true;
	} catch (error) {
		console.error('[Push] Failed to unsubscribe:', error);
		return false;
	}
}

/**
 * Check if the user is currently subscribed to push notifications
 */
export async function isSubscribed(): Promise<boolean> {
	const status = await getPushStatus();
	return status === 'subscribed';
}

/**
 * Convert a URL-safe base64 string to a Uint8Array
 * Required for the applicationServerKey in pushManager.subscribe
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

/**
 * Convert an ArrayBuffer to a base64 string
 * Used to encode subscription keys for the server
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}
