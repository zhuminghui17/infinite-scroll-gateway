import 'dotenv/config';
import express from 'express';
import { config } from './config';
import scrollRouter from './routes/scroll';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/scroll', scrollRouter);

app.post('/test-print', async (req, res) => {
  const { text } = req.body as { text?: string };
  const { printText } = await import('./services/printer');
  try {
    await printText(text ?? 'test print');
    res.json({ ok: true });
  } catch (err) {
    console.error('Print error:', err);
    res.status(500).json({ error: 'Print failed' });
  }
});

app.post('/print-receipt', async (req, res) => {
  const { lines } = req.body as { lines: string[] };
  const { printLines } = await import('./services/printer');
  try {
    await printLines(lines);
    res.json({ ok: true });
  } catch (err) {
    console.error('Print error:', err);
    res.status(500).json({ error: 'Print failed' });
  }
});

app.post('/print-image', async (req, res) => {
  const { path: imagePath } = req.body as { path: string };
  if (!imagePath) {
    res.status(400).json({ error: 'path is required' });
    return;
  }
  const { printImage } = await import('./services/printer');
  try {
    await printImage(imagePath);
    res.json({ ok: true });
  } catch (err) {
    console.error('Print image error:', err);
    res.status(500).json({ error: 'Print failed' });
  }
});

app.listen(config.serverPort, () => {
  console.log(`Gateway listening on port ${config.serverPort}`);
  console.log(`Printer: tcp://${config.printerIp}:${config.printerPort}`);
});
