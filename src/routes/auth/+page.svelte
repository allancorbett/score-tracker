<script lang="ts">
	import { createSupabaseClient } from '$lib/supabase';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let isSignUp = $state(false);
	let loading = $state(false);
	let message = $state('');
	let error = $state('');

	const supabase = createSupabaseClient();

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		message = '';

		if (isSignUp) {
			const { error: authError } = await supabase.auth.signUp({
				email,
				password
			});

			if (authError) {
				error = authError.message;
			} else {
				message = 'Account created! You can now sign in.';
				isSignUp = false;
				password = '';
			}
		} else {
			const { error: authError } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (authError) {
				error = authError.message;
			} else {
				goto('/');
			}
		}

		loading = false;
	}
</script>

<svelte:head>
	<title>{isSignUp ? 'Sign up' : 'Sign in'} - Whist</title>
</svelte:head>

<div class="min-h-dvh flex items-center justify-center p-4">
	<div class="w-full max-w-sm">
		<h1 class="text-3xl font-bold text-gray-900 text-center mb-2">Whist</h1>
		<p class="text-center text-gray-500 mb-8">
			{isSignUp ? 'Create an account' : 'Sign in to your account'}
		</p>

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

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
					Password
				</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					minlength="6"
					placeholder="••••••••"
					class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					disabled={loading}
				/>
			</div>

			<button
				type="submit"
				class="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={loading || !email || !password}
			>
				{loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
			</button>
		</form>

		<div class="mt-6 text-center">
			<button
				type="button"
				onclick={() => {
					isSignUp = !isSignUp;
					error = '';
					message = '';
				}}
				class="text-blue-600 hover:text-blue-700 font-medium"
			>
				{isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
			</button>
		</div>

		<div class="mt-6 pt-6 border-t border-gray-200">
			<a
				href="/"
				class="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-center hover:bg-gray-200 transition-colors"
			>
				Continue as guest
			</a>
			<p class="mt-2 text-xs text-gray-500 text-center">
				Play without an account. Create one later to save your games.
			</p>
		</div>

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
