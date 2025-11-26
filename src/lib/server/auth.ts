import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDB } from './db';
import * as schema from './db/schema';

export function createAuth(db: D1Database, secret: string, url: string) {
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
			requireEmailVerification: false // Set to true for email verification
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // 1 day
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5 // 5 minutes
			}
		},
		secret,
		baseURL: url,
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
		}
	});
}

export type Auth = ReturnType<typeof createAuth>;
