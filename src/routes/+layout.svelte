<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { createSupabaseClient } from '$lib/supabase';

	let { children, data } = $props();

	const supabase = createSupabaseClient();

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<div class="min-h-dvh bg-gray-50 safe-area-inset-top safe-area-inset-bottom">
	{@render children()}
</div>
