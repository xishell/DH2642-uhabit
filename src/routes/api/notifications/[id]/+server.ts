import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import {
	requireAuth,
	requireDB,
	enforceApiRateLimit,
	parseAndValidate
} from '$lib/server/api-helpers';
import { notification } from '$lib/server/db/schema';

const updateNotificationSchema = z.object({
	read: z.boolean().optional(),
	dismissed: z.boolean().optional()
});

/**
 * Verify notification exists and belongs to user
 */
async function verifyNotificationOwnership(
	db: ReturnType<typeof requireDB>,
	notificationId: string,
	userId: string
) {
	const notifications = await db
		.select()
		.from(notification)
		.where(and(eq(notification.id, notificationId), eq(notification.userId, userId)))
		.limit(1);

	if (notifications.length === 0) {
		throw error(404, 'Notification not found');
	}

	return notifications[0];
}

/**
 * PATCH /api/notifications/[id]
 * Update a notification (mark as read or dismissed)
 */
export const PATCH: RequestHandler = async (event) => {
	const { params, request, locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const data = await parseAndValidate(request, updateNotificationSchema);

	// Verify ownership
	await verifyNotificationOwnership(db, params.id, userId);

	// Build update object
	const updateData: Partial<typeof notification.$inferInsert> = {};
	if (data.read !== undefined) updateData.read = data.read;
	if (data.dismissed !== undefined) updateData.dismissed = data.dismissed;

	if (Object.keys(updateData).length === 0) {
		throw error(400, 'No valid fields to update');
	}

	await db
		.update(notification)
		.set(updateData)
		.where(and(eq(notification.id, params.id), eq(notification.userId, userId)));

	return json({ success: true });
};

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export const DELETE: RequestHandler = async (event) => {
	const { params, locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	// Verify ownership
	await verifyNotificationOwnership(db, params.id, userId);

	await db
		.delete(notification)
		.where(and(eq(notification.id, params.id), eq(notification.userId, userId)));

	return json({ success: true });
};
