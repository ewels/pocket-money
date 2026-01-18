import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	updateSettings,
	getFamilyMembers,
	getActiveInviteCode,
	generateInviteCode,
	deleteInviteCode
} from '$lib/server/db';

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
	},

	updateWebhook: async ({ request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const webhookUrl = formData.get('webhookUrl')?.toString().trim() || null;

		// Validate URL if provided
		if (webhookUrl) {
			try {
				const url = new URL(webhookUrl);
				if (!['http:', 'https:'].includes(url.protocol)) {
					return fail(400, { error: 'Webhook URL must use HTTP or HTTPS' });
				}
			} catch {
				return fail(400, { error: 'Invalid webhook URL' });
			}
		}

		await updateSettings(db, locals.user.family_id, { webhook_url: webhookUrl });

		return { success: webhookUrl ? 'Webhook URL saved' : 'Webhook disabled' };
	},

	regenerateWebhookSecret: async ({ platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Generate a secure random secret (32 bytes = 64 hex characters)
		const bytes = new Uint8Array(32);
		crypto.getRandomValues(bytes);
		const secret = Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		await updateSettings(db, locals.user.family_id, { webhook_secret: secret });

		return { success: 'Webhook secret regenerated' };
	}
};
