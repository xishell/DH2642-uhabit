import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) {
		return error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	if (!db) {
		return error(500, 'Database not available');
	}

	const drizzle = getDB(db);

	const [userData] = await drizzle
		.select({
			displayName: user.displayName,
			theme: user.theme,
			country: user.country,
			preferences: user.preferences
		})
		.from(user)
		.where(eq(user.id, locals.user.id));

	if (!userData) {
		return error(404, 'User not found');
	}

	// Parse preferences JSON if it exists
	const preferences = userData.preferences ? JSON.parse(userData.preferences as string) : {};

	return json({
		displayName: userData.displayName,
		theme: userData.theme || 'system',
		country: userData.country,
		preferences
	});
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	if (!db) {
		return error(500, 'Database not available');
	}

	const drizzle = getDB(db);

	const body = (await request.json()) as {
		displayName?: string;
		theme?: string;
		country?: string;
		preferences?: {
			notifications?: boolean;
			emailNotifications?: boolean;
			weekStartsOn?: number;
		};
	};

	// Validate and extract allowed fields
	const updates: {
		displayName?: string;
		theme?: string;
		country?: string;
		preferences?: string;
	} = {};

	if (body.displayName !== undefined) {
		updates.displayName = body.displayName;
	}

	if (body.theme !== undefined) {
		if (!['light', 'dark', 'system'].includes(body.theme)) {
			return error(400, 'Invalid theme value');
		}
		updates.theme = body.theme;
	}

	if (body.country !== undefined) {
		updates.country = body.country;
	}

	if (body.preferences !== undefined) {
		// Merge with existing preferences
		const [currentUser] = await drizzle
			.select({ preferences: user.preferences })
			.from(user)
			.where(eq(user.id, locals.user.id));

		const currentPrefs = currentUser?.preferences
			? JSON.parse(currentUser.preferences as string)
			: {};

		const mergedPrefs = { ...currentPrefs, ...body.preferences };
		updates.preferences = JSON.stringify(mergedPrefs);
	}

	// Update the user
	await drizzle.update(user).set(updates).where(eq(user.id, locals.user.id));

	// Fetch updated data
	const [updatedUser] = await drizzle
		.select({
			displayName: user.displayName,
			theme: user.theme,
			country: user.country,
			preferences: user.preferences
		})
		.from(user)
		.where(eq(user.id, locals.user.id));

	const preferences = updatedUser.preferences ? JSON.parse(updatedUser.preferences as string) : {};

	return json({
		displayName: updatedUser.displayName,
		theme: updatedUser.theme || 'system',
		country: updatedUser.country,
		preferences
	});
};
