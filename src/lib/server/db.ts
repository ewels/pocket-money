import type { D1Database } from '@cloudflare/workers-types';
import { formatInterval as formatIntervalUtil, type IntervalType } from '$lib/utils';

export type User = {
	id: string;
	email: string;
	password_hash: string;
	name: string;
	photo_url: string | null;
	photo_data: string | null;
	family_id: string | null;
	pin_enabled: number;
	pin_hash: string | null;
	pin_timeout_minutes: number;
	created_at: number;
};

export type Family = {
	id: string;
	name: string;
	created_at: number;
};

export type InviteCode = {
	id: string;
	code: string;
	family_id: string;
	created_by: string;
	expires_at: number;
	used_by: string | null;
	used_at: number | null;
	created_at: number;
};

export type Settings = {
	id: number;
	family_id: string | null;
	currency: string;
	pin_enabled: number;
	pin_hash: string | null;
	pin_timeout_minutes: number;
	webhook_url: string | null;
	webhook_secret: string | null;
};

export type Child = {
	id: string;
	name: string;
	color: string;
	photo_url: string | null;
	photo_data: string | null;
	family_id: string | null;
	sort_order: number;
	created_at: number;
};

export type SavingTarget = {
	id: string;
	child_id: string;
	name: string;
	target_amount: number;
	sort_order: number;
	photo_data: string | null;
	description: string | null;
	link: string | null;
	created_at: number;
};

export type { IntervalType };

export type RecurringRule = {
	id: string;
	child_id: string;
	amount: number;
	description: string | null;
	interval_days: number;
	interval_type: IntervalType;
	day_of_week: number | null; // 0-6 (Sunday-Saturday)
	day_of_month: number | null; // 1-28
	next_run_at: number;
	active: number;
	created_at: number;
};

export type Deduction = {
	id: string;
	child_id: string;
	amount: number;
	description: string | null;
	created_by: string | null;
	created_at: number;
};

export type Transaction = {
	id: string;
	child_id: string;
	user_id: string | null;
	amount: number;
	description: string | null;
	is_recurring: number;
	recurring_rule_id: string | null;
	created_at: number;
};

export type Session = {
	id: string;
	user_id: string;
	pin_verified_at: number | null;
	expires_at: number;
	created_at: number;
};

export function generateId(): string {
	return crypto.randomUUID();
}

// Invite code charset: no ambiguous chars (0/O, 1/I/L)
const INVITE_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateInviteCodeString(): string {
	const randomBytes = new Uint8Array(8);
	crypto.getRandomValues(randomBytes);
	let code = '';
	for (let i = 0; i < 8; i++) {
		code += INVITE_CODE_CHARS[randomBytes[i] % INVITE_CODE_CHARS.length];
	}
	return code;
}

export async function createFamily(db: D1Database, name: string): Promise<string> {
	const id = generateId();
	await db.prepare('INSERT INTO families (id, name) VALUES (?, ?)').bind(id, name).run();
	return id;
}

export async function getFamily(db: D1Database, id: string): Promise<Family | null> {
	return db.prepare('SELECT * FROM families WHERE id = ?').bind(id).first<Family>();
}

export async function generateInviteCode(
	db: D1Database,
	familyId: string,
	createdBy: string
): Promise<InviteCode> {
	const id = generateId();
	const code = generateInviteCodeString();
	const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days

	await db
		.prepare(
			'INSERT INTO invite_codes (id, code, family_id, created_by, expires_at) VALUES (?, ?, ?, ?, ?)'
		)
		.bind(id, code, familyId, createdBy, expiresAt)
		.run();

	return {
		id,
		code,
		family_id: familyId,
		created_by: createdBy,
		expires_at: expiresAt,
		used_by: null,
		used_at: null,
		created_at: Math.floor(Date.now() / 1000)
	};
}

export async function getInviteCodeByCode(
	db: D1Database,
	code: string
): Promise<InviteCode | null> {
	return db
		.prepare('SELECT * FROM invite_codes WHERE code = ?')
		.bind(code.toUpperCase())
		.first<InviteCode>();
}

