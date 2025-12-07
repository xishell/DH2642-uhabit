import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for user preferences
const preferencesSchema = z.object({
	displayName: z.string().min(1).max(100).optional(),
	theme: z.enum(['light', 'dark', 'system']).optional(),
	country: z.string().length(2).optional(), // ISO 3166-1 alpha-2 country codes
	preferences: z
		.object({
			notifications: z.boolean().optional(),
			emailNotifications: z.boolean().optional(),
			weekStartsOn: z.number().int().min(0).max(6).optional()
		})
		.optional()
});

export const GET: RequestHandler = async ({ locals, platform, setHeaders }) => {
	if (!locals.user) {
		return error(401, 'Authentication required');
	}

	const db = platform?.env?.DB;
	if (!db) {
		return error(500, 'Service temporarily unavailable');
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
		return error(401, 'Authentication required');
	}

	// Cache privately for the user to avoid re-fetching on each request
	setHeaders({
		'Cache-Control': 'private, max-age=300, stale-while-revalidate=60'
	});

	let preferences = {};
	if (userData.preferences) {
		try {
			preferences = JSON.parse(userData.preferences as string);
		} catch (e) {
			console.error('Failed to parse user preferences JSON:', e);
		}
	}

	return json({
		displayName: userData.displayName,
		theme: userData.theme || 'system',
		country: userData.country,
		preferences
	});
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return error(401, 'Authentication required');
	}

	const db = platform?.env?.DB;
	if (!db) {
		return error(500, 'Service temporarily unavailable');
	}

	const drizzle = getDB(db);

	let body;
	try {
		const rawBody = await request.json();
		body = preferencesSchema.parse(rawBody);
	} catch (e) {
		if (e instanceof z.ZodError) {
			return error(400, `Validation error: ${e.issues.map((err) => err.message).join(', ')}`);
		}
		return error(400, 'Invalid request body');
	}

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
		updates.theme = body.theme;
	}

	if (body.country !== undefined) {
		updates.country = body.country;
	}

	if (body.preferences !== undefined) {
		const [currentUser] = await drizzle
			.select({ preferences: user.preferences })
			.from(user)
			.where(eq(user.id, locals.user.id));

		let currentPrefs = {};
		if (currentUser?.preferences) {
			try {
				currentPrefs = JSON.parse(currentUser.preferences as string);
			} catch (e) {
				console.error('Failed to parse existing preferences JSON:', e);
			}
		}

		const mergedPrefs = { ...currentPrefs, ...body.preferences };
		updates.preferences = JSON.stringify(mergedPrefs);
	}

	await drizzle.update(user).set(updates).where(eq(user.id, locals.user.id));

	const [updatedUser] = await drizzle
		.select({
			displayName: user.displayName,
			theme: user.theme,
			country: user.country,
			preferences: user.preferences
		})
		.from(user)
		.where(eq(user.id, locals.user.id));

	let preferences = {};
	if (updatedUser.preferences) {
		try {
			preferences = JSON.parse(updatedUser.preferences as string);
		} catch (e) {
			console.error('Failed to parse updated preferences JSON:', e);
		}
	}

	return json({
		displayName: updatedUser.displayName,
		theme: updatedUser.theme || 'system',
		country: updatedUser.country,
		preferences
	});
};
