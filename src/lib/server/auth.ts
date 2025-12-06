import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
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
		emailAndPassword: {
			enabled: true,
			// In dev mode, skip email verification for easier testing
			requireEmailVerification: false,
			// In production, you should enable this:
			// requireEmailVerification: !isDev
			...(isDev && {
				// Relaxed password requirements for dev/staging
				minPasswordLength: 4
			})
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
			// Enable debug logging in dev mode
			...(isDev && {
				useSecureCookies: url.startsWith('https://'),
				crossSubDomainCookies: {
					enabled: false
				}
			})
		}
	});
}

export type Auth = ReturnType<typeof createAuth>;
