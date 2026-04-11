import { Router, Request, Response } from 'express';
import { printLines, enqueue, getQueueLength } from '../services/printer.service';
import { resetIdleTimer } from '../services/session.service';
import { loadContentLines } from '../services/content.service';

const router = Router();

const startLines = loadContentLines('start.txt');
const repeatLines = loadContentLines('repeat.txt');

interface ScrollRequest {
  deltaY: number;
  totalDistance: number;
  signalCount: number;
  startedAt: number;
}

function enqueueLiveScrollPrint(signalCount: number): void {
  const lines = signalCount === 1 ? startLines : repeatLines;
  enqueue(() => printLines(lines));
}

router.post('/', async (req: Request, res: Response) => {
  const { deltaY, totalDistance, signalCount, startedAt } = req.body as ScrollRequest;

  if (typeof deltaY !== 'number') {
    res.status(400).json({ error: 'deltaY must be a number' });
    return;
  }

  if (typeof signalCount !== 'number' || signalCount < 1) {
    res.status(400).json({ error: 'signalCount must be a positive number' });
    return;
  }

  resetIdleTimer({ totalDistance, signalCount, startedAt });
  enqueueLiveScrollPrint(signalCount);
  
  res.json({
    ok: true,
    queued: true,
    queueLength: getQueueLength(),
  });
});

export default router;
