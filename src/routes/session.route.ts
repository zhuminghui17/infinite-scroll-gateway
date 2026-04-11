import { Router, Request, Response } from 'express';
import { printSessionEndReceipt } from '../services/content.service';
import { resetPrintState } from '../services/scroll-printer.service';

const router = Router();

interface EndSessionRequest {
  totalDistance: number;
  signalCount: number;
  durationMs: number;
}

router.post('/end', async (req: Request, res: Response) => {
  const { totalDistance, signalCount, durationMs } = req.body as EndSessionRequest;

  if (typeof totalDistance !== 'number' || typeof signalCount !== 'number' || typeof durationMs !== 'number') {
    res.status(400).json({ error: 'totalDistance, signalCount, and durationMs must be numbers' });
    return;
  }

  try {
    await printSessionEndReceipt(totalDistance, signalCount, durationMs);
    resetPrintState();
    res.json({ ok: true, totalDistance, signalCount, durationMs });
  } catch (err) {
    console.error('Session end error:', err);
    res.status(500).json({ error: 'Session end failed' });
  }
});

export default router;
