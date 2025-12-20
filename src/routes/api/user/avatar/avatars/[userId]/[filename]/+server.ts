import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const { userId, filename } = params;

	const bucket = platform?.env?.AVATARS;
	if (!bucket) {
		throw error(500, 'Storage not configured');
	}

	const objectKey = `avatars/${userId}/${filename}`;

	try {
		const object = await bucket.get(objectKey);

		if (!object) {
			throw error(404, 'Avatar not found');
		}

		const headers = new Headers();
		headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
		headers.set('Cache-Control', 'public, max-age=31536000, immutable');
		headers.set('ETag', object.httpEtag);

		return new Response(object.body, {
			headers
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('[Avatar] Failed to serve avatar:', err);
		throw error(500, 'Failed to load avatar');
	}
};
