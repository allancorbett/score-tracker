import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { generateGameName, type Game } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	// Allow guest access
	if (!locals.session || !locals.user?.id) {
		return {
			userFirstName: 'Player 1',
			isGuest: true
		};
	}

	// Get user's profile for their name
	const { data: profile } = (await locals.supabase
		.from('profiles')
		.select('first_name')
		.eq('id', locals.user.id)
		.single()) as { data: { first_name: string } | null };

	return {
		userFirstName: profile?.first_name || 'You',
		isGuest: false
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// Only handle server-side game creation for logged-in users
		if (!locals.user) {
			// Guest users create games client-side
			return fail(400, { error: 'Guest users should create games client-side' });
		}

		const formData = await request.formData();
		const playersJson = formData.get('players')?.toString();

		if (!playersJson) {
			return fail(400, { error: 'Players are required' });
		}

		const players: { name: string; isUser: boolean }[] = JSON.parse(playersJson);

		if (players.length < 2) {
			return fail(400, { error: 'At least 2 players are required' });
		}

		if (players.length > 7) {
			return fail(400, { error: 'Maximum 7 players allowed' });
		}

		const gameName = generateGameName(players.map((p) => p.name));

		// Create the game
		const { data: game, error: gameError } = (await locals.supabase
			.from('games')
			.insert({
				name: gameName,
				created_by: locals.user.id
			})
			.select()
			.single()) as { data: Game | null; error: unknown };

		if (gameError || !game) {
			return fail(500, { error: 'Failed to create game' });
		}

		// Create game players
		const gamePlayers = players.map((player, index) => ({
			game_id: game.id,
			user_id: player.isUser ? locals.user!.id : null,
			player_name: player.name,
			player_order: index
		}));

		const { error: playersError } = await locals.supabase.from('game_players').insert(gamePlayers);

		if (playersError) {
			// Clean up game if players failed
			await locals.supabase.from('games').delete().eq('id', game.id);
			return fail(500, { error: 'Failed to add players' });
		}

		throw redirect(303, `/games/${game.id}`);
	}
};
