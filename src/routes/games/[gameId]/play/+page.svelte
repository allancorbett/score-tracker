<script lang="ts">
	import { goto } from '$app/navigation';
	import PlayerScoreCard from '$lib/components/PlayerScoreCard.svelte';
	import RoundIndicator from '$lib/components/RoundIndicator.svelte';
	import { getCardsForRound, TOTAL_ROUNDS, type Score, type GamePlayer } from '$lib/types';
	import { createSupabaseClient } from '$lib/supabase';

	let { data } = $props();

	const supabase = createSupabaseClient();

	// Local state
	let scores = $state<Score[]>([...data.scores]);
	let currentRound = $state(1);
	let isSaving = $state(false);
	let showSummary = $state(false);

	// Initialize current round based on existing scores
	$effect(() => {
		if (data.scores.length > 0) {
			const maxRound = Math.max(...data.scores.map((s) => s.round_number));
			const scoresInMaxRound = data.scores.filter((s) => s.round_number === maxRound);
			const cardsForMaxRound = getCardsForRound(maxRound);
			const totalTricks = scoresInMaxRound.reduce((sum, s) => sum + s.tricks_won, 0);

			if (totalTricks === cardsForMaxRound && scoresInMaxRound.length === data.players.length) {
				if (maxRound === TOTAL_ROUNDS) {
					showSummary = true;
				} else {
					currentRound = maxRound + 1;
				}
			} else {
				currentRound = maxRound;
			}
		}
	});

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
	const isLastRound = $derived(currentRound === TOTAL_ROUNDS);

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
			const { error } = await supabase.from('scores').upsert(
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

	function goToNextRound() {
		if (isLastRound) {
			showSummary = true;
		} else {
			currentRound = currentRound + 1;
		}
	}

	function goToPreviousRound() {
		if (currentRound > 1) {
			currentRound = currentRound - 1;
		}
	}

	function goToRound(round: number) {
		if (round >= 1 && round <= TOTAL_ROUNDS) {
			currentRound = round;
			showSummary = false;
		}
	}

	async function completeSession() {
		const { error } = await supabase
			.from('sessions')
			.update({ is_complete: true })
			.eq('id', data.session.id);

		if (!error) {
			goto(`/games/${data.game.id}`);
		}
	}

	// Session totals for summary
	const sessionTotals = $derived.by(() => {
		return data.players
			.map((player) => {
				const playerScores = scores.filter((s) => s.game_player_id === player.id);
				const total = playerScores.reduce((sum, s) => sum + s.tricks_won, 0);
				return { player, total };
			})
			.sort((a, b) => b.total - a.total);
	});

	function getMedal(position: number): string {
		switch (position) {
			case 0:
				return '🥇';
			case 1:
				return '🥈';
			case 2:
				return '🥉';
			default:
				return `${position + 1}.`;
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
</script>

<svelte:head>
	<title>Round {currentRound} - {data.game.name}</title>
</svelte:head>

{#if showSummary}
	<!-- Session Summary -->
	<div class="p-4 max-w-lg mx-auto">
		<header class="mb-6">
			<h1 class="text-2xl font-bold text-gray-900 text-center">Session Complete! 🎉</h1>
			<p class="text-center text-gray-500 mt-2">{formatDate(data.session.played_at)}</p>
		</header>

		<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
			{#each sessionTotals as { player, total }, index}
				<div
					class="flex justify-between items-center p-4 {index !== sessionTotals.length - 1
						? 'border-b border-gray-100'
						: ''}"
				>
					<div class="flex items-center gap-3">
						<span class="text-lg w-8">{getMedal(index)}</span>
						<span class="text-lg text-gray-800">{player.player_name}</span>
					</div>
					<span class="text-xl font-semibold text-gray-900 tabular-nums">{total}</span>
				</div>
			{/each}
		</div>

		<div class="mb-6">
			<h2 class="text-lg font-medium text-gray-900 mb-3">Round by round</h2>
			<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-100">
							<th class="text-left p-3 font-medium text-gray-500"></th>
							{#each Array(TOTAL_ROUNDS) as _, i}
								<th class="p-3 font-medium text-gray-500 text-center">{i + 1}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each data.players as player}
							<tr class="border-b border-gray-50 last:border-0">
								<td class="p-3 font-medium text-gray-800"
									>{player.player_name.charAt(0).toUpperCase()}</td
								>
								{#each Array(TOTAL_ROUNDS) as _, roundIndex}
									{@const roundScore = scores.find(
										(s) => s.game_player_id === player.id && s.round_number === roundIndex + 1
									)}
									<td class="p-3 text-center text-gray-600 tabular-nums">
										<button
											type="button"
											onclick={() => goToRound(roundIndex + 1)}
											class="hover:text-blue-600 transition-colors"
										>
											{roundScore?.tricks_won ?? '-'}
										</button>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<button
			onclick={completeSession}
			class="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
		>
			Done
		</button>
	</div>
{:else}
	<!-- Scoring Screen -->
	<div class="p-4 max-w-lg mx-auto pb-32">
		<header class="flex items-center justify-between mb-4">
			<button onclick={() => goto(`/games/${data.game.id}`)} class="p-2 -ml-2 text-gray-500 hover:text-gray-700">
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

			<button
				onclick={() => {
					const round = prompt('Go to round (1-7):', currentRound.toString());
					if (round) goToRound(parseInt(round));
				}}
				class="flex-1 mx-4"
			>
				<RoundIndicator {currentRound} {cardsDealt} />
			</button>

			<div class="w-10">
				{#if isSaving}
					<span class="text-gray-400 text-sm">Saving...</span>
				{/if}
			</div>
		</header>

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
	</div>

	<div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-area-inset-bottom">
		<div class="max-w-lg mx-auto flex gap-3">
			{#if currentRound > 1}
				<button
					onclick={goToPreviousRound}
					class="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
				>
					←
				</button>
			{/if}

			<button
				onclick={goToNextRound}
				disabled={!isRoundComplete}
				class="flex-1 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLastRound ? 'Finish Session' : 'Next Round →'}
			</button>
		</div>
	</div>
{/if}
