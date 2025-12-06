// Better Auth catch-all route handler for SvelteKit
// This exports the auth handlers directly from the Better Auth instance
// See: https://www.better-auth.com/docs/integrations/sveltekit

import { toSvelteKitHandler } from 'better-auth/svelte-kit';
import type { RequestHandler } from './$types';
import { checkRateLimit, getClientIP, getRateLimits } from '$lib/server/ratelimit';
import { validatePassword } from '$lib/server/password-validator';
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
	const url = event.url.origin;

	// Detect staging/preview environments for relaxed rate limits
	const isStagingOrPreview =
		/preview-\d+\..*\.pages\.dev/.test(url) ||
		url.includes('staging.') ||
		url.includes('localhost') ||
		url.includes('127.0.0.1');

	const rateLimits = getRateLimits(isStagingOrPreview);

	// Determine which rate limit to apply based on endpoint
	let rateLimitConfig = null;
	let identifier = clientIP;

	if (path.includes('/sign-in/email')) {
		rateLimitConfig = rateLimits.LOGIN;
	} else if (path.includes('/sign-up/email')) {
		rateLimitConfig = rateLimits.REGISTER;
	} else if (path.includes('/forget-password') || path.includes('/reset-password')) {
		rateLimitConfig = rateLimits.PASSWORD_RESET;
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

	// Server-side password validation for registration
	if (path.includes('/sign-up/email')) {
		try {
			const clonedRequest = event.request.clone();
			const body = (await clonedRequest.json()) as { password?: string };

			if (body.password) {
				const validation = validatePassword(body.password);
				if (!validation.valid) {
					return json(
						{
							message: validation.errors[0],
							code: 'WEAK_PASSWORD'
						},
						{ status: 400 }
					);
				}
			}
		} catch {
			// If we can't parse the body, let Better Auth handle the error
		}
	}

	return toSvelteKitHandler(auth)(event);
};
