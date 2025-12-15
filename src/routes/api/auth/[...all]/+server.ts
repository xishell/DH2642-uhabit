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

const getRateLimitContext = (event: Parameters<RequestHandler>[0]) => {
	const path = event.url.pathname;
	const clientIP = getClientIP(event.request);
	const url = event.url.origin;
	const isStagingOrPreview =
		/preview-\d+\..*\.pages\.dev/.test(url) ||
		url.includes('staging.') ||
		url.includes('localhost') ||
		url.includes('127.0.0.1');
	const rateLimits = getRateLimits(isStagingOrPreview);
	const isRegistrationPath = path.includes('/sign-up/email');

	let rateLimitConfig = null;
	if (path.includes('/sign-in/email')) {
		rateLimitConfig = rateLimits.LOGIN;
	} else if (isRegistrationPath) {
		rateLimitConfig = rateLimits.REGISTER_ATTEMPT;
	} else if (path.includes('/forget-password') || path.includes('/reset-password')) {
		rateLimitConfig = rateLimits.PASSWORD_RESET;
	}

	return { rateLimits, rateLimitConfig, clientIP, isRegistrationPath };
};

const applyRateLimit = async (
	event: Parameters<RequestHandler>[0],
	rateLimitConfig: ReturnType<typeof getRateLimits>[keyof ReturnType<typeof getRateLimits>] | null,
	identifier: string,
	isRegistrationPath: boolean
) => {
	if (!rateLimitConfig) return null;
	const kv = event.platform?.env?.RATE_LIMIT;
	const key = isRegistrationPath ? `register:attempt:${identifier}` : identifier;
	const result = await checkRateLimit(key, rateLimitConfig, kv);

	if (result.allowed) return null;

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
};

const precheckRegistrationSuccess = async (
	event: Parameters<RequestHandler>[0],
	rateLimits: ReturnType<typeof getRateLimits>,
	identifier: string
) => {
	const kv = event.platform?.env?.RATE_LIMIT;
	const successLimit = rateLimits.REGISTER_SUCCESS;
	const successIdentifier = `register:success:${identifier}`;
	const successCheck = await checkRateLimit(successIdentifier, successLimit, kv, {
		consume: false
	});

	if (successCheck.allowed) return null;

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
};

const validateRegistrationPassword = async (event: Parameters<RequestHandler>[0]) => {
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
		// Let Better Auth handle parse errors
	}
	return null;
};

const countSuccessfulRegistration = async (
	event: Parameters<RequestHandler>[0],
	rateLimits: ReturnType<typeof getRateLimits>,
	identifier: string
) => {
	const kv = event.platform?.env?.RATE_LIMIT;
	const successLimit = rateLimits.REGISTER_SUCCESS;
	const successIdentifier = `register:success:${identifier}`;
	await checkRateLimit(successIdentifier, successLimit, kv);
};

export const POST: RequestHandler = async (event) => {
	const auth = event.locals.auth;
	if (!auth) {
		return new Response('Auth not configured', { status: 500 });
	}

	const { rateLimits, rateLimitConfig, clientIP, isRegistrationPath } = getRateLimitContext(event);

	const rateLimitResponse = await applyRateLimit(
		event,
		rateLimitConfig,
		clientIP,
		isRegistrationPath
	);
	if (rateLimitResponse) return rateLimitResponse;

	if (isRegistrationPath) {
		const successPrecheck = await precheckRegistrationSuccess(event, rateLimits, clientIP);
		if (successPrecheck) return successPrecheck;

		const passwordValidation = await validateRegistrationPassword(event);
		if (passwordValidation) return passwordValidation;
	}

	const response = await toSvelteKitHandler(auth)(event);

	if (isRegistrationPath && response.ok) {
		await countSuccessfulRegistration(event, rateLimits, clientIP);
	}

	return response;
};
