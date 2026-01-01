<script lang="ts">
	import type { GameStanding } from '$lib/types';

	interface Props {
		standings: GameStanding[];
	}

	let { standings }: Props = $props();

	const sortedStandings = $derived([...standings].sort((a, b) => b.total_tricks - a.total_tricks));

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
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
	{#each sortedStandings as standing, index}
		<div
			class="flex justify-between items-center p-4 {index !== sortedStandings.length - 1
				? 'border-b border-gray-100'
				: ''}"
		>
			<div class="flex items-center gap-3">
				<span class="text-lg w-8">{getMedal(index)}</span>
				<span class="text-lg text-gray-800">{standing.player_name}</span>
			</div>
			<span class="text-xl font-semibold text-gray-900 tabular-nums">{standing.total_tricks}</span>
		</div>
	{/each}
</div>
