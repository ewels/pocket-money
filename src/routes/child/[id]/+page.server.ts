import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getChild,
	getChildBalance,
	getSavingTargets,
	getRecurringRules,
	getTransactions,
	getBalanceHistory,
	getBalanceEventsByCount,
	createTransaction,
	createSavingTarget,
	generateId,
	getDeductions,
	getTotalDeductions,
	createDeduction,
	deleteDeduction,
	getDeductionById
} from '$lib/server/db';
import { sendWebhook } from '$lib/server/webhook';

export const load: PageServerLoad = async ({ params, locals, platform, url }) => {
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

	// Parse history days from URL param (default 30, 0 means all time)
	const historyDaysParam = url.searchParams.get('historyDays');
	const historyDays = historyDaysParam ? parseInt(historyDaysParam, 10) : 30;
	const validHistoryDays = [0, 7, 30, 180].includes(historyDays) ? historyDays : 30;

	// Parse event count from URL param (default 15, 0 means all)
	const eventCountParam = url.searchParams.get('eventCount');
	const eventCount = eventCountParam ? parseInt(eventCountParam, 10) : 15;
	const validEventCount = [0, 5, 15, 50].includes(eventCount) ? eventCount : 15;

	const [
		balance,
		targets,
		recurringRules,
		transactions,
		balanceHistory,
		balanceEvents,
		deductions,
		totalDeductions
	] = await Promise.all([
		getChildBalance(db, child.id),
		getSavingTargets(db, child.id),
		getRecurringRules(db, child.id),
		getTransactions(db, child.id),
		getBalanceHistory(db, child.id, validHistoryDays),
		getBalanceEventsByCount(db, child.id, validEventCount),
		getDeductions(db, child.id),
		getTotalDeductions(db, child.id)
	]);

	// Calculate next payment amount from active recurring rules
	const activeRules = recurringRules.filter((r) => r.active);
	const nextPaymentAmount =
		activeRules.length > 0
			? activeRules.slice().sort((a, b) => a.next_run_at - b.next_run_at)[0].amount
			: 0;

	// Calculate upcoming payments (next 3)
	const upcomingPayments = activeRules
		.slice()
		.sort((a, b) => a.next_run_at - b.next_run_at)
		.slice(0, 3)
		.map((rule) => ({
			description: rule.description,
			amount: rule.amount,
			date: rule.next_run_at
		}));

	// Calculate monthly income from active recurring rules (normalized to 30-day equivalent)
	const monthlyIncome = activeRules.reduce((total, rule) => {
		let multiplier = 1;
		switch (rule.interval_type) {
			case 'daily':
				multiplier = 30;
				break;
			case 'weekly':
				multiplier = 30 / 7;
				break;
			case 'monthly':
				multiplier = 1;
				break;
			case 'days':
			default:
				multiplier = 30 / rule.interval_days;
				break;
		}
		return total + rule.amount * multiplier;
	}, 0);

	return {
		child,
		balance,
		targets,
		recurringRules,
		transactions,
		balanceHistory,
		balanceEvents,
		historyDays: validHistoryDays,
		eventCount: validEventCount,
		deductions,
		totalDeductions,
		nextPaymentAmount,
		upcomingPayments,
		monthlyIncome
	};
};

export const actions: Actions = {
	addMoney: async ({ params, request, locals, platform }) => {
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

		if (!amountStr) {
			return fail(400, { error: 'Amount is required' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		const transactionId = generateId();

		await createTransaction(db, {
			id: transactionId,
			child_id: params.id,
			user_id: locals.user.id,
			amount,
			description,
			is_recurring: 0,
			recurring_rule_id: null
		});

		const newBalance = await getChildBalance(db, params.id);

		await sendWebhook(db, locals.user.family_id, 'transaction.created', {
			transaction_id: transactionId,
			child_id: params.id,
			child_name: child?.name,
			amount,
			description,
			type: 'deposit',
			new_balance: newBalance,
			user_id: locals.user.id,
			user_name: locals.user.name
		});

		return { success: true };
	},

	withdraw: async ({ params, request, locals, platform }) => {
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

		if (!amountStr) {
			return fail(400, { error: 'Amount is required' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		const balance = await getChildBalance(db, params.id);
		if (amount > balance) {
			return fail(400, { error: 'Insufficient balance' });
		}

		const transactionId = generateId();

		await createTransaction(db, {
			id: transactionId,
			child_id: params.id,
			user_id: locals.user.id,
			amount: -amount,
			description,
			is_recurring: 0,
			recurring_rule_id: null
		});

		const newBalance = await getChildBalance(db, params.id);

		await sendWebhook(db, locals.user.family_id, 'transaction.created', {
			transaction_id: transactionId,
			child_id: params.id,
			child_name: child?.name,
			amount: -amount,
			description,
			type: 'withdrawal',
			new_balance: newBalance,
			user_id: locals.user.id,
			user_name: locals.user.name
		});

		return { success: true };
	},

	addTarget: async ({ params, request, locals, platform }) => {
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

	addDeduction: async ({ params, request, locals, platform }) => {
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

		if (!amountStr) {
			return fail(400, { error: 'Amount is required' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		await createDeduction(db, {
			id: generateId(),
			child_id: params.id,
			amount,
			description,
			created_by: locals.user.id
		});

		return { success: true };
	},

	advance: async ({ params, request, locals, platform }) => {
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

		if (!amountStr) {
			return fail(400, { error: 'Amount is required' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		// Verify child has active recurring rules (otherwise nothing to advance)
		const recurringRules = await getRecurringRules(db, params.id);
		const activeRules = recurringRules.filter((r) => r.active);
		if (activeRules.length === 0) {
			return fail(400, { error: 'No active recurring payments to advance' });
		}

		// Create transaction and deduction atomically
		const transactionId = generateId();
		const deductionId = generateId();
		await db.batch([
			db
				.prepare(
					'INSERT INTO transactions (id, child_id, user_id, amount, description, is_recurring, recurring_rule_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
				)
				.bind(
					transactionId,
					params.id,
					locals.user.id,
					amount,
					description || 'Advance payment',
					0,
					null
				),
			db
				.prepare(
					'INSERT INTO deductions (id, child_id, amount, description, created_by) VALUES (?, ?, ?, ?, ?)'
				)
				.bind(
					deductionId,
					params.id,
					amount,
					description ? `Advanced: ${description}` : 'Advance payment',
					locals.user.id
				)
		]);

		const newBalance = await getChildBalance(db, params.id);

		await sendWebhook(db, locals.user.family_id, 'transaction.created', {
			transaction_id: transactionId,
			child_id: params.id,
			child_name: child?.name,
			amount,
			description: description || 'Advance payment',
			type: 'advance',
			new_balance: newBalance,
			user_id: locals.user.id,
			user_name: locals.user.name
		});

		return { success: true };
	},

	deleteDeduction: async ({ params, request, locals, platform }) => {
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
		const deductionId = formData.get('deductionId')?.toString();

		if (!deductionId) {
			return fail(400, { error: 'Deduction ID is required' });
		}

		// Verify deduction belongs to this child
		const deduction = await getDeductionById(db, deductionId);
		if (!deduction || deduction.child_id !== params.id) {
			return fail(404, { error: 'Deduction not found' });
		}

		await deleteDeduction(db, deductionId);

		return { success: true };
	}
};
