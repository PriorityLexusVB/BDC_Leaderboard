const KEY = 'mgr_jwt';

export function getToken() {
  return localStorage.getItem(KEY) || '';
}
export function setToken(t: string) {
  localStorage.setItem(KEY, t);
}
export function clearToken() {
  localStorage.removeItem(KEY);
}
export function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
