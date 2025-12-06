// Better Auth catch-all route handler for SvelteKit
// This exports the auth handlers directly from the Better Auth instance
// See: https://www.better-auth.com/docs/integrations/sveltekit

import { toSvelteKitHandler } from 'better-auth/svelte-kit';
import type { RequestHandler } from './$types';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '$lib/server/ratelimit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	const auth = event.locals.auth;
	if (!auth) {
		return new Response('Auth not configured', { status: 500 });
	}
	return toSvelteKitHandler(auth)(event);
};

export const POST: RequestHandler = async (event) => {
	const auth = event.locals.auth;
	if (!auth) {
		return new Response('Auth not configured', { status: 500 });
	}

	// Apply rate limiting to sensitive endpoints
	const path = event.url.pathname;
	const clientIP = getClientIP(event.request);

	// Determine which rate limit to apply based on endpoint
	let rateLimitConfig = null;
	let identifier = clientIP;

	if (path.includes('/sign-in/email')) {
		rateLimitConfig = RATE_LIMITS.LOGIN;
	} else if (path.includes('/sign-up/email')) {
		rateLimitConfig = RATE_LIMITS.REGISTER;
	} else if (path.includes('/forget-password') || path.includes('/reset-password')) {
		rateLimitConfig = RATE_LIMITS.PASSWORD_RESET;
	}

	// Check rate limit if applicable
	if (rateLimitConfig) {
		// Use KV namespace if available, fallback to in-memory for local dev
		const kv = event.platform?.env?.RATE_LIMIT;
		const result = await checkRateLimit(identifier, rateLimitConfig, kv);

		if (!result.allowed) {
			return json(
				{
					error: 'Too many requests. Please try again later.',
					retryAfter: result.resetAt
				},
				{
					status: 429,
					headers: {
						'Retry-After': result.resetAt.toString(),
						'X-RateLimit-Limit': result.limit.toString(),
						'X-RateLimit-Remaining': result.remaining.toString(),
						'X-RateLimit-Reset': result.resetAt.toString()
					}
				}
			);
		}
	}

	return toSvelteKitHandler(auth)(event);
};
