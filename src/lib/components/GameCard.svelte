<script lang="ts">
	interface Props {
		name: string;
		sessionCount: number;
		userScore: number;
		href: string;
	}

	let { name, sessionCount, userScore, href }: Props = $props();
</script>

<a
	{href}
	class="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
>
	<div class="text-lg font-medium text-gray-900 mb-1">{name}</div>
	<div class="text-sm text-gray-500">
		{sessionCount}
		{sessionCount === 1 ? 'session' : 'sessions'} · {userScore} pts
	</div>
</a>
