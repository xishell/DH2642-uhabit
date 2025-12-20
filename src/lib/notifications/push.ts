export type PushStatus = 'subscribed' | 'unsubscribed' | 'denied' | 'unsupported';

export function isPushSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}

export async function getPushStatus(): Promise<PushStatus> {
	if (!isPushSupported()) {
		return 'unsupported';
	}

	if (Notification.permission === 'denied') {
		return 'denied';
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		return subscription ? 'subscribed' : 'unsubscribed';
	} catch {
		return 'unsubscribed';
	}
}

export async function requestPermission(): Promise<NotificationPermission> {
	if (!('Notification' in window)) {
		throw new Error('Notifications not supported');
	}
	return Notification.requestPermission();
}

export async function subscribeToPush(): Promise<boolean> {
	if (!isPushSupported()) {
		console.warn('[Push] Push notifications not supported');
		return false;
	}

	const permission = await requestPermission();
	if (permission !== 'granted') {
		console.warn('[Push] Notification permission denied');
		return false;
	}

	try {
		const keyResponse = await fetch('/api/push/vapid-public-key');
		if (!keyResponse.ok) {
			console.error('[Push] Push notifications not configured on server');
			return false;
		}
		const { publicKey } = (await keyResponse.json()) as { publicKey: string };

		const registration = await navigator.serviceWorker.ready;

		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer
		});

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

export async function unsubscribeFromPush(): Promise<boolean> {
	if (!isPushSupported()) {
		return true;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (!subscription) {
			return true;
		}

		await subscription.unsubscribe();

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

export async function isSubscribed(): Promise<boolean> {
	const status = await getPushStatus();
	return status === 'subscribed';
}

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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}
