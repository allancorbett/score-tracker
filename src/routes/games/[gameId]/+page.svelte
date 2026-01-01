<script lang="ts">
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import SessionList from '$lib/components/SessionList.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	function handleSessionClick(sessionId: string) {
		goto(`/games/${data.game.id}/play/${sessionId}`);
	}
</script>

<svelte:head>
	<title>{data.game.name} - Whist</title>
</svelte:head>

<div class="p-4 max-w-lg mx-auto pb-24">
	<header class="flex items-center gap-4 mb-6">
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
		<h1 class="text-xl font-bold text-gray-900 truncate">{data.game.name}</h1>
	</header>

	<section class="mb-8">
		<h2 class="text-lg font-medium text-gray-900 mb-3">All-time Standings</h2>
		<Leaderboard standings={data.standings} />
	</section>

	{#if data.sessions.length > 0}
		<section>
			<h2 class="text-lg font-medium text-gray-900 mb-3">Sessions</h2>
			<SessionList
				sessions={data.sessions}
				players={data.players}
				onSessionClick={handleSessionClick}
			/>
		</section>
	{:else}
		<div class="text-center py-8 text-gray-500">
			<p>No sessions yet</p>
			<p class="text-sm">Start your first session below!</p>
		</div>
	{/if}
</div>

<div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-area-inset-bottom">
	<div class="max-w-lg mx-auto">
		<a
			href="/games/{data.game.id}/play"
			class="block w-full py-4 bg-blue-600 text-white rounded-xl font-medium text-center hover:bg-blue-700 transition-colors"
		>
			{data.incompleteSession ? 'Continue Session' : '+ New Session'}
		</a>
	</div>
</div>
