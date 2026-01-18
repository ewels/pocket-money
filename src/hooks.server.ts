import { redirect, type Handle } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/server/auth';

const publicRoutes = ['/login', '/register'];
const pinExemptRoutes = ['/pin', '/api/', '/login'];

export const handle: Handle = async ({ event, resolve }) => {
	const db = event.platform?.env?.DB;

	if (!db) {
		return resolve(event);
	}

	const auth = await getUserFromSession(db, event.cookies);

	event.locals.user = auth?.user ?? null;
	event.locals.session = auth?.session ?? null;

	const isPublicRoute = publicRoutes.some((route) => event.url.pathname.startsWith(route));
	const isPinExemptRoute = pinExemptRoutes.some((route) => event.url.pathname.startsWith(route));

	if (!event.locals.user && !isPublicRoute && !event.url.pathname.startsWith('/api/cron')) {
		throw redirect(303, '/login');
	}

	if (event.locals.user && isPublicRoute && event.request.method === 'GET') {
		throw redirect(303, '/');
	}

	// Check PIN if enabled and user is authenticated
	if (event.locals.user && event.locals.session && !isPinExemptRoute) {
		if (event.locals.user.pin_enabled && event.locals.user.pin_hash) {
			const now = Math.floor(Date.now() / 1000);
			const timeout = event.locals.user.pin_timeout_minutes * 60;
			const pinVerifiedAt = event.locals.session.pin_verified_at;

			if (!pinVerifiedAt || now - pinVerifiedAt > timeout) {
				throw redirect(303, '/pin');
			}
		}
	}

	return resolve(event);
};
