export interface SessionState {
  totalDistance: number;
  signalCount: number;
  lastSignalAt: number | null;
  startedAt: number;
}

let session: SessionState = createFreshSession();

function createFreshSession(): SessionState {
  return {
    totalDistance: 0,
    signalCount: 0,
    lastSignalAt: null,
    startedAt: Date.now(),
  };
}

export function updateSession(distance: number): SessionState {
  session.totalDistance += Math.abs(distance);
  session.signalCount += 1;
  session.lastSignalAt = Date.now();
  return session;
}

export function getSession(): SessionState {
  return session;
}

export function resetSession(): SessionState {
  const previous = { ...session };
  session = createFreshSession();
  return previous;
}
