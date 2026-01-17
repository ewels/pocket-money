import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getUserByEmail,
  createUser,
  generateId,
  getUserCount,
  createFamily,
  getInviteCodeByCode,
  useInviteCode
} from '$lib/server/db';
import { hashPassword, verifyPassword, createUserSession, destroySession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(303, '/');
  }
  return {};
};

export const actions: Actions = {
  login: async ({ request, platform, cookies, url }) => {
    const db = platform?.env?.DB;
    if (!db) {
      return fail(500, { error: 'Database not available' });
    }

    const formData = await request.formData();
    const email = formData.get('email')?.toString().toLowerCase().trim();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' });
    }

    const user = await getUserByEmail(db, email);
    if (!user) {
      return fail(400, { error: 'Invalid email or password' });
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return fail(400, { error: 'Invalid email or password' });
    }

    const secure = url.protocol === 'https:';
    await createUserSession(db, cookies, user.id, secure);

    throw redirect(303, '/');
  },

  register: async ({ request, platform, cookies, url }) => {
    const db = platform?.env?.DB;
    if (!db) {
      return fail(500, { error: 'Database not available' });
    }

    const formData = await request.formData();
    const name = formData.get('name')?.toString().trim();
    const email = formData.get('email')?.toString().toLowerCase().trim();
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirmPassword')?.toString();
    const inviteCode = formData.get('inviteCode')?.toString().trim().toUpperCase();

    if (!name || !email || !password || !confirmPassword) {
      return fail(400, { error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters' });
    }

    const existingUser = await getUserByEmail(db, email);
    if (existingUser) {
      return fail(400, { error: 'An account with this email already exists' });
    }

    const userCount = await getUserCount(db);
    if (userCount >= 10) {
      return fail(400, { error: 'Maximum number of users reached' });
    }

    // Handle family membership via invite code or create new family
    let familyId: string;

    if (inviteCode) {
      // Validate invite code
      const invite = await getInviteCodeByCode(db, inviteCode);
      if (!invite) {
        return fail(400, { error: 'Invalid invite code' });
      }

      const now = Math.floor(Date.now() / 1000);
      if (invite.expires_at < now) {
        return fail(400, { error: 'Invite code has expired' });
      }

      if (invite.used_by) {
        return fail(400, { error: 'Invite code has already been used' });
      }

      familyId = invite.family_id;
    } else {
      // Create new family for user
      familyId = await createFamily(db, `${name}'s Family`);
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);

    await createUser(db, {
      id: userId,
      email,
      password_hash: passwordHash,
      name,
      photo_url: null,
      family_id: familyId
    });

    // Mark invite code as used if provided
    if (inviteCode) {
      await useInviteCode(db, inviteCode, userId);
    }

    const secure = url.protocol === 'https:';
    await createUserSession(db, cookies, userId, secure);

    throw redirect(303, '/');
  },

  logout: async ({ platform, cookies }) => {
    const db = platform?.env?.DB;
    if (db) {
      await destroySession(db, cookies);
    }
    throw redirect(303, '/login');
  }
};