export async function getActiveInviteCode(
	db: D1Database,
	familyId: string
): Promise<InviteCode | null> {
	const now = Math.floor(Date.now() / 1000);
	return db
		.prepare(
			'SELECT * FROM invite_codes WHERE family_id = ? AND used_by IS NULL AND expires_at > ? ORDER BY created_at DESC LIMIT 1'
		)
		.bind(familyId, now)
		.first<InviteCode>();
}

export async function useInviteCode(db: D1Database, code: string, userId: string): Promise<void> {
	const now = Math.floor(Date.now() / 1000);
	await db
		.prepare('UPDATE invite_codes SET used_by = ?, used_at = ? WHERE code = ?')
		.bind(userId, now, code.toUpperCase())
		.run();
}

export async function deleteInviteCode(
	db: D1Database,
	code: string,
	familyId: string
): Promise<void> {
	await db
		.prepare('DELETE FROM invite_codes WHERE code = ? AND family_id = ? AND used_by IS NULL')
		.bind(code.toUpperCase(), familyId)
		.run();
}

export async function getFamilyMembers(
	db: D1Database,
	familyId: string
): Promise<Pick<User, 'id' | 'name' | 'email' | 'photo_url' | 'photo_data'>[]> {
	const result = await db
		.prepare('SELECT id, name, email, photo_url, photo_data FROM users WHERE family_id = ?')
		.bind(familyId)
		.all<Pick<User, 'id' | 'name' | 'email' | 'photo_url' | 'photo_data'>>();
	return result.results;
}

export async function updateUserFamily(
	db: D1Database,
	userId: string,
	familyId: string
): Promise<void> {
	await db.prepare('UPDATE users SET family_id = ? WHERE id = ?').bind(familyId, userId).run();
}

export async function getSettings(db: D1Database, familyId: string): Promise<Settings> {
	const result = await db
		.prepare('SELECT * FROM settings WHERE family_id = ?')
		.bind(familyId)
		.first<Settings>();
	if (!result) {
		await db.prepare('INSERT INTO settings (family_id) VALUES (?)').bind(familyId).run();
		return {
			id: 0,
			family_id: familyId,
			currency: 'EUR',
			pin_enabled: 0,
			pin_hash: null,
			pin_timeout_minutes: 1,
			webhook_url: null,
			webhook_secret: null
		};
	}
	return result;
}

export async function updateSettings(
	db: D1Database,
	familyId: string,
	settings: Partial<Omit<Settings, 'id' | 'family_id'>>
): Promise<void> {
	const current = await getSettings(db, familyId);
	await db
		.prepare(
			'UPDATE settings SET currency = ?, pin_enabled = ?, pin_hash = ?, pin_timeout_minutes = ?, webhook_url = ?, webhook_secret = ? WHERE family_id = ?'
		)
		.bind(
			settings.currency ?? current.currency,
			settings.pin_enabled ?? current.pin_enabled,
			settings.pin_hash !== undefined ? settings.pin_hash : current.pin_hash,
			settings.pin_timeout_minutes ?? current.pin_timeout_minutes,
			settings.webhook_url !== undefined ? settings.webhook_url : current.webhook_url,
			settings.webhook_secret !== undefined ? settings.webhook_secret : current.webhook_secret,
			familyId
		)
		.run();
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
	return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
	return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
}

export async function createUser(
	db: D1Database,
	user: Omit<User, 'created_at' | 'photo_data'>
): Promise<void> {
	await db
		.prepare(
			'INSERT INTO users (id, email, password_hash, name, photo_url, family_id) VALUES (?, ?, ?, ?, ?, ?)'
		)
		.bind(user.id, user.email, user.password_hash, user.name, user.photo_url, user.family_id)
		.run();
}

