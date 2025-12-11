import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '$lib/server/api-helpers';

// Validation schema for user preferences
const preferencesSchema = z.object({
	firstName: z.string().min(1).max(50).optional(),
	lastName: z.string().min(1).max(50).optional(),
	username: z
		.string()
		.min(3)
		.max(20)
		.regex(/^[a-zA-Z0-9_]+$/)
		.optional(),
	displayName: z.string().min(1).max(100).optional(),
	theme: z.enum(['light', 'dark', 'system']).optional(),
	country: z.string().length(2).optional(), // ISO 3166-1 alpha-2 code
	preferences: z
		.object({
			notifications: z.boolean().optional(),
			emailNotifications: z.boolean().optional(),
			weekStartsOn: z.number().int().min(0).max(6).optional()
		})
		.optional()
});

export const GET: RequestHandler = async ({ locals, platform, setHeaders }) => {
	const userId = requireAuth(locals);

	const db = platform?.env?.DB;
	if (!db) {
		return error(500, 'Service temporarily unavailable');
	}

	const drizzle = getDB(db);

	const [userData] = await drizzle
		.select({
			firstName: user.firstName,
			lastName: user.lastName,
			username: user.username,
			displayName: user.displayName,
			theme: user.theme,
			country: user.country,
			preferences: user.preferences
		})
		.from(user)
		.where(eq(user.id, userId));

	if (!userData) {
		return error(401, 'Authentication required');
	}

	// Private cache to avoid re-fetching each request
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
		firstName: userData.firstName,
		lastName: userData.lastName,
		username: userData.username,
		displayName: userData.displayName,
		theme: userData.theme || 'system',
		country: userData.country,
		preferences
	});
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
	const userId = requireAuth(locals);

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
		firstName?: string;
		lastName?: string;
		username?: string;
		name?: string;
		displayName?: string;
		theme?: string;
		country?: string;
		preferences?: string;
	} = {};

	if (body.firstName !== undefined) {
		updates.firstName = body.firstName;
	}

	if (body.lastName !== undefined) {
		updates.lastName = body.lastName;
	}

	// Keep name in sync with first/last for Better Auth
	if (body.firstName !== undefined || body.lastName !== undefined) {
		const [currentUser] = await drizzle
			.select({ firstName: user.firstName, lastName: user.lastName })
			.from(user)
			.where(eq(user.id, userId));

		const newFirstName = body.firstName ?? currentUser?.firstName ?? '';
		const newLastName = body.lastName ?? currentUser?.lastName ?? '';
		updates.name = [newFirstName, newLastName].filter(Boolean).join(' ') || 'User';
	}

	if (body.username !== undefined) {
		updates.username = body.username.toLowerCase().trim();
	}

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
			.where(eq(user.id, userId));

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

	await drizzle.update(user).set(updates).where(eq(user.id, userId));

	const [updatedUser] = await drizzle
		.select({
			firstName: user.firstName,
			lastName: user.lastName,
			username: user.username,
			displayName: user.displayName,
			theme: user.theme,
			country: user.country,
			preferences: user.preferences
		})
		.from(user)
		.where(eq(user.id, userId));

	let preferences = {};
	if (updatedUser.preferences) {
		try {
			preferences = JSON.parse(updatedUser.preferences as string);
		} catch (e) {
			console.error('Failed to parse updated preferences JSON:', e);
		}
	}

	return json({
		firstName: updatedUser.firstName,
		lastName: updatedUser.lastName,
		username: updatedUser.username,
		displayName: updatedUser.displayName,
		theme: updatedUser.theme || 'system',
		country: updatedUser.country,
		preferences
	});
};
