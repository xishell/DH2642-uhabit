import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, enforceApiRateLimit } from '$lib/server/api-helpers';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Magic byte patterns for allowed image formats
const IMAGE_MAGIC_PATTERNS: { bytes: number[]; offsets?: number[] }[] = [
	{ bytes: [0xff, 0xd8, 0xff] }, // JPEG
	{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG
	{ bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF
	{ bytes: [0x52, 0x49, 0x46, 0x46], offsets: [0, 1, 2, 3] } // WEBP (RIFF header)
];
const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50]; // WEBP marker at offset 8

function isValidImageMagicBytes(bytes: Uint8Array): boolean {
	for (const pattern of IMAGE_MAGIC_PATTERNS) {
		const matches = pattern.bytes.every((byte, i) => bytes[pattern.offsets?.[i] ?? i] === byte);
		if (matches) {
			// Special check for WEBP: also verify bytes 8-11
			if (pattern.bytes[0] === 0x52) {
				return WEBP_MARKER.every((byte, i) => bytes[8 + i] === byte);
			}
			return true;
		}
	}
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

async function parseAndValidateFile(
	request: Request
): Promise<{ file: File; buffer: ArrayBuffer }> {
	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		throw error(400, 'Invalid form data');
	}
	const file = formData.get('avatar');
	if (!file || !(file instanceof File)) throw error(400, 'No file provided');
	if (!ALLOWED_TYPES.includes(file.type))
		throw error(400, 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
	if (file.size > MAX_FILE_SIZE) throw error(400, 'File too large. Maximum size: 5MB');
	const buffer = await file.arrayBuffer();
	if (!isValidImageMagicBytes(new Uint8Array(buffer))) throw error(400, 'Invalid image file');
	return { file, buffer };
}

async function deleteOldAvatar(bucket: R2Bucket, imageUrl: string | null): Promise<void> {
	if (!imageUrl) return;
	const oldKey = extractKeyFromUrl(imageUrl);
	if (oldKey) {
		await bucket.delete(oldKey).catch(() => {
			/* Ignore deletion errors */
		});
	}
}

export const POST: RequestHandler = async (event) => {
	const { request, locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);

	const bucket = platform?.env?.AVATARS;
	const db = platform?.env?.DB;
	if (!bucket || !db) throw error(500, 'Storage not configured');

	const { file, buffer } = await parseAndValidateFile(request);
	const extension = getExtensionFromMimeType(file.type);
	const objectKey = `avatars/${userId}/${Date.now()}${extension}`;
	const drizzle = getDB(db);

	try {
		const [currentUser] = await drizzle
			.select({ image: user.image })
			.from(user)
			.where(eq(user.id, userId));
		await deleteOldAvatar(bucket, currentUser?.image ?? null);
		await bucket.put(objectKey, buffer, {
			httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' }
		});
		const avatarUrl = `/api/user/avatar/${objectKey}`;
		await drizzle
			.update(user)
			.set({ image: avatarUrl, updatedAt: new Date() })
			.where(eq(user.id, userId));
		return json({ success: true, imageUrl: avatarUrl });
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
	if (!bucket || !db) throw error(500, 'Service not configured');

	const drizzle = getDB(db);
	try {
		const [currentUser] = await drizzle
			.select({ image: user.image })
			.from(user)
			.where(eq(user.id, userId));
		await deleteOldAvatar(bucket, currentUser?.image ?? null);
		await drizzle
			.update(user)
			.set({ image: null, updatedAt: new Date() })
			.where(eq(user.id, userId));
		return json({ success: true });
	} catch (err) {
		console.error('[Avatar] Delete failed:', err);
		throw error(500, 'Failed to delete avatar');
	}
};