export async function updateUser(
	db: D1Database,
	id: string,
	updates: Partial<Pick<User, 'name' | 'photo_url' | 'photo_data' | 'email' | 'password_hash'>>
): Promise<void> {
	const user = await getUserById(db, id);
	if (!user) return;
	await db
		.prepare(
			'UPDATE users SET name = ?, photo_url = ?, photo_data = ?, email = ?, password_hash = ? WHERE id = ?'
		)
		.bind(
			updates.name ?? user.name,
			updates.photo_url !== undefined ? updates.photo_url : user.photo_url,
			updates.photo_data !== undefined ? updates.photo_data : user.photo_data,
			updates.email ?? user.email,
			updates.password_hash ?? user.password_hash,
			id
		)
		.run();
}

export async function getUserCount(db: D1Database): Promise<number> {
	const result = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
	return result?.count ?? 0;
}

export async function updateUserPin(
	db: D1Database,
	userId: string,
	updates: Partial<Pick<User, 'pin_enabled' | 'pin_hash' | 'pin_timeout_minutes'>>
): Promise<void> {
	const user = await getUserById(db, userId);
	if (!user) return;
	await db
		.prepare('UPDATE users SET pin_enabled = ?, pin_hash = ?, pin_timeout_minutes = ? WHERE id = ?')
		.bind(
			updates.pin_enabled ?? user.pin_enabled,
			updates.pin_hash !== undefined ? updates.pin_hash : user.pin_hash,
			updates.pin_timeout_minutes ?? user.pin_timeout_minutes,
			userId
		)
		.run();
}

export async function createSession(
	db: D1Database,
	session: Omit<Session, 'created_at'>
): Promise<void> {
	await db
		.prepare('INSERT INTO sessions (id, user_id, pin_verified_at, expires_at) VALUES (?, ?, ?, ?)')
		.bind(session.id, session.user_id, session.pin_verified_at, session.expires_at)
		.run();
}

export async function getSession(db: D1Database, id: string): Promise<Session | null> {
	return db.prepare('SELECT * FROM sessions WHERE id = ?').bind(id).first<Session>();
}

export async function updateSessionPinVerified(db: D1Database, id: string): Promise<void> {
	await db
		.prepare('UPDATE sessions SET pin_verified_at = ? WHERE id = ?')
		.bind(Math.floor(Date.now() / 1000), id)
		.run();
}

export async function deleteSession(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
}

export async function getChildren(db: D1Database, familyId: string): Promise<Child[]> {
	const result = await db
		.prepare('SELECT * FROM children WHERE family_id = ? ORDER BY sort_order, created_at')
		.bind(familyId)
		.all<Child>();
	return result.results;
}

export async function getChild(db: D1Database, id: string): Promise<Child | null> {
	return db.prepare('SELECT * FROM children WHERE id = ?').bind(id).first<Child>();
}

export async function createChild(
	db: D1Database,
	child: Omit<Child, 'created_at' | 'photo_data'>
): Promise<void> {
	await db
		.prepare(
			'INSERT INTO children (id, name, color, photo_url, family_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
		)
		.bind(child.id, child.name, child.color, child.photo_url, child.family_id, child.sort_order)
		.run();
}

export async function updateChild(
	db: D1Database,
	id: string,
	updates: Partial<Omit<Child, 'id' | 'created_at'>>
): Promise<void> {
	const child = await getChild(db, id);
	if (!child) return;
	await db
		.prepare(
			'UPDATE children SET name = ?, color = ?, photo_url = ?, photo_data = ?, sort_order = ? WHERE id = ?'
		)
		.bind(
			updates.name ?? child.name,
			updates.color ?? child.color,
			updates.photo_url !== undefined ? updates.photo_url : child.photo_url,
			updates.photo_data !== undefined ? updates.photo_data : child.photo_data,
			updates.sort_order ?? child.sort_order,
			id
		)
		.run();
}

export async function deleteChild(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM children WHERE id = ?').bind(id).run();
}

export async function getSavingTargets(db: D1Database, childId: string): Promise<SavingTarget[]> {
	const result = await db
		.prepare('SELECT * FROM saving_targets WHERE child_id = ? ORDER BY sort_order, created_at')
		.bind(childId)
		.all<SavingTarget>();
	return result.results;
}

