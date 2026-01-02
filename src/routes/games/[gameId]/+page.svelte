<script lang="ts">
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import SessionList from '$lib/components/SessionList.svelte';
	import { goto } from '$app/navigation';
	import { localGames, type LocalGame, type LocalSession } from '$lib/stores/localGames';
	import type { GamePlayer, Session, Score } from '$lib/types';

	let { data } = $props();

	// For local games, load from localStorage
	const localGame = $derived(data.isLocalGame ? localGames.getGame(data.gameId) : null);

	const game = $derived(data.isLocalGame ? localGame : data.game);
	const players = $derived(data.isLocalGame ? (localGame?.players || []) : data.players);
	const sessions = $derived(data.isLocalGame ? (localGame?.sessions || []) : data.sessions);

	const standings = $derived.by(() => {
		if (!data.isLocalGame) return data.standings;
		if (!localGame) return [];

		return localGame.players.map((player) => {
			const completeSessions = localGame.sessions.filter((s) => s.is_complete);
			const playerScores = completeSessions.flatMap((s) => s.scores).filter((score) => score.game_player_id === player.id);
			const totalTricks = playerScores.reduce((sum, s) => sum + s.tricks_won, 0);
			const sessionsPlayed = new Set(playerScores.map((s) => s.session_id)).size;

			return {
				game_id: localGame.id,
				game_player_id: player.id,
				player_name: player.player_name,
				user_id: player.user_id,
				total_tricks: totalTricks,
				sessions_played: sessionsPlayed
			};
		});
	});

	const incompleteSession = $derived(
		data.isLocalGame
			? localGame?.sessions.find((s) => !s.is_complete)
			: data.incompleteSession
	);

	function handleSessionClick(sessionId: string) {
		if (game) {
			goto(`/games/${game.id}/play/${sessionId}`);
		}
	}
</script>

<svelte:head>
	<title>{game?.name || 'Game'} - Whist</title>
</svelte:head>

{#if game}
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
			<h1 class="text-xl font-bold text-gray-900 truncate">{game.name}</h1>
			{#if data.isLocalGame}
				<span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Local</span>
			{/if}
		</header>

		<section class="mb-8">
			<h2 class="text-lg font-medium text-gray-900 mb-3">All-time Standings</h2>
			<Leaderboard {standings} />
		</section>

		{#if sessions.length > 0}
			<section>
				<h2 class="text-lg font-medium text-gray-900 mb-3">Sessions</h2>
				<SessionList
					{sessions}
					{players}
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
				href="/games/{game.id}/play"
				class="block w-full py-4 bg-blue-600 text-white rounded-xl font-medium text-center hover:bg-blue-700 transition-colors"
			>
				{incompleteSession ? 'Continue Session' : '+ New Session'}
			</a>
		</div>
	</div>
{:else}
	<div class="p-4 max-w-lg mx-auto text-center py-16">
		<h1 class="text-xl font-bold text-gray-900 mb-4">Game Not Found</h1>
		<p class="text-gray-500 mb-6">This game doesn't exist or has been deleted.</p>
		<a href="/" class="text-blue-600 hover:underline">Go back home</a>
	</div>
{/if}
