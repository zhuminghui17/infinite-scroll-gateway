import { Router, Request, Response } from 'express';
import { clearSession, hasActiveSession } from '../services/session.service';
import { printSessionEndReceipt } from '../services/content.service';

const router = Router();

interface EndSessionRequest {
  totalDistance: number;
  signalCount: number;
  durationMs: number;
}

router.get('/', (_req: Request, res: Response) => {
  res.json({
    hasActiveSession: hasActiveSession(),
  });
});

router.post('/end', async (req: Request, res: Response) => {
  const { totalDistance, signalCount, durationMs } = req.body as EndSessionRequest;

  if (typeof totalDistance !== 'number' || typeof signalCount !== 'number' || typeof durationMs !== 'number') {
    res.status(400).json({ error: 'totalDistance, signalCount, and durationMs must be numbers' });
    return;
  }

  try {
    clearSession();
    await printSessionEndReceipt(totalDistance, signalCount, durationMs);
    res.json({
      ok: true,
      totalDistance,
      signalCount,
      durationMs,
    });
  } catch (err) {
    console.error('Session end error:', err);
    res.status(500).json({ error: 'Session end failed' });
  }
});

export default router;
