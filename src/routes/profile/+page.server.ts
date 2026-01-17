import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { updateUser } from '$lib/server/db';

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
  }
};
