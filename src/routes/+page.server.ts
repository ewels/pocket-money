import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getChildren,
	getChildBalance,
	getSavingTargets,
	createChild,
	generateId
} from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const db = platform?.env?.DB;
	if (!db || !locals.user.family_id) {
		return { children: [] };
	}

	const children = await getChildren(db, locals.user.family_id);

	const childrenWithData = await Promise.all(
		children.map(async (child) => {
			const balance = await getChildBalance(db, child.id);
			const targets = await getSavingTargets(db, child.id);
			return {
				...child,
				balance,
				targets: targets.slice(0, 2)
			};
		})
	);

	return { children: childrenWithData };
};

export const actions: Actions = {
	addChild: async ({ request, platform, locals }) => {
		if (!locals.user?.family_id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const color = formData.get('color')?.toString() ?? 'blue';

		if (!name) {
			return fail(400, { error: 'Name is required' });
		}

		const children = await getChildren(db, locals.user.family_id);
		const sortOrder = children.length;

		await createChild(db, {
			id: generateId(),
			name,
			color,
			photo_url: null,
			family_id: locals.user.family_id,
			sort_order: sortOrder
		});

		return { success: true };
	}
};
