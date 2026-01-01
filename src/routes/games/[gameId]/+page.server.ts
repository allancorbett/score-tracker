import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Game, GamePlayer, Session, Score } from '$lib/types';

interface SessionWithScores extends Session {
	scores: Score[];
}

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.session) {
		throw redirect(303, '/auth');
	}

	const { gameId } = params;

	// Get game with players
	const { data: game, error: gameError } = (await locals.supabase
		.from('games')
		.select('*')
		.eq('id', gameId)
		.single()) as { data: Game | null; error: unknown };

	if (gameError || !game) {
		throw error(404, 'Game not found');
	}

	// Get players
	const { data: players } = (await locals.supabase
		.from('game_players')
		.select('*')
		.eq('game_id', gameId)
		.order('player_order')) as { data: GamePlayer[] | null };

	// Check if user is a player in this game
	const isPlayer = players?.some((p) => p.user_id === locals.user?.id);
	if (!isPlayer) {
		throw error(403, 'You are not a player in this game');
	}

	// Get sessions with scores
	const { data: sessions } = (await locals.supabase
		.from('sessions')
		.select(
			`
			*,
			scores (*)
		`
		)
		.eq('game_id', gameId)
		.order('played_at', { ascending: false })) as { data: SessionWithScores[] | null };

	// Get standings
	const standings =
		players?.map((player) => {
			const playerScores =
				sessions
					?.filter((s) => s.is_complete)
					.flatMap((s) => s.scores)
					.filter((score) => score.game_player_id === player.id) || [];

			const totalTricks = playerScores.reduce((sum, s) => sum + s.tricks_won, 0);
			const sessionsPlayed = new Set(playerScores.map((s) => s.session_id)).size;

			return {
				game_id: gameId,
				game_player_id: player.id,
				player_name: player.player_name,
				user_id: player.user_id,
				total_tricks: totalTricks,
				sessions_played: sessionsPlayed
			};
		}) || [];

	// Check for incomplete session
	const incompleteSession = sessions?.find((s) => !s.is_complete);

	return {
		game,
		players: players || [],
		sessions: sessions || [],
		standings,
		incompleteSession
	};
};
