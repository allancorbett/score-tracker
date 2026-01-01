<script lang="ts">
	import { enhance } from '$app/forms';
	import { createSupabaseClient } from '$lib/supabase';
	import { goto } from '$app/navigation';

	let { data, form } = $props();

	const supabase = createSupabaseClient();

	let firstName = $state(data.firstName);

	async function handleSignOut() {
		await supabase.auth.signOut();
		goto('/auth');
	}
</script>

<svelte:head>
	<title>Profile - Whist</title>
</svelte:head>

<div class="p-4 max-w-lg mx-auto">
	<header class="flex items-center gap-4 mb-6">
		{#if !data.isSetup}
			<a href="/" class="p-2 -ml-2 text-gray-500 hover:text-gray-700">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</a>
		{/if}
		<h1 class="text-2xl font-bold text-gray-900">
			{data.isSetup ? 'Welcome!' : 'Profile'}
		</h1>
	</header>

	{#if data.isSetup}
		<p class="text-gray-600 mb-6">Before we start, what should we call you?</p>
	{/if}

	<form method="POST" use:enhance class="space-y-4">
		<div>
			<label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
				First name
			</label>
			<input
				id="firstName"
				name="firstName"
				type="text"
				bind:value={firstName}
				required
				placeholder="Your first name"
				class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
		</div>

		{#if form?.error}
			<div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
				{form.error}
			</div>
		{/if}

		<button
			type="submit"
			class="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
		>
			{data.isSetup ? "Let's go!" : 'Save'}
		</button>
	</form>

	{#if !data.isSetup}
		<div class="mt-8 pt-8 border-t border-gray-200">
			<button
				onclick={handleSignOut}
				class="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
			>
				Sign out
			</button>
		</div>
	{/if}
</div>
