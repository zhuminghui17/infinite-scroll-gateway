import { Router, Request, Response } from 'express';
import { advanceByCm, advanceByPixels } from '../services/scroll-printer.service';
import { getQueueLength } from '../services/printer.service';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { deltaY, deltaCm } = req.body as { deltaY?: unknown; deltaCm?: unknown };

  const cm = typeof deltaCm === 'number' && Number.isFinite(deltaCm) ? deltaCm : null;

  if (cm !== null && cm > 0) {
    advanceByCm(cm);
  } else {
    if (typeof deltaY !== 'number') {
      res.status(400).json({ error: 'deltaY must be a number when deltaCm is omitted' });
      return;
    }
    advanceByPixels(deltaY);
  }

  res.json({
    ok: true,
    queued: true,
    queueLength: getQueueLength(),
  });
});

export default router;
