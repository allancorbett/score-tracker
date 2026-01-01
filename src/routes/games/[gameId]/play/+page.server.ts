import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { Game, GamePlayer, Session, Score } from '$lib/types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.session) {
		throw redirect(303, '/auth');
	}

	const { gameId } = params;

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

	// Check for existing incomplete session
	let { data: session } = (await locals.supabase
		.from('sessions')
		.select('*')
		.eq('game_id', gameId)
		.eq('is_complete', false)
		.single()) as { data: Session | null };

	// Create new session if none exists
	if (!session) {
		const { data: newSession, error: sessionError } = (await locals.supabase
			.from('sessions')
			.insert({
				game_id: gameId,
				is_complete: false
			})
			.select()
			.single()) as { data: Session | null; error: unknown };

		if (sessionError || !newSession) {
			throw error(500, 'Failed to create session');
		}

		session = newSession;
	}

	// Get scores for this session
	const { data: scores } = (await locals.supabase
		.from('scores')
		.select('*')
		.eq('session_id', session.id)) as { data: Score[] | null };

	return {
		game,
		players,
		session,
		scores: scores || []
	};
};

export const actions: Actions = {
	updateScore: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/auth');
		}

		const formData = await request.formData();
		const sessionId = formData.get('sessionId')?.toString();
		const gamePlayerId = formData.get('gamePlayerId')?.toString();
		const roundNumber = parseInt(formData.get('roundNumber')?.toString() || '0');
		const tricksWon = parseInt(formData.get('tricksWon')?.toString() || '0');

		if (!sessionId || !gamePlayerId || !roundNumber) {
			return { error: 'Missing required fields' };
		}

		// Upsert the score
		const { error: upsertError } = await locals.supabase.from('scores').upsert(
			{
				session_id: sessionId,
				game_player_id: gamePlayerId,
				round_number: roundNumber,
				tricks_won: tricksWon
			},
			{
				onConflict: 'session_id,game_player_id,round_number'
			}
		);

		if (upsertError) {
			return { error: 'Failed to save score' };
		}

		return { success: true };
	},

	completeSession: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/auth');
		}

		const formData = await request.formData();
		const sessionId = formData.get('sessionId')?.toString();

		if (!sessionId) {
			return { error: 'Missing session ID' };
		}

		const { error: updateError } = await locals.supabase
			.from('sessions')
			.update({ is_complete: true })
			.eq('id', sessionId);

		if (updateError) {
			return { error: 'Failed to complete session' };
		}

		return { success: true, completed: true };
	}
};
