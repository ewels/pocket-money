import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getChild,
  getChildBalance,
  getSavingTargets,
  getRecurringRules,
  getTransactions,
  getBalanceHistory,
  createTransaction,
  generateId
} from '$lib/server/db';

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

  const [balance, targets, recurringRules, transactions, balanceHistory] = await Promise.all([
    getChildBalance(db, child.id),
    getSavingTargets(db, child.id),
    getRecurringRules(db, child.id),
    getTransactions(db, child.id),
    getBalanceHistory(db, child.id, 30)
  ]);

  return {
    child,
    balance,
    targets,
    recurringRules,
    transactions,
    balanceHistory
  };
};

export const actions: Actions = {
  addMoney: async ({ params, request, locals, platform }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    const db = platform?.env?.DB;
    if (!db) {
      return fail(500, { error: 'Database not available' });
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

    await createTransaction(db, {
      id: generateId(),
      child_id: params.id,
      user_id: locals.user.id,
      amount,
      description,
      is_recurring: 0,
      recurring_rule_id: null
    });

    return { success: true };
  },

  withdraw: async ({ params, request, locals, platform }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    const db = platform?.env?.DB;
    if (!db) {
      return fail(500, { error: 'Database not available' });
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

    await createTransaction(db, {
      id: generateId(),
      child_id: params.id,
      user_id: locals.user.id,
      amount: -amount,
      description,
      is_recurring: 0,
      recurring_rule_id: null
    });

    return { success: true };
  }
};
