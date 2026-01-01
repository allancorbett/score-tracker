import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			// Check if user has a profile with a first_name set
			const {
				data: { user }
			} = await locals.supabase.auth.getUser();

			if (user) {
				const { data: profile } = (await locals.supabase
					.from('profiles')
					.select('first_name')
					.eq('id', user.id)
					.single()) as { data: { first_name: string } | null };

				// If no profile or default name, redirect to profile setup
				if (!profile || profile.first_name === 'Player') {
					throw redirect(303, '/profile?setup=true');
				}
			}

			throw redirect(303, next);
		}
	}

	// Auth failed, redirect to auth page
	throw redirect(303, '/auth');
};
