import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Game } from '$lib/types';

interface GamePlayerWithGame {
	game_id: string;
	games: Game;
}

interface ScoreWithSession {
	tricks_won: number;
	sessions: { is_complete: boolean };
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) {
		throw redirect(303, '/auth');
	}

	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(303, '/auth');
	}

	// Get games where user is a player
	const { data: gamePlayers } = (await locals.supabase
		.from('game_players')
		.select(
			`
			game_id,
			games!inner (
				id,
				name,
				created_at
			)
		`
		)
		.eq('user_id', userId)) as { data: GamePlayerWithGame[] | null };

	if (!gamePlayers || gamePlayers.length === 0) {
		return {
			games: []
		};
	}

	const gameIds = [...new Set(gamePlayers.map((gp) => gp.game_id))];

	// Get session counts and user totals for each game
	const gamesWithStats = await Promise.all(
		gameIds.map(async (gameId) => {
			const game = gamePlayers.find((gp) => gp.game_id === gameId)?.games;
			if (!game) return null;

			// Get session count
			const { count: sessionCount } = await locals.supabase
				.from('sessions')
				.select('*', { count: 'exact', head: true })
				.eq('game_id', gameId)
				.eq('is_complete', true);

			// Get user's game_player id for this game
			const { data: userGamePlayer } = (await locals.supabase
				.from('game_players')
				.select('id')
				.eq('game_id', gameId)
				.eq('user_id', userId)
				.single()) as { data: { id: string } | null };

			// Get user's total score in this game
			let userScore = 0;
			if (userGamePlayer) {
				const { data: scores } = (await locals.supabase
					.from('scores')
					.select('tricks_won, sessions!inner(is_complete)')
					.eq('game_player_id', userGamePlayer.id)) as { data: ScoreWithSession[] | null };

				if (scores) {
					userScore = scores
						.filter((s) => s.sessions?.is_complete)
						.reduce((sum, s) => sum + s.tricks_won, 0);
				}
			}

			return {
				...game,
				sessionCount: sessionCount || 0,
				userScore
			};
		})
	);

	return {
		games: gamesWithStats.filter((g): g is NonNullable<typeof g> => g !== null)
	};
};
