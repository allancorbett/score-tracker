<script lang="ts">
	import { onMount } from 'svelte';
	import GameCard from '$lib/components/GameCard.svelte';
	import { localGames, type LocalGame } from '$lib/stores/localGames';

	let { data } = $props();

	let localGamesList = $state<LocalGame[]>([]);

	onMount(() => {
		// Load local games on client
		localGamesList = localGames.getAllGames();

		// Subscribe to changes
		const unsubscribe = localGames.subscribe((state) => {
			localGamesList = state.games;
		});

		return unsubscribe;
	});

	function getLocalGameStats(game: LocalGame) {
		const completedSessions = game.sessions.filter((s) => s.is_complete);
		const sessionCount = completedSessions.length;

		// Sum all tricks for first player as a simple score display
		const totalTricks = completedSessions
			.flatMap((s) => s.scores)
			.reduce((sum, score) => sum + score.tricks_won, 0);

		return { sessionCount, totalTricks };
	}

	// Normalize both local and server games to have same properties
	const allGames = $derived([
		...localGamesList.map((g) => {
			const stats = getLocalGameStats(g);
			return {
				id: g.id,
				name: g.name,
				created_at: g.created_at,
				sessionCount: stats.sessionCount,
				userScore: stats.totalTricks,
				isLocal: true
			};
		}),
		...data.games.map((g) => ({
			id: g.id,
			name: g.name,
			created_at: g.created_at,
			sessionCount: g.sessionCount,
			userScore: g.userScore,
			isLocal: false
		}))
	]);
</script>

<svelte:head>
	<title>Whist</title>
</svelte:head>

<div class="p-4 max-w-lg mx-auto">
	<header class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Whist</h1>
		<a
			href={data.isGuest ? '/auth' : '/profile'}
			class="p-2 text-gray-500 hover:text-gray-700"
			aria-label={data.isGuest ? 'Sign in' : 'Settings'}
		>
			{#if data.isGuest}
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
						d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
					/>
				</svg>
			{:else}
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
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
			{/if}
		</a>
	</header>

	{#if data.isGuest && localGamesList.length === 0}
		<div class="text-center py-8 mb-4">
			<p class="text-gray-600 mb-2">Welcome to Whist Score Keeper!</p>
			<p class="text-gray-500 text-sm">Start a game below. Your scores are saved on this device.</p>
			<a href="/auth" class="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium">
				Sign in to sync across devices
			</a>
		</div>
	{/if}

	<div class="space-y-3">
		{#each allGames as game}
			<div class="relative">
				<GameCard
					name={game.name}
					sessionCount={game.sessionCount}
					userScore={game.userScore}
					href="/games/{game.id}"
				/>
				{#if game.isLocal}
					<span class="absolute top-2 right-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
						Local
					</span>
				{/if}
			</div>
		{/each}

		<a
			href="/games/new"
			class="block bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 p-4 text-center text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
		>
			+ New Game
		</a>
	</div>
</div>
