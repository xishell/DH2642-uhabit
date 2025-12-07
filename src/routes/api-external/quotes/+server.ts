import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type QuoteData = {
	quote: string | null;
	author: string | null;
};

const CACHE_KEY = 'daily-quote';
const CACHE_TTL = 300; // 5 minutes in seconds

export const GET: RequestHandler = async ({ platform, url }) => {
	const kv = platform?.env?.QUOTES_CACHE;
	const cacheOnly = url.searchParams.get('cacheOnly') === '1';

	// Try KV cache first
	if (kv) {
		try {
			const cached = await kv.get<QuoteData>(CACHE_KEY, 'json');
			if (cached) {
				return json(cached, {
					headers: { 'Cache-Control': 'public, max-age=60' }
				});
			}

			// If cache-only requested and nothing in KV, return early
			if (cacheOnly) {
				return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
			}
		} catch {
			// KV read failed, continue to fetch
		}
	} else if (cacheOnly) {
		// No KV available and cache-only requested
		return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
	}

	// Fetch fresh quote
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 1200);

	try {
		const res = await fetch('https://zenquotes.io/api/random', {
			signal: controller.signal
		});

		if (!res.ok) {
			return json({ quote: null, author: null }, { status: 502 });
		}

		const data = await res.json();
		const first = Array.isArray(data) ? data[0] : null;
		const result: QuoteData = {
			quote: first?.q ?? null,
			author: first?.a ?? null
		};

		// Store in KV with TTL (non-blocking)
		if (kv && result.quote) {
			platform?.context?.waitUntil(
				kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: CACHE_TTL })
			);
		}

		return json(result, {
			headers: { 'Cache-Control': 'public, max-age=60' }
		});
	} catch (err) {
		console.error('ZenQuotes fetch failed', err);
		return json({ quote: null, author: null }, { status: 502 });
	} finally {
		clearTimeout(timeout);
	}
};
