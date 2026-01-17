import type { LayoutServerLoad } from './$types';
import { getSettings, getFamily } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
  if (!platform?.env?.DB) {
    return { user: null, settings: null, family: null };
  }

  if (!locals.user?.family_id) {
    return {
      user: locals.user,
      session: locals.session,
      settings: null,
      family: null
    };
  }

  const [settings, family] = await Promise.all([
    getSettings(platform.env.DB, locals.user.family_id),
    getFamily(platform.env.DB, locals.user.family_id)
  ]);

  return {
    user: locals.user,
    session: locals.session,
    settings: {
      currency: settings.currency,
      pin_enabled: settings.pin_enabled === 1,
      pin_timeout_minutes: settings.pin_timeout_minutes
    },
    family: family ? { id: family.id, name: family.name } : null
  };
};
