export function getToken(): string | null {
  return localStorage.getItem("mgr_jwt");
}
export function setToken(t: string) {
  localStorage.setItem("mgr_jwt", t);
}
export function clearToken() {
  localStorage.removeItem("mgr_jwt");
}
