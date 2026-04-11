import { Router, Request, Response } from 'express';
import { advanceByPixels } from '../services/scroll-printer.service';
import { getQueueLength } from '../services/printer.service';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { deltaY } = req.body;

  if (typeof deltaY !== 'number') {
    res.status(400).json({ error: 'deltaY must be a number' });
    return;
  }

  advanceByPixels(deltaY);

  res.json({
    ok: true,
    queued: true,
    queueLength: getQueueLength(),
  });
});

export default router;
