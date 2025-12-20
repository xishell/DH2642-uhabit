import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq, and } from 'drizzle-orm';
import { requireAuth, requireDB, enforceApiRateLimit } from '$lib/server/api-helpers';
import { notification } from '$lib/server/db/schema';

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
export const PATCH: RequestHandler = async (event) => {
	const { locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	await db
		.update(notification)
		.set({ read: true })
		.where(and(eq(notification.userId, userId), eq(notification.read, false)));

	return json({ success: true });
};
