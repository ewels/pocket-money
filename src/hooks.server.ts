import { redirect, type Handle } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/server/auth';
import { getSettings } from '$lib/server/db';

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

	if (event.locals.user && isPublicRoute) {
		throw redirect(303, '/');
	}

	// Check PIN if enabled and user is authenticated
	if (
		event.locals.user &&
		event.locals.session &&
		!isPinExemptRoute &&
		event.locals.user.family_id
	) {
		const settings = await getSettings(db, event.locals.user.family_id);

		if (settings.pin_enabled && settings.pin_hash) {
			const now = Math.floor(Date.now() / 1000);
			const timeout = settings.pin_timeout_minutes * 60;
			const pinVerifiedAt = event.locals.session.pin_verified_at;

			if (!pinVerifiedAt || now - pinVerifiedAt > timeout) {
				throw redirect(303, '/pin');
			}
		}
	}

	return resolve(event);
};
