import { Router, Request, Response } from 'express';
import { printSessionEndReceipt } from '../services/content.service';
import { resetPrintState } from '../services/scroll-printer.service';

const router = Router();

interface EndSessionRequest {
  totalDistance: number;
  signalCount: number;
  durationMs: number;
  /** Physical scroll depth in cm — must be computed on the client (device PPI); used as sole source for receipt. */
  scrollDepthCm: number;
}

router.post('/end', async (req: Request, res: Response) => {
  const { totalDistance, signalCount, durationMs, scrollDepthCm } = req.body as EndSessionRequest;

  if (typeof totalDistance !== 'number' || typeof signalCount !== 'number' || typeof durationMs !== 'number') {
    res.status(400).json({ error: 'totalDistance, signalCount, and durationMs must be numbers' });
    return;
  }

  if (typeof scrollDepthCm !== 'number' || !Number.isFinite(scrollDepthCm)) {
    res.status(400).json({ error: 'scrollDepthCm must be a finite number (device-calibrated cm from client)' });
    return;
  }

  try {
    await printSessionEndReceipt(totalDistance, signalCount, durationMs, scrollDepthCm);
    resetPrintState();
    res.json({ ok: true, totalDistance, signalCount, durationMs, scrollDepthCm });
  } catch (err) {
    console.error('Session end error:', err);
    res.status(500).json({ error: 'Session end failed' });
  }
});

export default router;
