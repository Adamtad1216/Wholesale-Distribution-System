const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const tokenService = {
  // Access token
  getToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  setToken: (token) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(ACCESS_TOKEN_KEY),

  // Refresh token
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),

  // Clear both at once (logout)
  clearAll: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
