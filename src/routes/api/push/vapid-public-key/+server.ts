import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, enforceApiRateLimit } from '$lib/server/api-helpers';

/**
 * GET /api/push/vapid-public-key
 * Get the VAPID public key for push subscription
 */
export const GET: RequestHandler = async (event) => {
	const { locals, platform } = event;
	await enforceApiRateLimit(event);
	requireAuth(locals);

	const vapidPublicKey = platform?.env?.VAPID_PUBLIC_KEY;

	if (!vapidPublicKey) {
		throw error(503, 'Push notifications are not configured');
	}

	return json({ publicKey: vapidPublicKey });
};
