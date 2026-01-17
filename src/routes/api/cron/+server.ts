import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  getActiveRecurringRulesDue,
  createTransaction,
  updateRecurringRule,
  generateId
} from '$lib/server/db';

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

    // Create the transaction
    await createTransaction(db, {
      id: generateId(),
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

    processed++;
  }

  return json({
    success: true,
    processed,
    skipped,
    total: rules.length
  });
};
