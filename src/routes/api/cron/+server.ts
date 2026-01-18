import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getActiveRecurringRulesDue,
	createTransaction,
	updateRecurringRule,
	generateId,
	getChild,
	getChildBalance
} from '$lib/server/db';
import { sendWebhook } from '$lib/server/webhook';

export const GET: RequestHandler = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) {
		return json({ error: 'Database not available' }, { status: 500 });
	}

	const rules = await getActiveRecurringRulesDue(db);
	let processed = 0;
	let skipped = 0;

	for (const rule of rules) {
		if (rule.skip_next) {
			// Skip this payment but reset the flag
			const nextRun = Math.floor(Date.now() / 1000) + rule.interval_days * 24 * 60 * 60;
			await updateRecurringRule(db, rule.id, {
				skip_next: 0,
				next_run_at: nextRun
			});
			skipped++;
			continue;
		}

		const transactionId = generateId();

		// Create the transaction
		await createTransaction(db, {
			id: transactionId,
			child_id: rule.child_id,
			user_id: null,
			amount: rule.amount,
			description: rule.description,
			is_recurring: 1,
			recurring_rule_id: rule.id
		});

		// Update next run time
		const nextRun = Math.floor(Date.now() / 1000) + rule.interval_days * 24 * 60 * 60;
		await updateRecurringRule(db, rule.id, { next_run_at: nextRun });

		// Send webhook if family has one configured
		const child = await getChild(db, rule.child_id);
		if (child?.family_id) {
			const newBalance = await getChildBalance(db, rule.child_id);
			await sendWebhook(db, child.family_id, 'recurring_payment.processed', {
				transaction_id: transactionId,
				child_id: rule.child_id,
				child_name: child.name,
				amount: rule.amount,
				description: rule.description,
				new_balance: newBalance,
				rule_id: rule.id,
				next_payment_at: nextRun
			});
		}

		processed++;
	}

	return json({
		success: true,
		processed,
		skipped,
		total: rules.length
	});
};
