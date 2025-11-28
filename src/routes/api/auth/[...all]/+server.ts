// This route file exists to register the /api/auth/* paths with Cloudflare Workers/Pages
// The actual auth handling is done by svelteKitHandler in hooks.server.ts
// See: https://medium.com/@dasfacc/sveltekit-better-auth-using-cloudflare-d1-and-drizzle-91d9d9a6d0b4

import type { RequestHandler } from './$types';

export const prerender = false;

// These handlers will be intercepted by svelteKitHandler in hooks.server.ts
export const GET: RequestHandler = async () => {
	return new Response(null, { status: 200 });
};

export const POST: RequestHandler = async () => {
	return new Response(null, { status: 200 });
};
