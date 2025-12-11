// Better Auth catch-all route handler for SvelteKit
// Export Better Auth handlers directly
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

	// Detect staging/preview for relaxed rate limits
	const isStagingOrPreview =
		/preview-\d+\..*\.pages\.dev/.test(url) ||
		url.includes('staging.') ||
		url.includes('localhost') ||
		url.includes('127.0.0.1');

	const rateLimits = getRateLimits(isStagingOrPreview);

	// Choose rate limit by endpoint
	let rateLimitConfig = null;
	let identifier = clientIP;

	const isRegistrationPath = path.includes('/sign-up/email');

	if (path.includes('/sign-in/email')) {
		rateLimitConfig = rateLimits.LOGIN;
	} else if (isRegistrationPath) {
		rateLimitConfig = rateLimits.REGISTER_ATTEMPT;
	} else if (path.includes('/forget-password') || path.includes('/reset-password')) {
		rateLimitConfig = rateLimits.PASSWORD_RESET;
	}

	// Check rate limit if applicable
	if (rateLimitConfig) {
		// Use KV namespace if available, fallback to in-memory for dev
		const kv = event.platform?.env?.RATE_LIMIT;
		const result = await checkRateLimit(
			isRegistrationPath ? `register:attempt:${identifier}` : identifier,
			rateLimitConfig,
			kv
		);

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

	// Pre-check success limit before processing registration
	if (isRegistrationPath) {
		const kv = event.platform?.env?.RATE_LIMIT;
		const successLimit = rateLimits.REGISTER_SUCCESS;
		const successIdentifier = `register:success:${identifier}`;
		const successCheck = await checkRateLimit(successIdentifier, successLimit, kv, {
			consume: false
		});

		if (!successCheck.allowed) {
			return json(
				{
					error: 'Too many successful registrations from this IP. Please try again later.',
					retryAfter: successCheck.resetAt
				},
				{
					status: 429,
					headers: {
						'Retry-After': successCheck.resetAt.toString(),
						'X-RateLimit-Limit': successCheck.limit.toString(),
						'X-RateLimit-Remaining': successCheck.remaining.toString(),
						'X-RateLimit-Reset': successCheck.resetAt.toString()
					}
				}
			);
		}
	}

	// Server-side password validation for registration
	if (isRegistrationPath) {
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

	const response = await toSvelteKitHandler(auth)(event);

	// Count only successful registrations toward the limit
	if (isRegistrationPath && response.ok) {
		const kv = event.platform?.env?.RATE_LIMIT;
		const successLimit = rateLimits.REGISTER_SUCCESS;
		const successIdentifier = `register:success:${identifier}`;
		await checkRateLimit(successIdentifier, successLimit, kv);
	}

	return response;
};
