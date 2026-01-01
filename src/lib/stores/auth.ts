import { writable } from 'svelte/store';
import type { Session, User } from '@supabase/supabase-js';

export const session = writable<Session | null>(null);
export const user = writable<User | null>(null);
