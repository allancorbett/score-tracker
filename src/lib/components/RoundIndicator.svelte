<script lang="ts">
	interface Props {
		currentRound: number;
		totalRounds?: number;
		cardsDealt: number;
	}

	let { currentRound, totalRounds = 7, cardsDealt }: Props = $props();
</script>

<div class="flex justify-between items-center">
	<span class="text-lg font-medium text-gray-600">
		Round {currentRound} of {totalRounds}
	</span>
	<span class="text-lg text-gray-500">
		{cardsDealt}
		{cardsDealt === 1 ? 'card' : 'cards'}
	</span>
</div>
