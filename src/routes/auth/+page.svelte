<script lang="ts">
	import { createSupabaseClient } from '$lib/supabase';
	import { goto } from '$app/navigation';

	let email = $state('');
	let loading = $state(false);
	let message = $state('');
	let error = $state('');

	const supabase = createSupabaseClient();

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		message = '';

		const { error: authError } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${window.location.origin}/auth/callback`
			}
		});

		if (authError) {
			error = authError.message;
		} else {
			message = 'Check your email for the magic link!';
		}

		loading = false;
	}
</script>

<svelte:head>
	<title>Sign in - Whist</title>
</svelte:head>

<div class="min-h-dvh flex items-center justify-center p-4">
	<div class="w-full max-w-sm">
		<h1 class="text-3xl font-bold text-gray-900 text-center mb-8">Whist</h1>

		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
					Email address
				</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					placeholder="you@example.com"
					class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					disabled={loading}
				/>
			</div>

			<button
				type="submit"
				class="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={loading || !email}
			>
				{loading ? 'Sending...' : 'Send magic link'}
			</button>
		</form>

		{#if message}
			<div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center">
				{message}
			</div>
		{/if}

		{#if error}
			<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-center">
				{error}
			</div>
		{/if}
	</div>
</div>