export async function createSavingTarget(
	db: D1Database,
	target: Omit<SavingTarget, 'created_at'>
): Promise<void> {
	await db
		.prepare(
			'INSERT INTO saving_targets (id, child_id, name, target_amount, sort_order, photo_data, description, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(
			target.id,
			target.child_id,
			target.name,
			target.target_amount,
			target.sort_order,
			target.photo_data,
			target.description,
			target.link
		)
		.run();
}

export async function updateSavingTarget(
	db: D1Database,
	id: string,
	updates: Partial<Omit<SavingTarget, 'id' | 'child_id' | 'created_at'>>
): Promise<void> {
	const target = await db
		.prepare('SELECT * FROM saving_targets WHERE id = ?')
		.bind(id)
		.first<SavingTarget>();
	if (!target) return;
	await db
		.prepare(
			'UPDATE saving_targets SET name = ?, target_amount = ?, sort_order = ?, photo_data = ?, description = ?, link = ? WHERE id = ?'
		)
		.bind(
			updates.name ?? target.name,
			updates.target_amount ?? target.target_amount,
			updates.sort_order ?? target.sort_order,
			updates.photo_data !== undefined ? updates.photo_data : target.photo_data,
			updates.description !== undefined ? updates.description : target.description,
			updates.link !== undefined ? updates.link : target.link,
			id
		)
		.run();
}

export async function deleteSavingTarget(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM saving_targets WHERE id = ?').bind(id).run();
}

export async function getRecurringRules(db: D1Database, childId: string): Promise<RecurringRule[]> {
	const result = await db
		.prepare('SELECT * FROM recurring_rules WHERE child_id = ? ORDER BY created_at')
		.bind(childId)
		.all<RecurringRule>();
	return result.results;
}

export async function getActiveRecurringRulesDue(db: D1Database): Promise<RecurringRule[]> {
	const now = Math.floor(Date.now() / 1000);
	const result = await db
		.prepare('SELECT * FROM recurring_rules WHERE active = 1 AND next_run_at <= ?')
		.bind(now)
		.all<RecurringRule>();
	return result.results;
}

export async function createRecurringRule(
	db: D1Database,
	rule: Omit<RecurringRule, 'created_at'>
): Promise<void> {
	await db
		.prepare(
			'INSERT INTO recurring_rules (id, child_id, amount, description, interval_days, interval_type, day_of_week, day_of_month, next_run_at, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(
			rule.id,
			rule.child_id,
			rule.amount,
			rule.description,
			rule.interval_days,
			rule.interval_type,
			rule.day_of_week,
			rule.day_of_month,
			rule.next_run_at,
			rule.active
		)
		.run();
}

export async function updateRecurringRule(
	db: D1Database,
	id: string,
	updates: Partial<Omit<RecurringRule, 'id' | 'child_id' | 'created_at'>>
): Promise<void> {
	const rule = await db
		.prepare('SELECT * FROM recurring_rules WHERE id = ?')
		.bind(id)
		.first<RecurringRule>();
	if (!rule) return;
	await db
		.prepare(
			'UPDATE recurring_rules SET amount = ?, description = ?, interval_days = ?, interval_type = ?, day_of_week = ?, day_of_month = ?, next_run_at = ?, active = ? WHERE id = ?'
		)
		.bind(
			updates.amount ?? rule.amount,
			updates.description !== undefined ? updates.description : rule.description,
			updates.interval_days ?? rule.interval_days,
			updates.interval_type ?? rule.interval_type,
			updates.day_of_week !== undefined ? updates.day_of_week : rule.day_of_week,
			updates.day_of_month !== undefined ? updates.day_of_month : rule.day_of_month,
			updates.next_run_at ?? rule.next_run_at,
			updates.active ?? rule.active,
			id
		)
		.run();
}

export async function deleteRecurringRule(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM recurring_rules WHERE id = ?').bind(id).run();
}

export async function getTransactions(
	db: D1Database,
	childId: string,
	limit = 50
): Promise<
	(Transaction & {
		user_name?: string;
		user_photo_url?: string | null;
		user_photo_data?: string | null;
	})[]
