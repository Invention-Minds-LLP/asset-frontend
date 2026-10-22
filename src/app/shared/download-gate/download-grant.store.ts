// DPDP download gate state. Deliberately DI-free so the HTTP interceptor can
// import it without a circular dependency on the gate service.
//
// grant  — 60-min JWT from email OTP, kept in sessionStorage (tab-scoped) and
//          bound to the signed-in user so a shared PC never inherits it.
// ticket — single-use JWT from captcha + reason; memory only, taken by the
//          next blob request.

export interface DownloadGrant {
  grant: string;
  expiresAt: string;
}

const STORAGE_KEY = 'downloadGrant';

const currentUserKey = (): string | null => {
  try {
    return localStorage.getItem('employeeDbId');
  } catch {
    return null;
  }
};

export function currentDownloadGrant(): string | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as DownloadGrant & { user: string | null };
    if (g.user !== currentUserKey()) return null;
    return new Date(g.expiresAt).getTime() - 5000 > Date.now() ? g.grant : null; // 5s margin
  } catch {
    return null;
  }
}

export function storeDownloadGrant(g: DownloadGrant): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...g, user: currentUserKey() }));
  } catch {}
}

export function clearDownloadGrant(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

let pendingTicket: string | null = null;
export function setDownloadTicket(ticket: string): void {
  pendingTicket = ticket;
}
export function takeDownloadTicket(): string | null {
  const t = pendingTicket;
  pendingTicket = null;
  return t;
}
