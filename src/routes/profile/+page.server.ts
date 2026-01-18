import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { updateUser, getUserByEmail, getUserById } from '$lib/server/db';
import { hashPassword, verifyPassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}
	return {};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const photoData = formData.get('photo')?.toString();

		if (!name) {
			return fail(400, { error: 'Name is required' });
		}

		// Validate photo data if provided
		if (photoData && !photoData.startsWith('data:image/')) {
			return fail(400, { error: 'Invalid image data' });
		}

		await updateUser(db, locals.user.id, {
			name,
			...(photoData && { photo_data: photoData })
		});

		return { success: 'Profile updated successfully' };
	},

	updateEmail: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const newEmail = formData.get('newEmail')?.toString().toLowerCase().trim();
		const currentPassword = formData.get('currentPassword')?.toString();

		if (!newEmail || !currentPassword) {
			return fail(400, { error: 'Email and current password are required' });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(newEmail)) {
			return fail(400, { error: 'Invalid email format' });
		}

		// Verify current password
		const user = await getUserById(db, locals.user.id);
		if (!user) {
			return fail(404, { error: 'User not found' });
		}

		const validPassword = await verifyPassword(currentPassword, user.password_hash);
		if (!validPassword) {
			return fail(400, { error: 'Current password is incorrect' });
		}

		// Check if email is already in use
		if (newEmail !== user.email) {
			const existingUser = await getUserByEmail(db, newEmail);
			if (existingUser) {
				return fail(400, { error: 'Email is already in use' });
			}
		}

		await updateUser(db, locals.user.id, { email: newEmail });

		return { success: 'Email updated successfully' };
	},

	updatePassword: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword')?.toString();
		const newPassword = formData.get('newPassword')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { error: 'All password fields are required' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'New passwords do not match' });
		}

		if (newPassword.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		// Verify current password
		const user = await getUserById(db, locals.user.id);
		if (!user) {
			return fail(404, { error: 'User not found' });
		}

		const validPassword = await verifyPassword(currentPassword, user.password_hash);
		if (!validPassword) {
			return fail(400, { error: 'Current password is incorrect' });
		}

		const newPasswordHash = await hashPassword(newPassword);
		await updateUser(db, locals.user.id, { password_hash: newPasswordHash });

		return { success: 'Password updated successfully' };
	}
};
