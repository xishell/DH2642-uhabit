import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { haveIBeenPwned } from 'better-auth/plugins';
import { APIError } from 'better-auth/api';
import { getDB } from './db';
import * as schema from './db/schema';

export function createAuth(db: D1Database, secret: string, url: string, devMode = false) {
	// Development mode configuration for easier testing on staging
	const isDev = devMode || url.includes('localhost') || url.includes('127.0.0.1');

	if (isDev) {
		console.log('[AUTH] Running in DEVELOPMENT mode - relaxed security settings enabled');
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
			// Check passwords against 800M+ breached passwords
			// Only enabled in production (dev mode allows weak passwords for testing)
			...(!isDev
				? [
						haveIBeenPwned({
							customPasswordCompromisedMessage:
								'This password has been exposed in a data breach. Please choose a different password.'
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
			minPasswordLength: isDev ? 4 : 8
			// Note: Additional password validation happens client-side
			// via PasswordStrengthIndicator component
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
				displayName: {
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
					}
				}
			}
		}
	});
}

export type Auth = ReturnType<typeof createAuth>;
