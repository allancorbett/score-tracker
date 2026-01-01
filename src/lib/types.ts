export interface Profile {
	id: string;
	first_name: string;
	created_at: string;
}

export interface Game {
	id: string;
	name: string;
	created_at: string;
	created_by: string | null;
}

export interface GamePlayer {
	id: string;
	game_id: string;
	user_id: string | null;
	player_name: string;
	player_order: number;
	created_at: string;
}

export interface Session {
	id: string;
	game_id: string;
	played_at: string;
	is_complete: boolean;
	created_at: string;
}

export interface Score {
	id: string;
	session_id: string;
	game_player_id: string;
	round_number: number;
	tricks_won: number;
	created_at: string;
	updated_at: string;
}

export interface GameStanding {
	game_id: string;
	game_player_id: string;
	player_name: string;
	user_id: string | null;
	total_tricks: number;
	sessions_played: number;
}

// Derived types for UI
export interface GameWithPlayers extends Game {
	players: GamePlayer[];
}

export interface SessionWithScores extends Session {
	scores: Score[];
}

export interface RoundState {
	roundNumber: number;
	cardsDealt: number;
	scores: Map<string, number>; // game_player_id -> tricks
}

// Game constants
export const CARDS_PER_ROUND = [7, 6, 5, 4, 3, 2, 1] as const;
export const TOTAL_ROUNDS = 7;

export function getCardsForRound(roundNumber: number): number {
	return CARDS_PER_ROUND[roundNumber - 1];
}

export function generateGameName(playerNames: string[]): string {
	if (playerNames.length === 0) return '';
	if (playerNames.length === 1) return playerNames[0];
	if (playerNames.length === 2) {
		return `${playerNames[0]} & ${playerNames[1]}`;
	}
	const lastPlayer = playerNames[playerNames.length - 1];
	const otherPlayers = playerNames.slice(0, -1).join(', ');
	return `${otherPlayers} & ${lastPlayer}`;
}
