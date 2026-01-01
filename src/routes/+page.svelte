<script lang="ts">
	import GameCard from '$lib/components/GameCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Whist</title>
</svelte:head>

<div class="p-4 max-w-lg mx-auto">
	<header class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Whist</h1>
		<a href="/profile" class="p-2 text-gray-500 hover:text-gray-700" aria-label="Settings">
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
		</a>
	</header>

	<div class="space-y-3">
		{#each data.games as game}
			<GameCard
				name={game.name}
				sessionCount={game.sessionCount}
				userScore={game.userScore}
				href="/games/{game.id}"
			/>
		{/each}

		<a
			href="/games/new"
			class="block bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 p-4 text-center text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
		>
			+ New Game
		</a>
	</div>
</div>
