import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { updateSessionPinVerified } from '$lib/server/db';
import { verifyPin } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// If PIN is not enabled, redirect to home
	if (!locals.user.pin_enabled || !locals.user.pin_hash) {
		throw redirect(303, '/');
	}

	// Check if PIN was recently verified
	if (locals.session?.pin_verified_at) {
		const now = Math.floor(Date.now() / 1000);
		const timeout = locals.user.pin_timeout_minutes * 60;
		if (now - locals.session.pin_verified_at < timeout) {
			throw redirect(303, '/');
		}
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		if (!locals.user || !locals.session) {
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

		if (!locals.user.pin_hash) {
			throw redirect(303, '/');
		}

		const valid = await verifyPin(pin, locals.user.pin_hash);
		if (!valid) {
			return fail(400, { error: 'Incorrect PIN' });
		}

		await updateSessionPinVerified(db, locals.session.id);

		throw redirect(303, '/');
	}
};
