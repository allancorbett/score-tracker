import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Game, GamePlayer, Session, Score } from '$lib/types';

const LOCAL_STORAGE_KEY = 'whist_local_games';

export interface LocalGame extends Game {
	players: GamePlayer[];
	sessions: LocalSession[];
}

export interface LocalSession extends Session {
	scores: Score[];
}

interface LocalGamesState {
	games: LocalGame[];
}

function loadFromStorage(): LocalGamesState {
	if (!browser) return { games: [] };

	try {
		const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.error('Failed to load local games:', e);
	}
	return { games: [] };
}

function saveToStorage(state: LocalGamesState) {
	if (!browser) return;

	try {
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
	} catch (e) {
		console.error('Failed to save local games:', e);
	}
}

function generateId(): string {
	return 'local_' + Math.random().toString(36).substring(2, 15);
}

function createLocalGamesStore() {
	const { subscribe, set, update } = writable<LocalGamesState>(loadFromStorage());

	// Save to localStorage whenever state changes
	subscribe((state) => {
		saveToStorage(state);
	});

	return {
		subscribe,

		createGame(name: string, playerNames: string[]): LocalGame {
			const gameId = generateId();
			const now = new Date().toISOString();

			const players: GamePlayer[] = playerNames.map((playerName, index) => ({
				id: generateId(),
				game_id: gameId,
				user_id: null,
				player_name: playerName,
				player_order: index,
				created_at: now
			}));

			const game: LocalGame = {
				id: gameId,
				name,
				created_at: now,
				created_by: null,
				players,
				sessions: []
			};

			update((state) => ({
				games: [...state.games, game]
			}));

			return game;
		},

		getGame(gameId: string): LocalGame | undefined {
			const state = get({ subscribe });
			return state.games.find((g) => g.id === gameId);
		},

		createSession(gameId: string): LocalSession | undefined {
			const sessionId = generateId();
			const now = new Date().toISOString();

			let newSession: LocalSession | undefined;

			update((state) => {
				const gameIndex = state.games.findIndex((g) => g.id === gameId);
				if (gameIndex === -1) return state;

				// Check for existing incomplete session
				const existingIncomplete = state.games[gameIndex].sessions.find((s) => !s.is_complete);
				if (existingIncomplete) {
					newSession = existingIncomplete;
					return state;
				}

				newSession = {
					id: sessionId,
					game_id: gameId,
					played_at: now,
					is_complete: false,
					created_at: now,
					scores: []
				};

				const updatedGames = [...state.games];
				updatedGames[gameIndex] = {
					...updatedGames[gameIndex],
					sessions: [...updatedGames[gameIndex].sessions, newSession]
				};

				return { games: updatedGames };
			});

			return newSession;
		},

		getSession(gameId: string, sessionId: string): LocalSession | undefined {
			const game = this.getGame(gameId);
			return game?.sessions.find((s) => s.id === sessionId);
		},

		getIncompleteSession(gameId: string): LocalSession | undefined {
			const game = this.getGame(gameId);
			return game?.sessions.find((s) => !s.is_complete);
		},

		updateScore(gameId: string, sessionId: string, gamePlayerId: string, roundNumber: number, tricksWon: number) {
			const now = new Date().toISOString();

			update((state) => {
				const gameIndex = state.games.findIndex((g) => g.id === gameId);
				if (gameIndex === -1) return state;

				const sessionIndex = state.games[gameIndex].sessions.findIndex((s) => s.id === sessionId);
				if (sessionIndex === -1) return state;

				const session = state.games[gameIndex].sessions[sessionIndex];
				const scoreIndex = session.scores.findIndex(
					(s) => s.game_player_id === gamePlayerId && s.round_number === roundNumber
				);

				let updatedScores: Score[];
				if (scoreIndex >= 0) {
					updatedScores = [...session.scores];
					updatedScores[scoreIndex] = {
						...updatedScores[scoreIndex],
						tricks_won: tricksWon,
						updated_at: now
					};
				} else {
					updatedScores = [
						...session.scores,
						{
							id: generateId(),
							session_id: sessionId,
							game_player_id: gamePlayerId,
							round_number: roundNumber,
							tricks_won: tricksWon,
							created_at: now,
							updated_at: now
						}
					];
				}

				const updatedGames = [...state.games];
				const updatedSessions = [...updatedGames[gameIndex].sessions];
				updatedSessions[sessionIndex] = {
					...session,
					scores: updatedScores
				};
				updatedGames[gameIndex] = {
					...updatedGames[gameIndex],
					sessions: updatedSessions
				};

				return { games: updatedGames };
			});
		},

		completeSession(gameId: string, sessionId: string) {
			update((state) => {
				const gameIndex = state.games.findIndex((g) => g.id === gameId);
				if (gameIndex === -1) return state;

				const sessionIndex = state.games[gameIndex].sessions.findIndex((s) => s.id === sessionId);
				if (sessionIndex === -1) return state;

				const updatedGames = [...state.games];
				const updatedSessions = [...updatedGames[gameIndex].sessions];
				updatedSessions[sessionIndex] = {
					...updatedSessions[sessionIndex],
					is_complete: true
				};
				updatedGames[gameIndex] = {
					...updatedGames[gameIndex],
					sessions: updatedSessions
				};

				return { games: updatedGames };
			});
		},

		deleteGame(gameId: string) {
			update((state) => ({
				games: state.games.filter((g) => g.id !== gameId)
			}));
		},

		getAllGames(): LocalGame[] {
			return get({ subscribe }).games;
		},

		clear() {
			set({ games: [] });
		}
	};
}

export const localGames = createLocalGamesStore();
