import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getSettings, updateSessionPinVerified } from '$lib/server/db';
import { verifyPin } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const db = platform?.env?.DB;
	if (!db || !locals.user.family_id) {
		throw redirect(303, '/');
	}

	const settings = await getSettings(db, locals.user.family_id);

	// If PIN is not enabled, redirect to home
	if (!settings.pin_enabled || !settings.pin_hash) {
		throw redirect(303, '/');
	}

	// Check if PIN was recently verified
	if (locals.session?.pin_verified_at) {
		const now = Math.floor(Date.now() / 1000);
		const timeout = settings.pin_timeout_minutes * 60;
		if (now - locals.session.pin_verified_at < timeout) {
			throw redirect(303, '/');
		}
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		if (!locals.user || !locals.session || !locals.user.family_id) {
			throw redirect(303, '/login');
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const pin = formData.get('pin')?.toString();

		if (!pin) {
			return fail(400, { error: 'PIN is required' });
		}

		const settings = await getSettings(db, locals.user.family_id);

		if (!settings.pin_hash) {
			throw redirect(303, '/');
		}

		const valid = await verifyPin(pin, settings.pin_hash);
		if (!valid) {
			return fail(400, { error: 'Incorrect PIN' });
		}

		await updateSessionPinVerified(db, locals.session.id);

		throw redirect(303, '/');
	}
};