> {
	const result = await db
		.prepare(
			`SELECT t.*, u.name as user_name, u.photo_url as user_photo_url, u.photo_data as user_photo_data
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.child_id = ?
       ORDER BY t.created_at DESC
       LIMIT ?`
		)
		.bind(childId, limit)
		.all<
			Transaction & {
				user_name?: string;
				user_photo_url?: string | null;
				user_photo_data?: string | null;
			}
		>();
	return result.results;
}

export async function createTransaction(
	db: D1Database,
	transaction: Omit<Transaction, 'created_at'>
): Promise<void> {
	await db
		.prepare(
			'INSERT INTO transactions (id, child_id, user_id, amount, description, is_recurring, recurring_rule_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(
			transaction.id,
			transaction.child_id,
			transaction.user_id,
			transaction.amount,
			transaction.description,
			transaction.is_recurring,
			transaction.recurring_rule_id
		)
		.run();
}

export async function getChildBalance(db: D1Database, childId: string): Promise<number> {
	const result = await db
		.prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE child_id = ?')
		.bind(childId)
		.first<{ balance: number }>();
	return result?.balance ?? 0;
}

export async function getBalanceHistory(
	db: D1Database,
	childId: string,
	days = 30
): Promise<{ date: string; balance: number }[]> {
	// days=0 means "all time" - get first transaction date
	const isAllTime = days === 0;

	let startTime: number;
	let actualDays: number;

	if (isAllTime) {
		// Get the first transaction date for this child
		const firstTransaction = await db
			.prepare('SELECT MIN(created_at) as first_date FROM transactions WHERE child_id = ?')
			.bind(childId)
			.first<{ first_date: number | null }>();

		if (!firstTransaction?.first_date) {
			// No transactions, return empty history
			return [];
		}

		startTime = firstTransaction.first_date;
		const now = Math.floor(Date.now() / 1000);
		actualDays = Math.ceil((now - startTime) / (24 * 60 * 60));
	} else {
		startTime = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
		actualDays = days;
	}

	const result = await db
		.prepare(
			`SELECT
         date(created_at, 'unixepoch') as date,
         SUM(amount) OVER (ORDER BY created_at) as running_balance
       FROM transactions
       WHERE child_id = ? AND created_at >= ?
       ORDER BY created_at`
		)
		.bind(childId, startTime)
		.all<{ date: string; running_balance: number }>();

	const balanceBeforeStart = await db
		.prepare(
			'SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE child_id = ? AND created_at < ?'
		)
		.bind(childId, startTime)
		.first<{ balance: number }>();

	const startBalance = balanceBeforeStart?.balance ?? 0;

	const dailyBalances = new Map<string, number>();

	for (const row of result.results) {
		dailyBalances.set(row.date, row.running_balance);
	}

	const history: { date: string; balance: number }[] = [];
	const now = new Date();
	let currentBalance = startBalance;

	for (let i = actualDays; i >= 0; i--) {
		const date = new Date(now);
		date.setDate(date.getDate() - i);
		const dateStr = date.toISOString().split('T')[0];

		if (dailyBalances.has(dateStr)) {
			currentBalance = dailyBalances.get(dateStr)!;
		}
		history.push({ date: dateStr, balance: currentBalance });
	}

	return history;
}

