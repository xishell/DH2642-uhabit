import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { createAuth } from '$lib/server/auth';
import { routes } from '$lib/routes';

/** Type alias for hook handler parameters */
type HookParams = Parameters<Handle>[0];
type HookEvent = HookParams['event'];
type HookResolve = HookParams['resolve'];

/** Static asset file extensions that bypass auth processing */
const STATIC_EXTENSIONS = [
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.webp',
	'.svg',
	'.ico',
	'.woff',
	'.woff2',
	'.ttf',
	'.eot',
	'.css',
	'.js',
	'.mjs',
	'.json',
	'.xml',
	'.map',
	'.txt',
	'.webmanifest'
] as const;

const isStaticAsset = (pathname: string) =>
	pathname.startsWith('/_app/') ||
	pathname.startsWith('/favicon') ||
	STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));

const buildCSP = () => [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline'",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob:",
	"font-src 'self'",
	"connect-src 'self' https://*.cloudflareaccess.com",
	"frame-ancestors 'none'",
	"base-uri 'self'",
	"form-action 'self'"
];

const applySecurityHeaders = (response: Response, isHttps: boolean) => {
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set(
		'Permissions-Policy',
		'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
	);
	response.headers.set('Content-Security-Policy', buildCSP().join('; '));
	if (isHttps) {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
};

const isPublicRoute = (event: HookEvent) =>
	event.route.id === '/login' ||
	event.route.id === '/register' ||
	event.route.id === '/' ||
	event.url.pathname.startsWith('/api/');

const validateSecretStrength = (url: string, secret?: string | null) => {
	const isStagingOrPreview =
		/preview-\d+\..*\.pages\.dev/.test(url) || url.includes('staging.') || url.includes('preview.');
	const isProduction =
		url.startsWith('https://') &&
		!url.includes('localhost') &&
		!url.includes('127.0.0.1') &&
		!isStagingOrPreview;
	if (isProduction && secret && secret.length < 32) {
		console.error(
			'[HOOKS] SECURITY WARNING: BETTER_AUTH_SECRET is too short for production. Use at least 32 characters.'
		);
	}
};

const resolveWithSecurity = async (event: HookEvent, resolve: HookResolve) => {
	const response = await resolve(event);
	applySecurityHeaders(response, event.url.protocol === 'https:');
	return response;
};

const fetchSession = async (event: HookEvent) => {
	try {
		const session = await event.locals.auth?.api.getSession({
			headers: event.request.headers
		});
		event.locals.user = session?.user ?? null;
		event.locals.session = session?.session ?? null;
	} catch (error) {
		console.error('[HOOKS] Session fetch error:', error);
		event.locals.user = null;
		event.locals.session = null;
	}
};

const fetchSessionAndGuard = async (event: HookEvent) => {
	await fetchSession(event);
	if (!event.locals.user && !isPublicRoute(event)) {
		throw redirect(302, routes.login);
	}
};

const prepareAuth = async (event: HookEvent, resolve: HookResolve) => {
	const env = event.platform?.env;
	const db = env?.DB;
	const secret = env?.BETTER_AUTH_SECRET;
	const url = env?.BETTER_AUTH_URL || event.url.origin;
	const devModeEnv = env?.DEV_MODE === 'true';

	validateSecretStrength(url, secret);

	if (!db || !secret) {
		console.error('[HOOKS] Missing DB or BETTER_AUTH_SECRET in platform.env');
		event.locals.user = null;
		event.locals.session = null;
		event.locals.auth = null;
		const resolved = await resolveWithSecurity(event, resolve);
		return { response: resolved, isAuthRoute: false };
	}

	event.locals.auth = createAuth(db, secret, url, devModeEnv);
	event.locals.user = null;
	event.locals.session = null;

	return { response: undefined, isAuthRoute: event.url.pathname.startsWith('/api/auth/') };
};

export const handle: Handle = async ({ event, resolve }) => {
	if (isStaticAsset(event.url.pathname)) {
		return resolve(event);
	}

	const { response, isAuthRoute } = await prepareAuth(event, resolve);
	if (response) return response;

	if (!isAuthRoute) {
		await fetchSessionAndGuard(event);
	}

	const handledResponse = await resolve(event);
	applySecurityHeaders(handledResponse, event.url.protocol === 'https:');
	return handledResponse;
};
