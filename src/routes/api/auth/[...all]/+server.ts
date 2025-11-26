import { createAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	const secret = platform?.env?.BETTER_AUTH_SECRET;
	const url = platform?.env?.BETTER_AUTH_URL || new URL(request.url).origin;

	if (!db || !secret) {
		return new Response('Missing configuration', { status: 500 });
	}

	const auth = createAuth(db, secret, url);
	return auth.handler(request);
};

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	const secret = platform?.env?.BETTER_AUTH_SECRET;
	const url = platform?.env?.BETTER_AUTH_URL || new URL(request.url).origin;

	if (!db || !secret) {
		return new Response('Missing configuration', { status: 500 });
	}

	const auth = createAuth(db, secret, url);
	return auth.handler(request);
};
