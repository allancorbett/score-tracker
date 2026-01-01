export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					first_name: string;
					created_at: string;
				};
				Insert: {
					id: string;
					first_name: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					first_name?: string;
					created_at?: string;
				};
			};
			games: {
				Row: {
					id: string;
					name: string;
					created_at: string;
					created_by: string | null;
				};
				Insert: {
					id?: string;
					name: string;
					created_at?: string;
					created_by?: string | null;
				};
				Update: {
					id?: string;
					name?: string;
					created_at?: string;
					created_by?: string | null;
				};
			};
			game_players: {
				Row: {
					id: string;
					game_id: string;
					user_id: string | null;
					player_name: string;
					player_order: number;
					created_at: string;
				};
				Insert: {
					id?: string;
					game_id: string;
					user_id?: string | null;
					player_name: string;
					player_order: number;
					created_at?: string;
				};
				Update: {
					id?: string;
					game_id?: string;
					user_id?: string | null;
					player_name?: string;
					player_order?: number;
					created_at?: string;
				};
			};
			sessions: {
				Row: {
					id: string;
					game_id: string;
					played_at: string;
					is_complete: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					game_id: string;
					played_at?: string;
					is_complete?: boolean;
					created_at?: string;
				};
				Update: {
					id?: string;
					game_id?: string;
					played_at?: string;
					is_complete?: boolean;
					created_at?: string;
				};
			};
			scores: {
				Row: {
					id: string;
					session_id: string;
					game_player_id: string;
					round_number: number;
					tricks_won: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					session_id: string;
					game_player_id: string;
					round_number: number;
					tricks_won: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					session_id?: string;
					game_player_id?: string;
					round_number?: number;
					tricks_won?: number;
					created_at?: string;
					updated_at?: string;
				};
			};
		};
		Views: {
			game_standings: {
				Row: {
					game_id: string;
					game_player_id: string;
					player_name: string;
					user_id: string | null;
					total_tricks: number;
					sessions_played: number;
				};
			};
		};
		Functions: Record<string, never>;
		Enums: Record<string, never>;
	};
}