export async function getBalanceEvents(
	db: D1Database,
	childId: string,
	days = 30
): Promise<{ date: string; balance: number; description: string | null }[]> {
	// days=0 means "all time" - get first transaction date
	const isAllTime = days === 0;

	let startTime: number;

	if (isAllTime) {
		const firstTransaction = await db
			.prepare('SELECT MIN(created_at) as first_date FROM transactions WHERE child_id = ?')
			.bind(childId)
			.first<{ first_date: number | null }>();

		if (!firstTransaction?.first_date) {
			return [];
		}
		startTime = firstTransaction.first_date;
	} else {
		startTime = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
	}

	// Get balance before the start of the window
	const balanceBeforeStart = await db
		.prepare(
			'SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE child_id = ? AND created_at < ?'
		)
		.bind(childId, startTime)
		.first<{ balance: number }>();

	const startBalance = balanceBeforeStart?.balance ?? 0;

	// Get all transactions in the window with running totals
	const result = await db
		.prepare(
			`SELECT
			 created_at,
			 amount,
			 description,
			 SUM(amount) OVER (ORDER BY created_at, rowid) as running_balance
		   FROM transactions
		   WHERE child_id = ? AND created_at >= ?
		   ORDER BY created_at, rowid`
		)
		.bind(childId, startTime)
		.all<{
			created_at: number;
			amount: number;
			description: string | null;
			running_balance: number;
		}>();

	const events: { date: string; balance: number; description: string | null }[] = [];

	// Add starting point
	const startDate = new Date(startTime * 1000);
	events.push({
		date: startDate.toISOString(),
		balance: startBalance,
		description: null
	});

	// Add each transaction as an event
	for (const row of result.results) {
		const eventDate = new Date(row.created_at * 1000);
		events.push({
			date: eventDate.toISOString(),
			balance: startBalance + row.running_balance,
			description: row.description
		});
	}

	return events;
}

export async function getBalanceEventsByCount(
	db: D1Database,
	childId: string,
	count: number
): Promise<{ date: string; balance: number; description: string | null }[]> {
	// count=0 means "all events"
	const limitClause = count > 0 ? `LIMIT ${count}` : '';

	// Get the last N transactions (ordered newest first, then we reverse)
	const result = await db
		.prepare(
			`SELECT created_at, amount, description FROM transactions
		   WHERE child_id = ?
		   ORDER BY created_at DESC, rowid DESC
		   ${limitClause}`
		)
		.bind(childId)
		.all<{
			created_at: number;
			amount: number;
			description: string | null;
		}>();

	if (result.results.length === 0) {
		return [];
	}

	// Reverse to chronological order
	const transactions = result.results.reverse();

	// Get balance before the earliest transaction in this window
	const earliestTime = transactions[0].created_at;
	const balanceBeforeStart = await db
		.prepare(
			'SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE child_id = ? AND created_at < ?'
		)
		.bind(childId, earliestTime)
		.first<{ balance: number }>();

	// Also count transactions at the same timestamp that come before (by rowid)
	// For simplicity, use the sum of all transactions before the start time
	const startBalance = balanceBeforeStart?.balance ?? 0;

	const events: { date: string; balance: number; description: string | null }[] = [];

	// Add starting point
	const startDate = new Date(earliestTime * 1000);
	events.push({
		date: startDate.toISOString(),
		balance: startBalance,
		description: null
	});

	// Add each transaction as an event with running balance
	let runningBalance = startBalance;
	for (const row of transactions) {
		runningBalance += row.amount;
		const eventDate = new Date(row.created_at * 1000);
		events.push({
			date: eventDate.toISOString(),
			balance: runningBalance,
			description: row.description
		});
	}

	return events;
}

// Deduction functions
export async function getDeductions(db: D1Database, childId: string): Promise<Deduction[]> {
	const result = await db
		.prepare('SELECT * FROM deductions WHERE child_id = ? ORDER BY created_at')
		.bind(childId)
		.all<Deduction>();
	return result.results;
}

export async function getTotalDeductions(db: D1Database, childId: string): Promise<number> {
	const result = await db
		.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM deductions WHERE child_id = ?')
		.bind(childId)
		.first<{ total: number }>();
	return result?.total ?? 0;
}

export async function createDeduction(
	db: D1Database,
	deduction: Omit<Deduction, 'created_at'>
): Promise<void> {
	await db
		.prepare(
			'INSERT INTO deductions (id, child_id, amount, description, created_by) VALUES (?, ?, ?, ?, ?)'
		)
		.bind(
			deduction.id,
			deduction.child_id,
			deduction.amount,
			deduction.description,
			deduction.created_by
		)
		.run();
}

export async function deleteDeduction(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM deductions WHERE id = ?').bind(id).run();
}

export async function getDeductionById(db: D1Database, id: string): Promise<Deduction | null> {
	return db.prepare('SELECT * FROM deductions WHERE id = ?').bind(id).first<Deduction>();
}

