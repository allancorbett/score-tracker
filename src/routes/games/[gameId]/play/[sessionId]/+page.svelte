<script lang="ts">
	import { goto } from '$app/navigation';
	import PlayerScoreCard from '$lib/components/PlayerScoreCard.svelte';
	import RoundIndicator from '$lib/components/RoundIndicator.svelte';
	import { getCardsForRound, TOTAL_ROUNDS, type Score } from '$lib/types';
	import { createSupabaseClient } from '$lib/supabase';

	let { data } = $props();

	const supabase = createSupabaseClient();

	let scores = $state<Score[]>([...data.scores]);
	let currentRound = $state(1);
	let isSaving = $state(false);

	const cardsDealt = $derived(getCardsForRound(currentRound));

	const currentRoundScores = $derived.by(() => {
		const scoresMap = new Map<string, number>();
		scores
			.filter((s) => s.round_number === currentRound)
			.forEach((s) => {
				scoresMap.set(s.game_player_id, s.tricks_won);
			});
		data.players.forEach((p) => {
			if (!scoresMap.has(p.id)) {
				scoresMap.set(p.id, 0);
			}
		});
		return scoresMap;
	});

	const roundTotal = $derived(
		Array.from(currentRoundScores.values()).reduce((sum, tricks) => sum + tricks, 0)
	);

	const isRoundComplete = $derived(roundTotal === cardsDealt);

	function getPlayerScore(playerId: string): number {
		return currentRoundScores.get(playerId) || 0;
	}

	function updateLocalScore(playerId: string, newScore: number) {
		const existingIndex = scores.findIndex(
			(s) => s.game_player_id === playerId && s.round_number === currentRound
		);

		if (existingIndex >= 0) {
			scores[existingIndex] = { ...scores[existingIndex], tricks_won: newScore };
		} else {
			scores = [
				...scores,
				{
					id: `temp-${playerId}-${currentRound}`,
					session_id: data.session.id,
					game_player_id: playerId,
					round_number: currentRound,
					tricks_won: newScore,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
			];
		}
	}

	let saveTimeout: ReturnType<typeof setTimeout>;

	async function saveScore(playerId: string, tricksWon: number) {
		clearTimeout(saveTimeout);
		isSaving = true;

		saveTimeout = setTimeout(async () => {
			await supabase.from('scores').upsert(
				{
					session_id: data.session.id,
					game_player_id: playerId,
					round_number: currentRound,
					tricks_won: tricksWon
				},
				{
					onConflict: 'session_id,game_player_id,round_number'
				}
			);

			isSaving = false;
		}, 500);
	}

	function handleIncrement(playerId: string) {
		const current = getPlayerScore(playerId);
		if (current < cardsDealt && roundTotal < cardsDealt) {
			const newScore = current + 1;
			updateLocalScore(playerId, newScore);
			saveScore(playerId, newScore);
		}
	}

	function handleDecrement(playerId: string) {
		const current = getPlayerScore(playerId);
		if (current > 0) {
			const newScore = current - 1;
			updateLocalScore(playerId, newScore);
			saveScore(playerId, newScore);
		}
	}

	function goToRound(round: number) {
		if (round >= 1 && round <= TOTAL_ROUNDS) {
			currentRound = round;
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	const sessionTotals = $derived.by(() => {
		return data.players
			.map((player) => {
				const playerScores = scores.filter((s) => s.game_player_id === player.id);
				const total = playerScores.reduce((sum, s) => sum + s.tricks_won, 0);
				return { player, total };
			})
			.sort((a, b) => b.total - a.total);
	});
</script>

<svelte:head>
	<title>{formatDate(data.session.played_at)} - {data.game.name}</title>
</svelte:head>

<div class="p-4 max-w-lg mx-auto pb-32">
	<header class="flex items-center justify-between mb-4">
		<button
			onclick={() => goto(`/games/${data.game.id}`)}
			class="p-2 -ml-2 text-gray-500 hover:text-gray-700"
		>
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
		</button>

		<div class="text-center flex-1">
			<div class="text-sm text-gray-500">{formatDate(data.session.played_at)}</div>
			<RoundIndicator {currentRound} {cardsDealt} />
		</div>

		<div class="w-10">
			{#if isSaving}
				<span class="text-gray-400 text-sm">Saving...</span>
			{/if}
		</div>
	</header>

	<!-- Round selector -->
	<div class="flex justify-center gap-2 mb-6">
		{#each Array(TOTAL_ROUNDS) as _, i}
			<button
				onclick={() => goToRound(i + 1)}
				class="w-10 h-10 rounded-full font-medium transition-colors {currentRound === i + 1
					? 'bg-blue-600 text-white'
					: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
			>
				{i + 1}
			</button>
		{/each}
	</div>

	<div class="space-y-3">
		{#each data.players as player}
			<PlayerScoreCard
				playerName={player.player_name}
				score={getPlayerScore(player.id)}
				maxScore={cardsDealt}
				onIncrement={() => handleIncrement(player.id)}
				onDecrement={() => handleDecrement(player.id)}
			/>
		{/each}
	</div>

	<div class="mt-6 text-center">
		<span
			class="text-2xl font-bold {isRoundComplete ? 'text-green-600' : 'text-gray-400'} tabular-nums"
		>
			Total: {roundTotal} / {cardsDealt}
		</span>
	</div>

	<!-- Session totals -->
	<div class="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
		<h3 class="text-sm font-medium text-gray-500 mb-3">Session Totals</h3>
		{#each sessionTotals as { player, total }}
			<div class="flex justify-between items-center py-1">
				<span class="text-gray-700">{player.player_name}</span>
				<span class="font-medium text-gray-900 tabular-nums">{total}</span>
			</div>
		{/each}
	</div>
</div>

<div
	class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-area-inset-bottom"
>
	<div class="max-w-lg mx-auto">
		<button
			onclick={() => goto(`/games/${data.game.id}`)}
			class="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
		>
			Back to Game
		</button>
	</div>
</div>
