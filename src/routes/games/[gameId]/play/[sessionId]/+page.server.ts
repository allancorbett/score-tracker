import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Game, GamePlayer, Session, Score } from '$lib/types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.session) {
		throw redirect(303, '/auth');
	}

	const { gameId, sessionId } = params;

	// Get game
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

	if (!players || players.length === 0) {
		throw error(404, 'No players found');
	}

	// Check if user is a player
	const isPlayer = players.some((p) => p.user_id === locals.user?.id);
	if (!isPlayer) {
		throw error(403, 'You are not a player in this game');
	}

	// Get specific session
	const { data: session, error: sessionError } = (await locals.supabase
		.from('sessions')
		.select('*')
		.eq('id', sessionId)
		.eq('game_id', gameId)
		.single()) as { data: Session | null; error: unknown };

	if (sessionError || !session) {
		throw error(404, 'Session not found');
	}

	// Get scores for this session
	const { data: scores } = (await locals.supabase
		.from('scores')
		.select('*')
		.eq('session_id', sessionId)) as { data: Score[] | null };

	return {
		game,
		players,
		session,
		scores: scores || []
	};
};
