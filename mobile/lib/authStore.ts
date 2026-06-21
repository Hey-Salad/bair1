import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN, isAuth0Configured } from '@/lib/config';
import { fetchAdminMe } from '@/lib/api';
import type { AdminMe } from '@/lib/types';

const TOKEN_KEY = 'bair1.accessToken';

interface AuthState {
  configured: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
  me: AdminMe | null;
  /** Restore a persisted session on app start. */
  restore: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

// Lazy require so the native module never loads on web preview.
type Auth0Module = typeof import('react-native-auth0');
let auth0Client: InstanceType<Auth0Module['default']> | null = null;

async function getAuth0() {
  if (!isAuth0Configured) return null;
  if (auth0Client) return auth0Client;
  try {
    const mod: Auth0Module = await import('react-native-auth0');
    auth0Client = new mod.default({ domain: AUTH0_DOMAIN, clientId: AUTH0_CLIENT_ID });
    return auth0Client;
  } catch {
    return null;
  }
}

async function loadMe(token: string, set: (s: Partial<AuthState>) => void) {
  try {
    const me = await fetchAdminMe(token);
    set({ me });
  } catch (e) {
    set({ error: e instanceof Error ? e.message : 'Failed to load profile' });
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  configured: isAuth0Configured,
  loading: false,
  error: null,
  token: null,
  me: null,

  restore: async () => {
    if (!isAuth0Configured) return;
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      set({ token });
      await loadMe(token, set);
    }
  },

  login: async () => {
    if (!isAuth0Configured) {
      set({ error: 'Auth0 is not configured. Add EXPO_PUBLIC_AUTH0_DOMAIN and CLIENT_ID.' });
      return;
    }
    set({ loading: true, error: null });
    try {
      const client = await getAuth0();
      if (!client) throw new Error('Auth0 unavailable on this platform.');
      const credentials = await client.webAuth.authorize({
        scope: 'openid profile email',
        audience: AUTH0_AUDIENCE || undefined,
      });
      const token = credentials.accessToken;
      await AsyncStorage.setItem(TOKEN_KEY, token);
      set({ token });
      await loadMe(token, set);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Login failed' });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    const client = await getAuth0();
    try {
      await client?.webAuth.clearSession();
    } catch {
      // ignore — clear local state regardless
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
    set({ token: null, me: null, error: null });
    void get();
  },
}));
