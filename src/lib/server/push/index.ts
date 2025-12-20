import { eq } from 'drizzle-orm';
import type { DB } from '../api-helpers';
import { pushSubscription } from '../db/schema';
import { generateVapidHeaders } from './vapid';
import { encryptPayload, buildEncryptedBody, type SubscriptionKeys } from './encrypt';

export interface PushConfig {
	vapidPublicKey: string;
	vapidPrivateKey: string;
}

export interface PushResult {
	success: boolean;
	endpoint: string;
	statusCode?: number;
	error?: string;
}

export async function sendPushNotification(
	endpoint: string,
	keys: SubscriptionKeys,
	payload: string,
	config: PushConfig
): Promise<PushResult> {
	try {
		const vapidHeaders = await generateVapidHeaders(
			endpoint,
			config.vapidPublicKey,
			config.vapidPrivateKey
		);

		const encryption = await encryptPayload(payload, keys);
		const body = buildEncryptedBody(encryption);

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				Authorization: vapidHeaders.authorization,
				'Content-Type': 'application/octet-stream',
				'Content-Encoding': 'aes128gcm',
				'Content-Length': String(body.length),
				TTL: '86400',
				Urgency: 'normal'
			},
			body: body.buffer as ArrayBuffer
		});

		if (response.status === 201 || response.status === 200) {
			return { success: true, endpoint, statusCode: response.status };
		}

		if (response.status === 404 || response.status === 410) {
			return {
				success: false,
				endpoint,
				statusCode: response.status,
				error: 'Subscription expired'
			};
		}

		const errorText = await response.text().catch(() => 'Unknown error');
		return { success: false, endpoint, statusCode: response.status, error: errorText };
	} catch (error) {
		return {
			success: false,
			endpoint,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

export async function sendPushToUser(
	db: DB,
	userId: string,
	payload: string,
	config: PushConfig
): Promise<PushResult[]> {
	const subscriptions = await db
		.select({
			id: pushSubscription.id,
			endpoint: pushSubscription.endpoint,
			keys: pushSubscription.keys
		})
		.from(pushSubscription)
		.where(eq(pushSubscription.userId, userId));

	if (subscriptions.length === 0) return [];

	const results: PushResult[] = [];
	const expiredSubscriptionIds: string[] = [];

	for (const sub of subscriptions) {
		let keys: SubscriptionKeys;
		try {
			keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
		} catch {
			results.push({ success: false, endpoint: sub.endpoint, error: 'Invalid subscription keys' });
			continue;
		}

		const result = await sendPushNotification(sub.endpoint, keys, payload, config);
		results.push(result);

		if (result.statusCode === 404 || result.statusCode === 410) {
			expiredSubscriptionIds.push(sub.id);
		}
	}

	for (const id of expiredSubscriptionIds) {
		await db
			.delete(pushSubscription)
			.where(eq(pushSubscription.id, id))
			.catch(() => {});
	}

	return results;
}

export async function sendWakeUpPush(
	db: DB,
	userId: string,
	config: PushConfig
): Promise<PushResult[]> {
	return sendPushToUser(
		db,
		userId,
		JSON.stringify({ type: 'wake', timestamp: Date.now() }),
		config
	);
}

export function isPushConfigured(env: {
	VAPID_PUBLIC_KEY?: string;
	VAPID_PRIVATE_KEY?: string;
}): boolean {
	return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

export function getPushConfig(env: {
	VAPID_PUBLIC_KEY?: string;
	VAPID_PRIVATE_KEY?: string;
}): PushConfig | null {
	if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return null;
	return { vapidPublicKey: env.VAPID_PUBLIC_KEY, vapidPrivateKey: env.VAPID_PRIVATE_KEY };
}

export { generateVapidHeaders } from './vapid';
export { encryptPayload, buildEncryptedBody } from './encrypt';
