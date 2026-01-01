import { writable, derived } from 'svelte/store';
import type { Score, GamePlayer } from '$lib/types';
import { getCardsForRound, TOTAL_ROUNDS } from '$lib/types';

interface CurrentSessionState {
	sessionId: string | null;
	gameId: string | null;
	players: GamePlayer[];
	scores: Score[];
	currentRound: number;
	isLoading: boolean;
	isSaving: boolean;
}

const initialState: CurrentSessionState = {
	sessionId: null,
	gameId: null,
	players: [],
	scores: [],
	currentRound: 1,
	isLoading: false,
	isSaving: false
};

function createCurrentSessionStore() {
	const { subscribe, set, update } = writable<CurrentSessionState>(initialState);

	return {
		subscribe,
		set,
		update,

		initialize(sessionId: string, gameId: string, players: GamePlayer[], scores: Score[]) {
			// Determine current round based on existing scores
			let currentRound = 1;
			if (scores.length > 0) {
				const maxRound = Math.max(...scores.map((s) => s.round_number));
				const scoresInMaxRound = scores.filter((s) => s.round_number === maxRound);
				const cardsForMaxRound = getCardsForRound(maxRound);
				const totalTricks = scoresInMaxRound.reduce((sum, s) => sum + s.tricks_won, 0);

				// If round is complete, move to next
				if (totalTricks === cardsForMaxRound && scoresInMaxRound.length === players.length) {
					currentRound = Math.min(maxRound + 1, TOTAL_ROUNDS);
				} else {
					currentRound = maxRound;
				}
			}

			set({
				sessionId,
				gameId,
				players,
				scores,
				currentRound,
				isLoading: false,
				isSaving: false
			});
		},

		setRound(round: number) {
			update((state) => ({ ...state, currentRound: round }));
		},

		updateScore(gamePlayerId: string, roundNumber: number, tricksWon: number) {
			update((state) => {
				const existingIndex = state.scores.findIndex(
					(s) => s.game_player_id === gamePlayerId && s.round_number === roundNumber
				);

				const newScores = [...state.scores];

				if (existingIndex >= 0) {
					newScores[existingIndex] = {
						...newScores[existingIndex],
						tricks_won: tricksWon
					};
				} else {
					// Add new score entry
					newScores.push({
						id: `temp-${gamePlayerId}-${roundNumber}`,
						session_id: state.sessionId!,
						game_player_id: gamePlayerId,
						round_number: roundNumber,
						tricks_won: tricksWon,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					});
				}

				return { ...state, scores: newScores };
			});
		},

		setSaving(isSaving: boolean) {
			update((state) => ({ ...state, isSaving }));
		},

		reset() {
			set(initialState);
		}
	};
}

export const currentSession = createCurrentSessionStore();

// Derived store for current round scores
export const currentRoundScores = derived(currentSession, ($session) => {
	const scoresMap = new Map<string, number>();

	$session.scores
		.filter((s) => s.round_number === $session.currentRound)
		.forEach((s) => {
			scoresMap.set(s.game_player_id, s.tricks_won);
		});

	// Initialize missing players with 0
	$session.players.forEach((p) => {
		if (!scoresMap.has(p.id)) {
			scoresMap.set(p.id, 0);
		}
	});

	return scoresMap;
});

// Derived store for round total
export const currentRoundTotal = derived(currentRoundScores, ($scores) => {
	return Array.from($scores.values()).reduce((sum, tricks) => sum + tricks, 0);
});

// Derived store for whether round is complete
export const isRoundComplete = derived(
	[currentSession, currentRoundTotal],
	([$session, $total]) => {
		const cardsDealt = getCardsForRound($session.currentRound);
		return $total === cardsDealt;
	}
);
