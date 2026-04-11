import { Router, Request, Response } from 'express';
import { printLines } from '../services/printer';
import { loadContentLines } from '../services/content';

const router = Router();

/**
 * POST /print-file
 * Body: { "path": "start.txt" }
 * Files available: start.txt, repeat.txt, end.txt, summary.txt
 */
router.post('/print-file', async (req: Request, res: Response) => {
  const { path: filePath } = req.body as { path?: string };
  if (!filePath) {
    res.status(400).json({ error: 'path is required' });
    return;
  }
  try {
    const lines = loadContentLines(filePath);
    await printLines(lines, { cut: true });
    res.json({ ok: true });
  } catch (err) {
    console.error('Print file error:', err);
    res.status(500).json({ error: 'Print failed' });
  }
});

export default router;
