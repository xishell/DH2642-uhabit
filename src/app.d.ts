// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: import('$lib/server/auth').Auth;
			user: {
				id: string;
				name: string;
				email: string;
				emailVerified: boolean;
				image?: string | null;
				createdAt: Date;
				updatedAt: Date;
				displayName?: string | null;
				theme?: string | null;
				country?: string | null;
				preferences?: string | null;
			} | null;
			session: {
				id: string;
				userId: string;
				expiresAt: Date;
				token: string;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
				BETTER_AUTH_SECRET: string;
				BETTER_AUTH_URL?: string; // Optional: auto-detects from request if not set
				DEV_MODE?: string; // Optional: set to "true" for dev mode
				RATE_LIMIT?: KVNamespace; // Optional: KV namespace for rate limiting
				QUOTES_CACHE?: KVNamespace; // Optional: KV namespace for quotes caching
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
