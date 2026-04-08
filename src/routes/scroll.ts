import { Router, Request, Response } from 'express';
import { printArt, enqueue, getQueueLength } from '../services/printer';
import { updateSession } from '../services/session';
import { loadContentLines } from '../services/content';

const router = Router();

const startLines = loadContentLines('start.txt');
const repeatLines = loadContentLines('repeat.txt');

function enqueueLiveScrollPrint(signalCount: number): void {
  const lines = signalCount === 1 ? startLines : repeatLines;
  enqueue(() => printArt(lines));
}

router.post('/', async (req: Request, res: Response) => {
  const { deltaY } = req.body as { deltaY: number };

  if (typeof deltaY !== 'number') {
    res.status(400).json({ error: 'deltaY must be a number' });
    return;
  }

  const session = updateSession(Math.abs(deltaY));
  enqueueLiveScrollPrint(session.signalCount);
  res.json({
    ok: true,
    queued: true,
    totalDistance: session.totalDistance,
    signalCount: session.signalCount,
    queueLength: getQueueLength(),
  });
});

router.post('/signal', async (req: Request, res: Response) => {
  const { distance } = req.body as { distance: number };

  if (typeof distance !== 'number') {
    res.status(400).json({ error: 'distance must be a number' });
    return;
  }

  const session = updateSession(distance);
  enqueueLiveScrollPrint(session.signalCount);
  res.json({
    ok: true,
    queued: true,
    totalDistance: session.totalDistance,
    signalCount: session.signalCount,
    queueLength: getQueueLength(),
  });
});

export default router;
