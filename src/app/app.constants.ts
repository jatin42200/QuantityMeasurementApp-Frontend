type RuntimeEnv = {
  API_BASE_URL?: string;
};

declare global {
  interface Window {
    __env?: RuntimeEnv;
  }
}

const runtimeApiBaseUrl = window.__env?.API_BASE_URL?.trim();

export const API_BASE_URL =
  runtimeApiBaseUrl && runtimeApiBaseUrl.length > 0
    ? runtimeApiBaseUrl.replace(/\/+$/, '')
    : 'http://localhost:8080';
export const AUTH_TOKEN_STORAGE_KEY = 'qm-auth-token';
export const THEME_STORAGE_KEY = 'qm-theme';
