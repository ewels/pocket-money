import bcrypt from 'bcryptjs';
import { generateId, createSession, getSession, getUserById, deleteSession } from './db';
import type { D1Database } from '@cloudflare/workers-types';
import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE = 'session';
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export async function hashPin(pin: string): Promise<string> {
	return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
	return bcrypt.compare(pin, hash);
}

export async function createUserSession(
	db: D1Database,
	cookies: Cookies,
	userId: string,
	secure: boolean
): Promise<string> {
	const sessionId = generateId();
	const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;

	await createSession(db, {
		id: sessionId,
		user_id: userId,
		pin_verified_at: null,
		expires_at: expiresAt
	});

	cookies.set(SESSION_COOKIE, sessionId, {
		path: '/',
		httpOnly: true,
		secure,
		sameSite: 'lax',
		maxAge: SESSION_DURATION
	});

	return sessionId;
}

export async function getUserFromSession(
	db: D1Database,
	cookies: Cookies
): Promise<{
	user: App.Locals['user'];
	session: App.Locals['session'];
} | null> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (!sessionId) return null;

	const session = await getSession(db, sessionId);
	if (!session) return null;

	const now = Math.floor(Date.now() / 1000);
	if (session.expires_at < now) {
		await deleteSession(db, sessionId);
		cookies.delete(SESSION_COOKIE, { path: '/' });
		return null;
	}

	const user = await getUserById(db, session.user_id);
	if (!user) {
		await deleteSession(db, sessionId);
		cookies.delete(SESSION_COOKIE, { path: '/' });
		return null;
	}

	return {
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			photo_url: user.photo_url,
			photo_data: user.photo_data,
			family_id: user.family_id,
			pin_enabled: user.pin_enabled,
			pin_hash: user.pin_hash,
			pin_timeout_minutes: user.pin_timeout_minutes
		},
		session: {
			id: session.id,
			pin_verified_at: session.pin_verified_at
		}
	};
}

export async function destroySession(db: D1Database, cookies: Cookies): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (sessionId) {
		await deleteSession(db, sessionId);
		cookies.delete(SESSION_COOKIE, { path: '/' });
	}
}
