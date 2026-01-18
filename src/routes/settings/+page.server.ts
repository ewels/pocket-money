import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getSettings,
	updateSettings,
	getFamilyMembers,
	getActiveInviteCode,
	generateInviteCode,
	deleteInviteCode
} from '$lib/server/db';
import { hashPin, verifyPin } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const db = platform?.env?.DB;
	if (!db || !locals.user.family_id) {
		return { familyMembers: [], activeInviteCode: null };
	}

	const [familyMembers, activeInviteCode] = await Promise.all([
		getFamilyMembers(db, locals.user.family_id),
		getActiveInviteCode(db, locals.user.family_id)
	]);

	return {
		familyMembers,
		activeInviteCode: activeInviteCode
			? {
					code: activeInviteCode.code,
					expiresAt: activeInviteCode.expires_at
				}
			: null
	};
};

export const actions: Actions = {
	updateCurrency: async ({ request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const currency = formData.get('currency')?.toString();

		if (!currency) {
			return fail(400, { error: 'Currency is required' });
		}

		await updateSettings(db, locals.user.family_id, { currency });
		return { success: 'Currency updated successfully' };
	},

	setPin: async ({ request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const currentPin = formData.get('currentPin')?.toString();
		const newPin = formData.get('newPin')?.toString();
		const confirmPin = formData.get('confirmPin')?.toString();

		if (!newPin || !confirmPin) {
			return fail(400, { error: 'PIN is required' });
		}

		if (newPin !== confirmPin) {
			return fail(400, { error: 'PINs do not match' });
		}

		if (!/^\d{4,6}$/.test(newPin)) {
			return fail(400, { error: 'PIN must be 4-6 digits' });
		}

		const settings = await getSettings(db, locals.user.family_id);

		if (settings.pin_enabled && settings.pin_hash) {
			if (!currentPin) {
				return fail(400, { error: 'Current PIN is required' });
			}
			const valid = await verifyPin(currentPin, settings.pin_hash);
			if (!valid) {
				return fail(400, { error: 'Current PIN is incorrect' });
			}
		}

		const pinHash = await hashPin(newPin);
		await updateSettings(db, locals.user.family_id, { pin_enabled: 1, pin_hash: pinHash });

		return { success: 'PIN has been set successfully' };
	},

	disablePin: async ({ request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const currentPin = formData.get('currentPin')?.toString();

		if (!currentPin) {
			return fail(400, { error: 'Current PIN is required' });
		}

		const settings = await getSettings(db, locals.user.family_id);

		if (!settings.pin_hash) {
			return fail(400, { error: 'PIN is not enabled' });
		}

		const valid = await verifyPin(currentPin, settings.pin_hash);
		if (!valid) {
			return fail(400, { error: 'PIN is incorrect' });
		}

		await updateSettings(db, locals.user.family_id, { pin_enabled: 0, pin_hash: null });

		return { success: 'PIN has been disabled' };
	},

	updatePinTimeout: async ({ request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const timeout = parseInt(formData.get('timeout')?.toString() ?? '1', 10);

		if (![1, 2, 5, 10].includes(timeout)) {
			return fail(400, { error: 'Invalid timeout value' });
		}

		await updateSettings(db, locals.user.family_id, { pin_timeout_minutes: timeout });
		return { success: 'PIN timeout updated' };
	},

	generateInvite: async ({ platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const inviteCode = await generateInviteCode(db, locals.user.family_id, locals.user.id);

		return {
			success: 'Invite code generated',
			inviteCode: {
				code: inviteCode.code,
				expiresAt: inviteCode.expires_at
			}
		};
	},

	revokeInvite: async ({ request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const code = formData.get('code')?.toString();

		if (!code) {
			return fail(400, { error: 'Invite code is required' });
		}

		await deleteInviteCode(db, code, locals.user.family_id);

		return { success: 'Invite code revoked' };
	}
};
