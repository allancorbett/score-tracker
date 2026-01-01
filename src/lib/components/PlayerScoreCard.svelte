<script lang="ts">
	interface Props {
		playerName: string;
		score: number;
		maxScore: number;
		onIncrement: () => void;
		onDecrement: () => void;
	}

	let { playerName, score, maxScore, onIncrement, onDecrement }: Props = $props();

	let touchStartX = $state(0);
	let touchStartY = $state(0);

	function handleTap() {
		if (score < maxScore) {
			onIncrement();
			vibrate();
		}
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;
		const diffX = touchStartX - touchEndX;
		const diffY = Math.abs(touchStartY - e.changedTouches[0].clientY);

		// Only trigger swipe if horizontal movement is significant and vertical is small
		if (diffX > 50 && diffY < 30) {
			// Swiped left - decrement
			if (score > 0) {
				onDecrement();
				vibrate();
			}
		} else if (Math.abs(diffX) < 10 && diffY < 10) {
			// Tap (not a swipe)
			handleTap();
		}
	}

	function vibrate() {
		if ('vibrate' in navigator) {
			navigator.vibrate(10);
		}
	}
</script>

<button
	class="w-full p-6 bg-white rounded-xl shadow-sm border-2 flex justify-between items-center transition-colors select-none touch-manipulation min-h-[72px] {score >
	0
		? 'border-blue-200 bg-blue-50'
		: 'border-gray-100'} active:bg-gray-100"
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
	onclick={handleTap}
	type="button"
>
	<span class="text-xl text-gray-800">{playerName}</span>
	<span class="text-4xl font-bold text-gray-900 tabular-nums">{score}</span>
</button>
