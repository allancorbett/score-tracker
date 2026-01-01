import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export function createSupabaseClient(fetch?: typeof globalThis.fetch) {
	return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch
		}
	});
}

export function createSupabaseServerClient(
	cookies: {
		getAll: () => { name: string; value: string }[];
		setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
	},
	fetch?: typeof globalThis.fetch
) {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookies.setAll(
					cookiesToSet.map(({ name, value, options }) => ({
						name,
						value,
						options
					}))
				);
			}
		},
		global: {
			fetch
		}
	});
}
