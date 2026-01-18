import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getChild,
	getSavingTargets,
	getRecurringRules,
	updateChild,
	deleteChild,
	createSavingTarget,
	updateSavingTarget,
	deleteSavingTarget,
	createRecurringRule,
	updateRecurringRule,
	deleteRecurringRule,
	generateId
} from '$lib/server/db';
import { sendWebhook } from '$lib/server/webhook';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	const child = await getChild(db, params.id);
	if (!child) {
		throw error(404, 'Child not found');
	}

	// Verify family ownership
	if (child.family_id !== locals.user.family_id) {
		throw error(403, 'Access denied');
	}

	const [targets, recurringRules] = await Promise.all([
		getSavingTargets(db, child.id),
		getRecurringRules(db, child.id)
	]);

	return { child, targets, recurringRules };
};

export const actions: Actions = {
	updateChild: async ({ params, request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const child = await getChild(db, params.id);
		if (!child) {
			return fail(404, { error: 'Child not found' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const color = formData.get('color')?.toString();
		const photoData = formData.get('photo')?.toString();

		if (!name) {
			return fail(400, { error: 'Name is required' });
		}

		// Validate photo data if provided
		if (photoData && !photoData.startsWith('data:image/')) {
			return fail(400, { error: 'Invalid image data' });
		}

		await updateChild(db, params.id, {
			name,
			color,
			...(photoData && { photo_data: photoData })
		});

		await sendWebhook(db, locals.user.family_id, 'child.updated', {
			child_id: params.id,
			name,
			color
		});

		return { success: 'Child updated successfully' };
	},

	deleteChild: async ({ params, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const child = await getChild(db, params.id);
		if (!child) {
			return fail(404, { error: 'Child not found' });
		}

		await deleteChild(db, params.id);

		await sendWebhook(db, locals.user.family_id, 'child.deleted', {
			child_id: params.id,
			name: child.name
		});

		throw redirect(303, '/');
	},

	addTarget: async ({ params, request, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const amountStr = formData.get('amount')?.toString();

		if (!name || !amountStr) {
			return fail(400, { error: 'Name and amount are required' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		const targets = await getSavingTargets(db, params.id);

		await createSavingTarget(db, {
			id: generateId(),
			child_id: params.id,
			name,
			target_amount: amount,
			sort_order: targets.length
		});

		return { success: 'Target added' };
	},

	updateTarget: async ({ request, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const targetId = formData.get('targetId')?.toString();
		const name = formData.get('name')?.toString().trim();
		const amountStr = formData.get('amount')?.toString();

		if (!targetId || !name || !amountStr) {
			return fail(400, { error: 'All fields are required' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		await updateSavingTarget(db, targetId, { name, target_amount: amount });
		return { success: 'Target updated' };
	},

	deleteTarget: async ({ request, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const targetId = formData.get('targetId')?.toString();

		if (!targetId) {
			return fail(400, { error: 'Target ID is required' });
		}

		await deleteSavingTarget(db, targetId);
		return { success: 'Target deleted' };
	},

	addRecurring: async ({ params, request, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const amountStr = formData.get('amount')?.toString();
		const description = formData.get('description')?.toString().trim() || null;
		const intervalDays = parseInt(formData.get('intervalDays')?.toString() ?? '7', 10);

		if (!amountStr) {
			return fail(400, { error: 'Amount is required' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		const now = Math.floor(Date.now() / 1000);
		const nextRun = now + intervalDays * 24 * 60 * 60;

		await createRecurringRule(db, {
			id: generateId(),
			child_id: params.id,
			amount,
			description,
			interval_days: intervalDays,
			next_run_at: nextRun,
			skip_next: 0,
			active: 1
		});

		return { success: 'Recurring payment added' };
	},

	toggleRule: async ({ request, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const ruleId = formData.get('ruleId')?.toString();
		const active = formData.get('active') === '1' ? 1 : 0;

		if (!ruleId) {
			return fail(400, { error: 'Rule ID is required' });
		}

		await updateRecurringRule(db, ruleId, { active });
		return { success: active ? 'Rule resumed' : 'Rule paused' };
	},

	toggleSkip: async ({ request, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const ruleId = formData.get('ruleId')?.toString();
		const skip = formData.get('skip') === '1' ? 1 : 0;

		if (!ruleId) {
			return fail(400, { error: 'Rule ID is required' });
		}

		await updateRecurringRule(db, ruleId, { skip_next: skip });
		return { success: skip ? 'Next payment will be skipped' : 'Skip cancelled' };
	},

	deleteRule: async ({ request, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const ruleId = formData.get('ruleId')?.toString();

		if (!ruleId) {
			return fail(400, { error: 'Rule ID is required' });
		}

		await deleteRecurringRule(db, ruleId);
		return { success: 'Rule deleted' };
	}
};
