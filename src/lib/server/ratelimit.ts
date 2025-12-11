/**
 * Rate limiter for Cloudflare Workers with KV storage
 *
 * Uses Cloudflare KV for persistent, distributed rate limiting.
 * Falls back to in-memory storage for local development.
 */

interface RateLimitConfig {
	maxRequests: number;
	windowSeconds: number;
}

interface RateLimitStore {
	count: number;
	resetAt: number;
}

type RateLimitOptions = {
	/**
	 * Whether to consume a token from the limit (increment the count).
	 * Set to false when you only want to read the current state.
	 */
	consume?: boolean;
};

// In-memory fallback store for local development
const memoryStore = new Map<string, RateLimitStore>();

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (IP, email, etc.)
 * @param config - Rate limit configuration
 * @param kv - Optional KV namespace for persistent storage
 * @param options - Optional options for the rate limit check
 */
export async function checkRateLimit(
	identifier: string,
	config: RateLimitConfig,
	kv?: KVNamespace,
	options?: RateLimitOptions
): Promise<{
	allowed: boolean;
	limit: number;
	remaining: number;
	resetAt: number;
}> {
	const now = Date.now();
	const windowMs = config.windowSeconds * 1000;
	const key = `rl:${identifier}`;
	const consume = options?.consume !== false;

	let record: RateLimitStore | null = null;

	// Try to get from KV if available
	if (kv) {
		try {
			const stored = await kv.get(key, 'json');
			if (stored) {
				record = stored as RateLimitStore;
			}
		} catch (error) {
			console.error('[RATE_LIMIT] KV read error:', error);
			// Fall through to memory store
		}
	} else {
		// Use in-memory store for local dev
		record = memoryStore.get(key) || null;
	}

	// Create new record or reset if window expired
	if (!record || now > record.resetAt) {
		record = {
			count: 0,
			resetAt: now + windowMs
		};
	}

	const nextCount = consume ? record.count + 1 : record.count;
	const allowed = nextCount <= config.maxRequests;
	const remaining = Math.max(0, config.maxRequests - nextCount);

	if (consume) {
		record.count = nextCount;

		// Save back to storage
		if (kv) {
			try {
				// Set with TTL to auto-expire
				await kv.put(key, JSON.stringify(record), {
					expirationTtl: config.windowSeconds + 60 // Extra 60s buffer
				});
			} catch (error) {
				console.error('[RATE_LIMIT] KV write error:', error);
				// Continue; one request may be miscounted but won't crash
			}
		} else {
			memoryStore.set(key, record);
		}
	}

	return {
		allowed,
		limit: config.maxRequests,
		remaining,
		resetAt: Math.floor(record.resetAt / 1000)
	};
}

/**
 * Extract client identifier from request
 * Uses Cloudflare headers to get real IP
 */
export function getClientIP(request: Request): string {
	return (
		request.headers.get('CF-Connecting-IP') ||
		request.headers.get('X-Forwarded-For')?.split(',')[0] ||
		request.headers.get('X-Real-IP') ||
		'unknown'
	);
}

/**
 * Cleanup expired entries from memory store
 * Only needed for local dev (KV handles expiration automatically)
 */
export function cleanupExpired() {
	const now = Date.now();
	for (const [key, record] of memoryStore.entries()) {
		if (now > record.resetAt) {
			memoryStore.delete(key);
		}
	}
}

// Predefined rate limit configs for production
export const RATE_LIMITS = {
	/** 5 login attempts per 15 minutes per IP */
	LOGIN: { maxRequests: 5, windowSeconds: 15 * 60 },

	/** 10 registration attempts per hour per IP */
	REGISTER_ATTEMPT: { maxRequests: 10, windowSeconds: 60 * 60 },

	/** 3 successful registrations per hour per IP */
	REGISTER_SUCCESS: { maxRequests: 3, windowSeconds: 60 * 60 },

	/** 3 password resets per hour per IP */
	PASSWORD_RESET: { maxRequests: 3, windowSeconds: 60 * 60 },

	/** 100 API calls per minute per IP */
	API: { maxRequests: 100, windowSeconds: 60 }
} as const;

// Relaxed rate limits for staging/preview environments
export const RATE_LIMITS_DEV = {
	/** 20 login attempts per 15 minutes per IP */
	LOGIN: { maxRequests: 20, windowSeconds: 15 * 60 },

	/** 20 registration attempts per hour per IP */
	REGISTER_ATTEMPT: { maxRequests: 20, windowSeconds: 60 * 60 },

	/** 10 successful registrations per hour per IP */
	REGISTER_SUCCESS: { maxRequests: 10, windowSeconds: 60 * 60 },

	/** 10 password resets per hour per IP */
	PASSWORD_RESET: { maxRequests: 10, windowSeconds: 60 * 60 },

	/** 500 API calls per minute per IP */
	API: { maxRequests: 500, windowSeconds: 60 }
} as const;

/**
 * Get rate limits based on environment
 */
export function getRateLimits(isDevMode: boolean) {
	return isDevMode ? RATE_LIMITS_DEV : RATE_LIMITS;
}
