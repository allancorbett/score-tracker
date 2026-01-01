<script lang="ts">
	interface Props {
		onAdd: (name: string) => void;
		placeholder?: string;
	}

	let { onAdd, placeholder = 'Add player name...' }: Props = $props();

	let inputValue = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		const trimmed = inputValue.trim();
		if (trimmed) {
			onAdd(trimmed);
			inputValue = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSubmit(e);
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex gap-2">
	<input
		type="text"
		bind:value={inputValue}
		{placeholder}
		class="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
		onkeydown={handleKeydown}
	/>
	<button
		type="submit"
		class="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		disabled={!inputValue.trim()}
	>
		+
	</button>
</form>