/**
 * Consume deductions FIFO for a payment. Returns the amount actually deducted.
 * If deductions >= paymentAmount, payment is fully skipped.
 * If deductions < paymentAmount, partial payment occurs.
 */
export async function consumeDeductions(
	db: D1Database,
	childId: string,
	paymentAmount: number
): Promise<{ amountDeducted: number; deductionsConsumed: string[] }> {
	const deductions = await getDeductions(db, childId);
	let remaining = paymentAmount;
	const consumed: string[] = [];

	for (const deduction of deductions) {
		if (remaining <= 0) break;

		if (deduction.amount <= remaining) {
			// Fully consume this deduction
			remaining -= deduction.amount;
			consumed.push(deduction.id);
			await deleteDeduction(db, deduction.id);
		} else {
			// Partially consume this deduction
			const partialAmount = remaining;
			remaining = 0;
			// Update the deduction with remaining amount
			await db
				.prepare('UPDATE deductions SET amount = ? WHERE id = ?')
				.bind(deduction.amount - partialAmount, deduction.id)
				.run();
		}
	}

	return {
		amountDeducted: paymentAmount - remaining,
		deductionsConsumed: consumed
	};
}

// Helper functions for recurring payment scheduling
export function calculateNextRun(
	intervalType: IntervalType,
	intervalDays: number,
	dayOfWeek: number | null,
	dayOfMonth: number | null
): number {
	const now = new Date();
	let nextRun: Date;

	switch (intervalType) {
		case 'daily': {
			nextRun = new Date(now);
			nextRun.setDate(nextRun.getDate() + 1);
			nextRun.setHours(0, 0, 0, 0);
			break;
		}
		case 'weekly': {
			nextRun = new Date(now);
			const targetDay = dayOfWeek ?? 1; // Default to Monday
			const currentDay = nextRun.getDay();
			let daysUntilTarget = targetDay - currentDay;
			if (daysUntilTarget <= 0) daysUntilTarget += 7;
			nextRun.setDate(nextRun.getDate() + daysUntilTarget);
			nextRun.setHours(0, 0, 0, 0);
			break;
		}
		case 'monthly': {
			nextRun = new Date(now);
			const targetDayOfMonth = dayOfMonth ?? 1;
			nextRun.setMonth(nextRun.getMonth() + 1);
			// Handle months with fewer days
			const lastDayOfMonth = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
			nextRun.setDate(Math.min(targetDayOfMonth, lastDayOfMonth));
			nextRun.setHours(0, 0, 0, 0);
			break;
		}
		case 'days':
		default:
			nextRun = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
			break;
	}

	return Math.floor(nextRun.getTime() / 1000);
}

export function calculateNextRunFromCurrent(
	currentNextRun: number,
	intervalType: IntervalType,
	intervalDays: number,
	dayOfWeek: number | null,
	dayOfMonth: number | null
): number {
	const current = new Date(currentNextRun * 1000);
	let nextRun: Date;

	switch (intervalType) {
		case 'daily': {
			nextRun = new Date(current);
			nextRun.setDate(nextRun.getDate() + 1);
			break;
		}
		case 'weekly': {
			nextRun = new Date(current);
			nextRun.setDate(nextRun.getDate() + 7);
			break;
		}
		case 'monthly': {
			nextRun = new Date(current);
			nextRun.setMonth(nextRun.getMonth() + 1);
			// Handle months with fewer days
			const targetDayOfMonth = dayOfMonth ?? current.getDate();
			const lastDayOfMonth = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
			nextRun.setDate(Math.min(targetDayOfMonth, lastDayOfMonth));
			break;
		}
		case 'days':
		default:
			nextRun = new Date(current.getTime() + intervalDays * 24 * 60 * 60 * 1000);
			break;
	}

	return Math.floor(nextRun.getTime() / 1000);
}

export function formatInterval(rule: RecurringRule): string {
	return formatIntervalUtil(
		rule.interval_type,
		rule.interval_days,
		rule.day_of_week,
		rule.day_of_month
	);
}
