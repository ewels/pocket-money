import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getActiveRecurringRulesDue,
	createTransaction,
	updateRecurringRule,
	generateId,
	getChild,
	getChildBalance,
	getTotalDeductions,
	consumeDeductions
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
	let partial = 0;

	for (const rule of rules) {
		// Check for deductions
		const totalDeductions = await getTotalDeductions(db, rule.child_id);
		const nextRun = Math.floor(Date.now() / 1000) + rule.interval_days * 24 * 60 * 60;

		if (totalDeductions >= rule.amount) {
			// Full skip - deductions cover entire payment
			await consumeDeductions(db, rule.child_id, rule.amount);
			await updateRecurringRule(db, rule.id, { next_run_at: nextRun });
			skipped++;

			// Send webhook for skipped payment
			const child = await getChild(db, rule.child_id);
			if (child?.family_id) {
				await sendWebhook(db, child.family_id, 'recurring_payment.skipped', {
					child_id: rule.child_id,
					child_name: child.name,
					amount: rule.amount,
					description: rule.description,
					rule_id: rule.id,
					next_payment_at: nextRun,
					reason: 'deductions'
				});
			}
			continue;
		}

		// Calculate actual payment amount after deductions
		let actualAmount = rule.amount;
		if (totalDeductions > 0) {
			const { amountDeducted } = await consumeDeductions(db, rule.child_id, rule.amount);
			actualAmount = rule.amount - amountDeducted;
			partial++;
		}

		const transactionId = generateId();

		// Create the transaction (with potentially reduced amount)
		await createTransaction(db, {
			id: transactionId,
			child_id: rule.child_id,
			user_id: null,
			amount: actualAmount,
			description:
				actualAmount < rule.amount
					? `${rule.description || 'Allowance'} (reduced by deduction)`
					: rule.description,
			is_recurring: 1,
			recurring_rule_id: rule.id
		});

		// Update next run time
		await updateRecurringRule(db, rule.id, { next_run_at: nextRun });

		// Send webhook if family has one configured
		const child = await getChild(db, rule.child_id);
		if (child?.family_id) {
			const newBalance = await getChildBalance(db, rule.child_id);
			await sendWebhook(db, child.family_id, 'recurring_payment.processed', {
				transaction_id: transactionId,
				child_id: rule.child_id,
				child_name: child.name,
				amount: actualAmount,
				original_amount: rule.amount,
				description: rule.description,
				new_balance: newBalance,
				rule_id: rule.id,
				next_payment_at: nextRun,
				was_reduced: actualAmount < rule.amount
			});
		}

		processed++;
	}

	return json({
		success: true,
		processed,
		skipped,
		partial,
		total: rules.length
	});
};
