import { printSessionEndReceipt } from './content.service';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

let idleTimer: ReturnType<typeof setTimeout> | null = null;
let lastSessionData: { totalDistance: number; signalCount: number; startedAt: number } | null = null;

export function resetIdleTimer(sessionData: { totalDistance: number; signalCount: number; startedAt: number }): void {
  lastSessionData = sessionData;
  
  if (idleTimer) {
    clearTimeout(idleTimer);
  }
  
  idleTimer = setTimeout(async () => {
    if (lastSessionData && lastSessionData.signalCount > 0) {
      const durationMs = Date.now() - lastSessionData.startedAt;
      console.log('[session] Idle timeout - auto-ending session');
      await printSessionEndReceipt(
        lastSessionData.totalDistance,
        lastSessionData.signalCount,
        durationMs
      );
      lastSessionData = null;
    }
    idleTimer = null;
  }, IDLE_TIMEOUT_MS);
}

export function clearSession(): void {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  lastSessionData = null;
}

export function hasActiveSession(): boolean {
  return lastSessionData !== null && lastSessionData.signalCount > 0;
}
