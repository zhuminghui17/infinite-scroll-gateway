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
  /** App-wide total scroll distance in cm (Scroll Stats aggregate); defaults to scrollDepthCm if omitted. */
  accumulatedDistanceCm?: number;
  /** Thumb/scroll touch events; defaults to signalCount if omitted. */
  scrollTouchCount?: number;
}

router.post('/end', async (req: Request, res: Response) => {
  const { totalDistance, signalCount, durationMs, scrollDepthCm, accumulatedDistanceCm, scrollTouchCount } =
    req.body as EndSessionRequest;

  if (typeof totalDistance !== 'number' || typeof signalCount !== 'number' || typeof durationMs !== 'number') {
    res.status(400).json({ error: 'totalDistance, signalCount, and durationMs must be numbers' });
    return;
  }

  if (typeof scrollDepthCm !== 'number' || !Number.isFinite(scrollDepthCm)) {
    res.status(400).json({ error: 'scrollDepthCm must be a finite number (device-calibrated cm from client)' });
    return;
  }

  const accumulated =
    typeof accumulatedDistanceCm === 'number' && Number.isFinite(accumulatedDistanceCm) && accumulatedDistanceCm >= 0
      ? accumulatedDistanceCm
      : scrollDepthCm;

  const touches =
    typeof scrollTouchCount === 'number' && Number.isFinite(scrollTouchCount) && scrollTouchCount >= 0
      ? scrollTouchCount
      : signalCount;

  try {
    await printSessionEndReceipt(durationMs, scrollDepthCm, touches, accumulated);
    resetPrintState();
    res.json({
      ok: true,
      totalDistance,
      signalCount,
      durationMs,
      scrollDepthCm,
      accumulatedDistanceCm: accumulated,
      scrollTouchCount: touches,
    });
  } catch (err) {
    console.error('Session end error:', err);
    res.status(500).json({ error: 'Session end failed' });
  }
});

export default router;
