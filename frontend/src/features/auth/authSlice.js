import { createSlice } from '@reduxjs/toolkit';
import { tokenService } from '../../services/tokenService';

const SESSION_EXPIRY_KEY = 'sessionExpiresAt';

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

const token = tokenService.getToken() || null;
const storedSessionExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);

const initialState = {
  user: null,
  token: token,
  refreshToken: tokenService.getRefreshToken() || null,
  isAuthenticated: !!token,
  role: null,
  permissions: [],
  loading: false,
  error: null,
  sessionExpiresAt: storedSessionExpiry ? Number(storedSessionExpiry) : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.permissions = action.payload.permissions || [];
      state.isAuthenticated = true;

      const refreshPayload = decodeJwt(action.payload.refreshToken);
      const sessionExpiresAt = refreshPayload?.exp
        ? refreshPayload.exp * 1000
        : Date.now() + 7 * 24 * 60 * 60 * 1000;

      state.sessionExpiresAt = sessionExpiresAt;
      localStorage.setItem(SESSION_EXPIRY_KEY, String(sessionExpiresAt));

      tokenService.setToken(action.payload.accessToken);
      if (action.payload.refreshToken) {
        tokenService.setRefreshToken(action.payload.refreshToken);
      }
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    tokenRefreshed(state, action) {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      tokenService.setToken(action.payload.accessToken);
      tokenService.setRefreshToken(action.payload.refreshToken);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.role = null;
      state.permissions = [];
      state.isAuthenticated = false;
      state.sessionExpiresAt = null;
      tokenService.clearAll();
      localStorage.removeItem(SESSION_EXPIRY_KEY);
    },
    setProfile(state, action) {
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.permissions = action.payload.permissions || [];
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  tokenRefreshed,
  logout,
  setProfile,
} = authSlice.actions;

export default authSlice.reducer;
