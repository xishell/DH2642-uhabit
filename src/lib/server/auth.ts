import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { haveIBeenPwned, username } from 'better-auth/plugins';
import { APIError } from 'better-auth/api';
import { getDB } from './db';
import * as schema from './db/schema';

const resolveAuthMode = (url: string, devMode: boolean) => {
	const isStagingOrPreview =
		/preview-\d+\..*\.pages\.dev/.test(url) || url.includes('staging.') || url.includes('preview.');
	const isProductionUrl =
		(!url.includes('.pages.dev') && !url.includes('.workers.dev') && url.startsWith('https://')) ||
		(url.includes('.pages.dev') && !isStagingOrPreview);
	const isLocalUrl = url.includes('localhost') || url.includes('127.0.0.1');
	const isDevEnvironment = isLocalUrl || isStagingOrPreview;

	const allowDevMode = !(isProductionUrl && !isDevEnvironment);
	const isDev = (allowDevMode && devMode) || isDevEnvironment;

	return { isDev, isProductionUrl, allowDevMode };
};

const warnWeakSecret = (url: string, secret: string | null | undefined) => {
	const isStagingOrPreview =
		/preview-\d+\..*\.pages\.dev/.test(url) || url.includes('staging.') || url.includes('preview.');
	const isProduction =
		url.startsWith('https://') &&
		!url.includes('localhost') &&
		!url.includes('127.0.0.1') &&
		!isStagingOrPreview;
	if (isProduction && secret && secret.length < 32) {
		console.error(
			'[AUTH] SECURITY WARNING: BETTER_AUTH_SECRET is too short for production. ' +
				'Use at least 32 characters.'
		);
	}
};

export function createAuth(db: D1Database, secret: string, url: string, devMode = false) {
	const { isDev, isProductionUrl, allowDevMode } = resolveAuthMode(url, devMode);
	if (!allowDevMode && devMode) {
		console.error(
			'[AUTH] SECURITY WARNING: DEV_MODE=true detected with production URL. Ignoring DEV_MODE. URL:',
			url
		);
	}

	warnWeakSecret(url, secret);

	if (isDev) {
		console.log('[AUTH] Running in DEVELOPMENT mode - relaxed security settings enabled');
	} else if (isProductionUrl) {
		console.log('[AUTH] Running in PRODUCTION mode with strict security settings');
	}

	return betterAuth({
		database: drizzleAdapter(getDB(db), {
			provider: 'sqlite',
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification
			}
		}),
		plugins: [
			// Enable username-based authentication
			username(),
			// Check passwords against 800M+ breached passwords
			// Only enabled in production (dev mode allows weak passwords for testing)
			...(!isDev
				? [
						haveIBeenPwned({
							customPasswordCompromisedMessage:
								'This password is too common and may be easy to guess. Please choose a more unique password.'
						})
					]
				: [])
		],
		emailAndPassword: {
			enabled: true,
			// In dev mode, skip email verification for easier testing
			requireEmailVerification: false,
			// In production enable this:
			// requireEmailVerification: !isDev

			// Password requirements (enforced by Better Auth)
			minPasswordLength: isDev ? 4 : 8,
			// Note: Additional password validation happens client-side
			// via PasswordStrengthIndicator component

			// Lower bcrypt cost for Cloudflare Workers (10ms CPU limit)
			// Default is 10, but that exceeds Workers CPU limits
			password: {
				hash: async (password: string) => {
					const bcrypt = await import('bcryptjs');
					return bcrypt.hash(password, 6);
				},
				verify: async (data: { password: string; hash: string }) => {
					const bcrypt = await import('bcryptjs');
					return bcrypt.compare(data.password, data.hash);
				}
			}
		},
		session: {
			// Extended session in dev mode for convenience
			expiresIn: isDev ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days in dev, 7 days in prod
			updateAge: isDev ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // 7 days in dev, 1 day in prod
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5 // 5 minutes
			}
		},
		secret,
		baseURL: `${url}/api/auth`,
		// Custom user fields
		user: {
			additionalFields: {
				// Note: username and displayUsername are handled by the username plugin
				// Note: name is used as the display name (required by Better Auth)
				pronouns: {
					type: 'string',
					required: false
				},
				theme: {
					type: 'string',
					required: false,
					defaultValue: 'system'
				},
				country: {
					type: 'string',
					required: false
				},
				preferences: {
					type: 'string',
					required: false
				}
			}
		},
		advanced: {
			// CSRF Protection is enabled by default in Better Auth
			// Cookie security settings
			useSecureCookies: url.startsWith('https://'),
			...(isDev && {
				crossSubDomainCookies: {
					enabled: false
				}
			})
		},
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						// Validate and normalize email
						const email = user.email?.toLowerCase().trim() ?? '';

						// Email format validation
						const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
						if (!emailRegex.test(email)) {
							throw new APIError('BAD_REQUEST', {
								message: 'Please enter a valid email address'
							});
						}

						// Normalize the email (lowercase + trim whitespace)
						user.email = email;

						// Normalize username (lowercase, trim)
						if (user.username && typeof user.username === 'string') {
							user.username = user.username.toLowerCase().trim();
						}

						// Set name from username if not provided (name is used as username display)
						if (!user.name && user.username) {
							user.name = user.username as string;
						} else if (!user.name) {
							user.name = user.email.split('@')[0];
						}
					}
				}
			}
		}
	});
}

export type Auth = ReturnType<typeof createAuth>;
