import { setJsonCookie } from '$lib/utils/cookie';

export type QuoteData = { quote?: string | null; author?: string | null };

export const readQuoteCache = (
	storage: Storage | null,
	browser: boolean,
	key: string
): QuoteData | null => {
	if (!browser || !storage) return null;
	try {
		const raw = storage.getItem(key);
		return raw ? (JSON.parse(raw) as QuoteData) : null;
	} catch (error) {
		console.error('Failed to read cached quote', error);
		storage?.removeItem(key);
		return null;
	}
};

export const writeQuoteCache = (
	storage: Storage | null,
	browser: boolean,
	key: string,
	quote: string,
	author: string
) => {
	if (!browser || !storage) return;
	try {
		storage.setItem(key, JSON.stringify({ quote, author }));
		setJsonCookie(key, { quote, author });
	} catch (error) {
		console.error('Failed to cache quote', error);
	}
};
