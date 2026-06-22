import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createApiClient, runRequest } from '../../shared/api/client';
import {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
  isTokenExpired,
} from '../../shared/auth/token';

/**
 * Auth Redux slice — talks to the .NET API's /api/auth endpoints via the shared
 * axios client. The token + user are mirrored into localStorage (see
 * shared/auth/token.js) so a refresh keeps the session and the axios
 * interceptor can read the token without importing the store. Registered under
 * the `auth` key in the store.
 */

const api = createApiClient('/api/auth');

const errMessage = (err, fallback) =>
  err instanceof Error ? err.message : fallback;

// Hydrate from localStorage on load; an expired token is dropped immediately so
// the app boots straight to /login instead of flashing the shell then bouncing.
function initialAuthState() {
  const stored = getStoredAuth();
  if (!stored || isTokenExpired(stored.token)) {
    clearStoredAuth();
    return { token: null, user: null, status: 'idle', error: null };
  }
  return { token: stored.token, user: stored.user ?? null, status: 'idle', error: null };
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // → { token, expiresAt, user }
      return await runRequest(api.post('/login', { email, password }));
    } catch (err) {
      return rejectWithValue(errMessage(err, 'Invalid email or password'));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState(),
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      clearStoredAuth();
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        const { token, user } = action.payload ?? {};
        state.status = 'succeeded';
        state.token = token ?? null;
        state.user = user ?? null;
        if (token) setStoredAuth({ token, user: user ?? null });
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error?.message ?? 'Login failed';
        state.token = null;
        state.user = null;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

// --- Selectors ---------------------------------------------------------------

const root = (state) => state.auth;

export const selectIsAuthenticated = (state) => Boolean(root(state).token);
export const selectAuthUser = (state) => root(state).user;
export const selectAuthLoading = (state) => root(state).status === 'loading';
export const selectAuthError = (state) => root(state).error;

export default authSlice.reducer;
