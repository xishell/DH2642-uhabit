import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { KV_KEYS } from '$lib/constants';

type QuoteData = {
	quote: string | null;
	author: string | null;
};
const CACHE_TTL = 300;
const CDN_MAX_AGE = 300;
const CDN_SWR = 600;

const cdnCacheHeaders = {
	'Cache-Control': `public, max-age=${CDN_MAX_AGE}, s-maxage=${CDN_MAX_AGE}, stale-while-revalidate=${CDN_SWR}`,
	'CDN-Cache-Control': `public, max-age=${CDN_MAX_AGE}`,
	'Cloudflare-CDN-Cache-Control': `max-age=${CDN_MAX_AGE}`,
	Vary: 'Accept-Encoding'
};

const readFromKV = async (kv: KVNamespace | undefined) => {
	if (!kv) return null;
	try {
		return await kv.get<QuoteData>(KV_KEYS.DAILY_QUOTE, 'json');
	} catch {
		return null;
	}
};

const fetchQuote = async () => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 1200);

	try {
		const res = await fetch('https://zenquotes.io/api/random', {
			signal: controller.signal
		});

		if (!res.ok) {
			return null;
		}

		const data = await res.json();
		const first = Array.isArray(data) ? data[0] : null;
		return {
			quote: first?.q ?? null,
			author: first?.a ?? null
		} satisfies QuoteData;
	} catch (err) {
		console.error('ZenQuotes fetch failed', err);
		return null;
	} finally {
		clearTimeout(timeout);
	}
};

const cacheQuote = (kv: KVNamespace | undefined, quote: QuoteData) => {
	if (kv && quote.quote) {
		kv.put(KV_KEYS.DAILY_QUOTE, JSON.stringify(quote), { expirationTtl: CACHE_TTL }).catch(
			() => {}
		);
	}
};

export const GET: RequestHandler = async ({ platform, url }) => {
	const kv = platform?.env?.QUOTES_CACHE;
	const cacheOnly = url.searchParams.get('cacheOnly') === '1';

	const cached = await readFromKV(kv);
	if (cached) {
		return json(cached, { headers: cdnCacheHeaders });
	}

	if (cacheOnly) {
		return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
	}

	const result = await fetchQuote();
	if (!result) {
		return json({ quote: null, author: null }, { status: 502 });
	}

	cacheQuote(kv, result);
	return json(result, { headers: cdnCacheHeaders });
};
