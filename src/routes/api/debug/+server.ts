import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, request }) => {
	return json({
		user: locals.user,
		session: locals.session,
		hasAuth: !!locals.auth,
		cookies: request.headers.get('cookie')
	});
};
