import { Router, Request, Response } from 'express';
import { printScrollLine } from '../services/printer';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { deltaY } = req.body as { deltaY: number };

  if (typeof deltaY !== 'number') {
    res.status(400).json({ error: 'deltaY must be a number' });
    return;
  }

  try {
    await printScrollLine(deltaY);
    res.json({ ok: true });
  } catch (err) {
    console.error('Print error:', err);
    res.status(500).json({ error: 'Print failed' });
  }
});

export default router;
