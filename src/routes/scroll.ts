import { Router, Request, Response } from 'express';
import { printArt } from '../services/printer';
import { updateSession } from '../services/session';
import { loadContentLines } from '../services/content';

const router = Router();

const startLines = loadContentLines('start.txt');
const repeatLines = loadContentLines('repeat.txt');

async function printLiveScrollPhase(sessionAfterUpdate: { signalCount: number }): Promise<'start' | 'repeat'> {
  if (sessionAfterUpdate.signalCount === 1) {
    await printArt(startLines);
    return 'start';
  }
  await printArt(repeatLines);
  return 'repeat';
}

router.post('/', async (req: Request, res: Response) => {
  const { deltaY } = req.body as { deltaY: number };

  if (typeof deltaY !== 'number') {
    res.status(400).json({ error: 'deltaY must be a number' });
    return;
  }

  try {
    const session = updateSession(Math.abs(deltaY));
    const phase = await printLiveScrollPhase(session);
    res.json({ ok: true, totalDistance: session.totalDistance, signalCount: session.signalCount, phase });
  } catch (err) {
    console.error('Print error:', err);
    res.status(500).json({ error: 'Print failed' });
  }
});

router.post('/signal', async (req: Request, res: Response) => {
  const { distance } = req.body as { distance: number };

  if (typeof distance !== 'number') {
    res.status(400).json({ error: 'distance must be a number' });
    return;
  }

  try {
    const session = updateSession(distance);
    const phase = await printLiveScrollPhase(session);

    res.json({
      ok: true,
      totalDistance: session.totalDistance,
      signalCount: session.signalCount,
      phase,
    });
  } catch (err) {
    console.error('Signal error:', err);
    res.status(500).json({ error: 'Signal processing failed' });
  }
});

export default router;
