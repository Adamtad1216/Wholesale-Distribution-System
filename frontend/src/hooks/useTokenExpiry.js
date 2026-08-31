import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { tokenRefreshed, logout } from '../features/auth/authSlice';
import { tokenService } from '../services/tokenService';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function useTokenExpiry() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, isAuthenticated, sessionExpiresAt } = useSelector(
    (state) => state.auth
  );

  const refreshTimerRef = useRef(null);
  const sessionTimerRef = useRef(null);

  useEffect(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    if (!isAuthenticated || !sessionExpiresAt) return;

    const msUntilSessionEnd = sessionExpiresAt - Date.now();

    if (msUntilSessionEnd <= 0) {
      dispatchLogout();
      return;
    }

    sessionTimerRef.current = setTimeout(() => {
      dispatchLogout();
    }, msUntilSessionEnd);

    return () => {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    };
  }, [sessionExpiresAt, isAuthenticated]); // eslint-disable-line

  useEffect(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!isAuthenticated || !token) return;

    const payload = decodeJwt(token);
    if (!payload?.exp || !payload?.iat) return;

    const tokenLifetimeMs = (payload.exp - payload.iat) * 1000;
    const msUntilExpiry = payload.exp * 1000 - Date.now();

    if (msUntilExpiry <= 0) {
      attemptRefresh();
      return;
    }

    const refreshAt = Math.max(msUntilExpiry - tokenLifetimeMs * 0.2, 0);

    refreshTimerRef.current = setTimeout(() => {
      attemptRefresh();
    }, refreshAt);

    async function attemptRefresh() {
      if (sessionExpiresAt && Date.now() >= sessionExpiresAt) return;

      const refreshToken = tokenService.getRefreshToken();
      if (!refreshToken) {
        dispatchLogout();
        return;
      }

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const data = response.data?.data || response.data;

        dispatch(
          tokenRefreshed({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          })
        );
      } catch {
        dispatchLogout();
      }
    }

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [token, isAuthenticated, sessionExpiresAt]); // eslint-disable-line

  function dispatchLogout() {
    dispatch(logout());
    toast.error('Your session has expired. Please log in again.', {
      duration: 5000,
      id: 'session-expired',
    });
    navigate('/login', { replace: true });
  }
}
