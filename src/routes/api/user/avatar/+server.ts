import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, enforceApiRateLimit } from '$lib/server/api-helpers';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function isValidImageMagicBytes(bytes: Uint8Array): boolean {
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
	if (
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	)
		return true;
	if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;
	if (
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	)
		return true;
	return false;
}

function getExtensionFromMimeType(mimeType: string): string {
	const map: Record<string, string> = {
		'image/jpeg': '.jpg',
		'image/png': '.png',
		'image/webp': '.webp',
		'image/gif': '.gif'
	};
	return map[mimeType] || '.jpg';
}

function extractKeyFromUrl(url: string): string | null {
	const match = url.match(/avatars\/[^/]+\/[^/]+$/);
	return match ? match[0] : null;
}

export const POST: RequestHandler = async (event) => {
	const { request, locals, platform } = event;

	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);

	const bucket = platform?.env?.AVATARS;
	if (!bucket) {
		throw error(500, 'Storage not configured');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not configured');
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		throw error(400, 'Invalid form data');
	}

	const file = formData.get('avatar');

	if (!file || !(file instanceof File)) {
		throw error(400, 'No file provided');
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		throw error(400, 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
	}

	if (file.size > MAX_FILE_SIZE) {
		throw error(400, 'File too large. Maximum size: 5MB');
	}

	const buffer = await file.arrayBuffer();
	if (!isValidImageMagicBytes(new Uint8Array(buffer))) {
		throw error(400, 'Invalid image file');
	}

	const extension = getExtensionFromMimeType(file.type);
	const objectKey = `avatars/${userId}/${Date.now()}${extension}`;

	const drizzle = getDB(db);

	try {
		const [currentUser] = await drizzle
			.select({ image: user.image })
			.from(user)
			.where(eq(user.id, userId));

		if (currentUser?.image) {
			const oldKey = extractKeyFromUrl(currentUser.image);
			if (oldKey) {
				try {
					await bucket.delete(oldKey);
				} catch {
					// Ignore deletion errors for old avatar
				}
			}
		}

		await bucket.put(objectKey, buffer, {
			httpMetadata: {
				contentType: file.type,
				cacheControl: 'public, max-age=31536000, immutable'
			}
		});

		const avatarUrl = `/api/user/avatar/${objectKey}`;

		await drizzle
			.update(user)
			.set({
				image: avatarUrl,
				updatedAt: new Date()
			})
			.where(eq(user.id, userId));

		return json({
			success: true,
			imageUrl: avatarUrl
		});
	} catch (err) {
		console.error('[Avatar] Upload failed:', err);
		throw error(500, 'Failed to upload avatar');
	}
};

export const DELETE: RequestHandler = async (event) => {
	const { locals, platform } = event;

	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);

	const bucket = platform?.env?.AVATARS;
	const db = platform?.env?.DB;

	if (!bucket || !db) {
		throw error(500, 'Service not configured');
	}

	const drizzle = getDB(db);

	try {
		const [currentUser] = await drizzle
			.select({ image: user.image })
			.from(user)
			.where(eq(user.id, userId));

		if (currentUser?.image) {
			const objectKey = extractKeyFromUrl(currentUser.image);
			if (objectKey) {
				try {
					await bucket.delete(objectKey);
				} catch {
					// Ignore deletion errors
				}
			}
		}

		await drizzle
			.update(user)
			.set({
				image: null,
				updatedAt: new Date()
			})
			.where(eq(user.id, userId));

		return json({ success: true });
	} catch (err) {
		console.error('[Avatar] Delete failed:', err);
		throw error(500, 'Failed to delete avatar');
	}
};
