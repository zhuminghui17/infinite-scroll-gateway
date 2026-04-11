import { Router, Request, Response } from 'express';
import { getSession, resetSession } from '../services/session.service';
import { printSessionEndReceipt } from '../services/content.service';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const session = getSession();
  res.json({
    totalDistance: session.totalDistance,
    signalCount: session.signalCount,
    lastSignalAt: session.lastSignalAt,
    startedAt: session.startedAt,
  });
});

router.post('/reset', async (_req: Request, res: Response) => {
  try {
    const previous = resetSession();
    const durationMs = (previous.lastSignalAt ?? Date.now()) - previous.startedAt;
    await printSessionEndReceipt(previous.totalDistance, previous.signalCount, durationMs);
    res.json({
      ok: true,
      previous: {
        totalDistance: previous.totalDistance,
        signalCount: previous.signalCount,
        durationMs,
      },
    });
  } catch (err) {
    console.error('Session reset error:', err);
    res.status(500).json({ error: 'Session reset failed' });
  }
});

export default router;
