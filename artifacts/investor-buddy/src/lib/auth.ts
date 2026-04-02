import { setAuthTokenGetter } from "@workspace/api-client-react";

export const TOKEN_KEY = "ib_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Initialize custom fetch to use this token
setAuthTokenGetter(() => {
  return getToken();
});
