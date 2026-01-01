<script lang="ts">
	import type { Session, Score, GamePlayer } from '$lib/types';

	interface SessionWithDetails extends Session {
		scores: Score[];
	}

	interface Props {
		sessions: SessionWithDetails[];
		players: GamePlayer[];
		onSessionClick?: (sessionId: string) => void;
	}

	let { sessions, players, onSessionClick }: Props = $props();

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function getSessionTotals(session: SessionWithDetails): { name: string; total: number }[] {
		const totals = new Map<string, number>();

		session.scores.forEach((score) => {
			const current = totals.get(score.game_player_id) || 0;
			totals.set(score.game_player_id, current + score.tricks_won);
		});

		return players
			.map((player) => ({
				name: player.player_name,
				total: totals.get(player.id) || 0
			}))
			.sort((a, b) => b.total - a.total);
	}
</script>

<div class="space-y-3">
	{#each sessions as session}
		{@const playerTotals = getSessionTotals(session)}
		<button
			class="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
			onclick={() => onSessionClick?.(session.id)}
			type="button"
		>
			<div class="text-sm text-gray-500 mb-2">
				{formatDate(session.played_at)}
				{#if !session.is_complete}
					<span class="ml-2 text-amber-600">(In progress)</span>
				{/if}
			</div>
			<div class="text-gray-800">
				{#each playerTotals as player, index}
					<span class="font-medium">{player.name}</span>
					<span class="text-gray-600">{player.total}</span>
					{#if index < playerTotals.length - 1}
						<span class="text-gray-400 mx-1">·</span>
					{/if}
				{/each}
			</div>
		</button>
	{/each}
</div>
