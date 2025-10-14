import config from '../config/env';
import type { User, LoginResponse, Clock, AttendanceDelay } from '../types';

const API_URL = config.apiUrl;

// ========== HELPERS (DRY) ==========

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: 'Une erreur est survenue' 
    }));
    throw new Error(error.error || `Erreur HTTP: ${response.status}`);
  }
  return response.json();
};

const fetchWithCredentials = (url: string, options: RequestInit = {}): Promise<Response> => {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

// ========== AUTHENTICATION ==========

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetchWithCredentials(`${API_URL}/user/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResponse>(response);
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await fetchWithCredentials(`${API_URL}/user`);
  return handleResponse<User>(response);
};

// ========== CLOCKING ==========

export const clockIn = async (): Promise<Clock> => {
  const response = await fetchWithCredentials(`${API_URL}/clocks`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return handleResponse<Clock>(response);
};

export const getUserClocks = async (userId: string): Promise<Clock[]> => {
  const response = await fetchWithCredentials(`${API_URL}/users/${userId}/clocks`);
  return handleResponse<Clock[]>(response);
};

export const getAttendanceDelay = async (): Promise<AttendanceDelay> => {
  const response = await fetchWithCredentials(`${API_URL}/attendance/delay`);
  return handleResponse<AttendanceDelay>(response);
};