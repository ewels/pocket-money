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
	generateId,
	calculateNextRun,
	type IntervalType
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

		// Verify family ownership
		if (child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
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

		// Verify family ownership
		if (child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
		}

		await deleteChild(db, params.id);

		await sendWebhook(db, locals.user.family_id, 'child.deleted', {
			child_id: params.id,
			name: child.name
		});

		throw redirect(303, '/');
	},

	addTarget: async ({ params, request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Verify child ownership
		const child = await getChild(db, params.id);
		if (!child || child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const amountStr = formData.get('amount')?.toString();
		const description = formData.get('description')?.toString().trim() || null;
		const link = formData.get('link')?.toString().trim() || null;
		const photoData = formData.get('photo')?.toString() || null;

		if (!name || !amountStr) {
			return fail(400, { error: 'Name and amount are required' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		// Validate link if provided
		if (link) {
			try {
				const url = new URL(link);
				if (!['http:', 'https:'].includes(url.protocol)) {
					return fail(400, { error: 'Link must use HTTP or HTTPS' });
				}
			} catch {
				return fail(400, { error: 'Invalid link URL' });
			}
		}

		// Validate photo data if provided
		if (photoData && !photoData.startsWith('data:image/')) {
			return fail(400, { error: 'Invalid image data' });
		}

		const targets = await getSavingTargets(db, params.id);

		await createSavingTarget(db, {
			id: generateId(),
			child_id: params.id,
			name,
			target_amount: amount,
			sort_order: targets.length,
			photo_data: photoData,
			description,
			link
		});

		return { success: 'Target added' };
	},

	updateTarget: async ({ params, request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Verify child ownership
		const child = await getChild(db, params.id);
		if (!child || child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
		}

		const formData = await request.formData();
		const targetId = formData.get('targetId')?.toString();
		const name = formData.get('name')?.toString().trim();
		const amountStr = formData.get('amount')?.toString();
		const description = formData.get('description')?.toString().trim() || null;
		const link = formData.get('link')?.toString().trim() || null;
		const photoData = formData.get('photo')?.toString();

		if (!targetId || !name || !amountStr) {
			return fail(400, { error: 'All fields are required' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		// Validate link if provided
		if (link) {
			try {
				const url = new URL(link);
				if (!['http:', 'https:'].includes(url.protocol)) {
					return fail(400, { error: 'Link must use HTTP or HTTPS' });
				}
			} catch {
				return fail(400, { error: 'Invalid link URL' });
			}
		}

		// Validate photo data if provided
		if (photoData && !photoData.startsWith('data:image/')) {
			return fail(400, { error: 'Invalid image data' });
		}

		await updateSavingTarget(db, targetId, {
			name,
			target_amount: amount,
			description,
			link,
			...(photoData && { photo_data: photoData })
		});
		return { success: 'Target updated' };
	},

	reorderTargets: async ({ params, request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Verify child ownership
		const child = await getChild(db, params.id);
		if (!child || child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
		}

		const formData = await request.formData();
		const orderJson = formData.get('order')?.toString();

		if (!orderJson) {
			return fail(400, { error: 'Order is required' });
		}

		try {
			const order = JSON.parse(orderJson) as string[];
			await Promise.all(
				order.map((targetId, index) => updateSavingTarget(db, targetId, { sort_order: index }))
			);
			return { success: 'Targets reordered' };
		} catch {
			return fail(400, { error: 'Invalid order data' });
		}
	},

	deleteTarget: async ({ params, request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Verify child ownership
		const child = await getChild(db, params.id);
		if (!child || child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
		}

		const formData = await request.formData();
		const targetId = formData.get('targetId')?.toString();

		if (!targetId) {
			return fail(400, { error: 'Target ID is required' });
		}

		await deleteSavingTarget(db, targetId);
		return { success: 'Target deleted' };
	},

	addRecurring: async ({ params, request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Verify child ownership
		const child = await getChild(db, params.id);
		if (!child || child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
		}

		const formData = await request.formData();
		const amountStr = formData.get('amount')?.toString();
		const description = formData.get('description')?.toString().trim() || null;
		const intervalType = (formData.get('intervalType')?.toString() || 'weekly') as IntervalType;
		const dayOfWeek = formData.get('dayOfWeek')
			? parseInt(formData.get('dayOfWeek')!.toString(), 10)
			: null;
		const dayOfMonth = formData.get('dayOfMonth')
			? parseInt(formData.get('dayOfMonth')!.toString(), 10)
			: null;
		const timeOfDay = formData.get('timeOfDay')
			? parseInt(formData.get('timeOfDay')!.toString(), 10)
			: 7;
		const timezone = formData.get('timezone')?.toString() || 'Europe/London';

		if (!amountStr) {
			return fail(400, { error: 'Amount is required' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		// Calculate interval_days for backwards compatibility
		let intervalDays = 7;
		if (intervalType === 'daily') intervalDays = 1;
		else if (intervalType === 'weekly') intervalDays = 7;
		else if (intervalType === 'monthly') intervalDays = 30;

		const nextRun = calculateNextRun(
			intervalType,
			intervalDays,
			dayOfWeek,
			dayOfMonth,
			timeOfDay,
			timezone
		);

		await createRecurringRule(db, {
			id: generateId(),
			child_id: params.id,
			amount,
			description,
			interval_days: intervalDays,
			interval_type: intervalType,
			day_of_week: dayOfWeek,
			day_of_month: dayOfMonth,
			time_of_day: timeOfDay,
			timezone,
			next_run_at: nextRun,
			active: 1
		});

		return { success: 'Recurring payment added' };
	},

	toggleRule: async ({ params, request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Verify child ownership
		const child = await getChild(db, params.id);
		if (!child || child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
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

	editRecurring: async ({ params, request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Verify child ownership
		const child = await getChild(db, params.id);
		if (!child || child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
		}

		const formData = await request.formData();
		const ruleId = formData.get('ruleId')?.toString();
		const amountStr = formData.get('amount')?.toString();
		const description = formData.get('description')?.toString().trim() || null;
		const intervalType = (formData.get('intervalType')?.toString() || 'weekly') as IntervalType;
		const dayOfWeek = formData.get('dayOfWeek')
			? parseInt(formData.get('dayOfWeek')!.toString(), 10)
			: null;
		const dayOfMonth = formData.get('dayOfMonth')
			? parseInt(formData.get('dayOfMonth')!.toString(), 10)
			: null;
		const timeOfDay = formData.get('timeOfDay')
			? parseInt(formData.get('timeOfDay')!.toString(), 10)
			: 7;
		const timezone = formData.get('timezone')?.toString() || 'Europe/London';

		if (!ruleId || !amountStr) {
			return fail(400, { error: 'Rule ID and amount are required' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		// Calculate interval_days for backwards compatibility
		let intervalDays = 7;
		if (intervalType === 'daily') intervalDays = 1;
		else if (intervalType === 'weekly') intervalDays = 7;
		else if (intervalType === 'monthly') intervalDays = 30;

		// Recalculate next_run_at when interval settings change
		const nextRun = calculateNextRun(
			intervalType,
			intervalDays,
			dayOfWeek,
			dayOfMonth,
			timeOfDay,
			timezone
		);

		await updateRecurringRule(db, ruleId, {
			amount,
			description,
			interval_days: intervalDays,
			interval_type: intervalType,
			day_of_week: dayOfWeek,
			day_of_month: dayOfMonth,
			time_of_day: timeOfDay,
			timezone,
			next_run_at: nextRun
		});

		return { success: 'Recurring payment updated' };
	},

	deleteRule: async ({ params, request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Verify child ownership
		const child = await getChild(db, params.id);
		if (!child || child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
		}

		const formData = await request.formData();
		const ruleId = formData.get('ruleId')?.toString();

		if (!ruleId) {
			return fail(400, { error: 'Rule ID is required' });
		}

		await deleteRecurringRule(db, ruleId);
		return { success: 'Rule deleted' };
	},

	deleteChildPhoto: async ({ params, platform, locals }) => {
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

		if (child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
		}

		await updateChild(db, params.id, { photo_data: null });

		return { success: 'Photo removed' };
	},

	deleteTargetPhoto: async ({ params, request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Verify child ownership
		const child = await getChild(db, params.id);
		if (!child || child.family_id !== locals.user.family_id) {
			return fail(403, { error: 'Access denied' });
		}

		const formData = await request.formData();
		const targetId = formData.get('targetId')?.toString();

		if (!targetId) {
			return fail(400, { error: 'Target ID is required' });
		}

		await updateSavingTarget(db, targetId, { photo_data: null });
		return { success: 'Photo removed' };
	}
};
