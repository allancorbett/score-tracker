import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.session) {
		throw redirect(303, '/auth');
	}

	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(303, '/auth');
	}

	const { data: profile } = (await locals.supabase
		.from('profiles')
		.select('first_name')
		.eq('id', userId)
		.single()) as { data: { first_name: string } | null };

	return {
		firstName: profile?.first_name || '',
		isSetup: url.searchParams.get('setup') === 'true'
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/auth');
		}

		const formData = await request.formData();
		const firstName = formData.get('firstName')?.toString().trim();

		if (!firstName) {
			return fail(400, { error: 'First name is required' });
		}

		const { error } = await locals.supabase
			.from('profiles')
			.update({ first_name: firstName })
			.eq('id', locals.user.id);

		if (error) {
			return fail(500, { error: 'Failed to update profile' });
		}

		throw redirect(303, '/');
	}
};
