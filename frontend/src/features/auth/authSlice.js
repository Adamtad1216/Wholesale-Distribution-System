import { createSlice } from '@reduxjs/toolkit';
import { tokenService } from '../../services/tokenService';

const SESSION_EXPIRY_KEY = 'sessionExpiresAt';
const PERMISSIONS_KEY = 'auth_permissions';
const ROLE_KEY = 'auth_role';
const USER_KEY = 'auth_user';

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
const storedPermissions = localStorage.getItem(PERMISSIONS_KEY);
const storedRole = localStorage.getItem(ROLE_KEY);
const storedUser = localStorage.getItem(USER_KEY);

let parsedPermissions = [];
try {
  parsedPermissions = storedPermissions ? JSON.parse(storedPermissions) : [];
} catch {
  parsedPermissions = [];
}

let parsedUser = null;
try {
  parsedUser = storedUser ? JSON.parse(storedUser) : null;
} catch {
  parsedUser = null;
}

const initialState = {
  user: parsedUser,
  token: token,
  refreshToken: tokenService.getRefreshToken() || null,
  isAuthenticated: !!token,
  role: storedRole || null,
  permissions: parsedPermissions,
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
      const payload = action.payload?.data || action.payload;
      state.loading = false;
      state.token = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      state.user = payload.user;
      state.role = payload.role;
      state.permissions = payload.permissions || [];
      state.isAuthenticated = true;

      const refreshPayload = decodeJwt(payload.refreshToken);
      const sessionExpiresAt = refreshPayload?.exp
        ? refreshPayload.exp * 1000
        : Date.now() + 7 * 24 * 60 * 60 * 1000;

      state.sessionExpiresAt = sessionExpiresAt;
      localStorage.setItem(SESSION_EXPIRY_KEY, String(sessionExpiresAt));
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(payload.permissions || []));
      if (payload.role) localStorage.setItem(ROLE_KEY, payload.role);
      if (payload.user) localStorage.setItem(USER_KEY, JSON.stringify(payload.user));

      tokenService.setToken(payload.accessToken);
      if (payload.refreshToken) {
        tokenService.setRefreshToken(payload.refreshToken);
      }
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    tokenRefreshed(state, action) {
      const payload = action.payload?.data || action.payload;
      state.token = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      tokenService.setToken(payload.accessToken);
      tokenService.setRefreshToken(payload.refreshToken);
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
      localStorage.removeItem(PERMISSIONS_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(USER_KEY);
    },
    setProfile(state, action) {
      const payload = action.payload?.data || action.payload;
      state.user = payload.user || payload;
      state.role = payload.role || state.role;
      state.permissions = payload.permissions || state.permissions || [];
      if (payload.permissions) {
        localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(payload.permissions));
      }
      if (payload.role) {
        localStorage.setItem(ROLE_KEY, payload.role);
      }
      if (payload.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
      }
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
