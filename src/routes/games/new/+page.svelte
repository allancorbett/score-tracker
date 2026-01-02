<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import AddPlayerInput from '$lib/components/AddPlayerInput.svelte';
	import { generateGameName } from '$lib/types';
	import { localGames } from '$lib/stores/localGames';

	let { data, form } = $props();

	interface Player {
		name: string;
		isUser: boolean;
	}

	let players = $state<Player[]>([{ name: data.userFirstName, isUser: !data.isGuest }]);
	let submitting = $state(false);
	let error = $state('');

	const gameName = $derived(generateGameName(players.map((p) => p.name)));
	const canCreate = $derived(players.length >= 2 && players.length <= 7);

	function addPlayer(name: string) {
		if (players.length < 7) {
			players = [...players, { name, isUser: false }];
		}
	}

	function removePlayer(index: number) {
		// For guests, allow removing any player. For logged-in users, can't remove self.
		if (data.isGuest || !players[index].isUser) {
			players = players.filter((_, i) => i !== index);
		}
	}

	function createLocalGame() {
		if (!canCreate) return;

		submitting = true;
		error = '';

		try {
			const game = localGames.createGame(
				gameName,
				players.map((p) => p.name)
			);
			goto(`/games/${game.id}`);
		} catch (e) {
			error = 'Failed to create game';
			submitting = false;
		}
	}

	function handleSubmit(e: Event) {
		if (data.isGuest) {
			e.preventDefault();
			createLocalGame();
		}
	}
</script>

<svelte:head>
	<title>New Game - Whist</title>
</svelte:head>

<div class="p-4 max-w-lg mx-auto">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="p-2 -ml-2 text-gray-500 hover:text-gray-700" aria-label="Back">
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
		<h1 class="text-2xl font-bold text-gray-900">New Game</h1>
	</header>

	<form
		method="POST"
		onsubmit={handleSubmit}
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<input type="hidden" name="players" value={JSON.stringify(players)} />

		<div class="mb-6">
			<h2 class="text-lg font-medium text-gray-900 mb-3">Players</h2>

			<div class="space-y-2 mb-4">
				{#each players as player, index}
					<div
						class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100"
					>
						<span class="text-gray-800">
							{player.name}
							{#if player.isUser && !data.isGuest}
								<span class="text-gray-500">(you)</span>
							{/if}
						</span>
						{#if player.isUser && !data.isGuest}
							<span class="text-green-600">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</span>
						{:else}
							<button
								type="button"
								onclick={() => removePlayer(index)}
								class="text-gray-400 hover:text-red-500 transition-colors"
								aria-label="Remove player"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						{/if}
					</div>
				{/each}
			</div>

			{#if players.length < 7}
				<AddPlayerInput onAdd={addPlayer} />
			{:else}
				<p class="text-sm text-gray-500 text-center">Maximum 7 players reached</p>
			{/if}
		</div>

		<div class="mb-6 p-4 bg-gray-50 rounded-xl">
			<p class="text-sm text-gray-500">Game will be called:</p>
			<p class="text-lg font-medium text-gray-900">{gameName || 'Add players...'}</p>
		</div>

		{#if data.isGuest}
			<div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
				This game will be saved locally on this device.
				<a href="/auth" class="underline font-medium">Sign in</a> to sync across devices.
			</div>
		{/if}

		{#if form?.error || error}
			<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
				{form?.error || error}
			</div>
		{/if}

		<button
			type="submit"
			disabled={!canCreate || submitting}
			class="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{submitting ? 'Creating...' : 'Create Game'}
		</button>

		{#if players.length < 2}
			<p class="mt-2 text-sm text-gray-500 text-center">Add at least one more player to start</p>
		{/if}
	</form>
</div>
