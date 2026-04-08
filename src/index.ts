import 'dotenv/config';
import express from 'express';
import { config } from './config';
import scrollRouter from './routes/scroll';
import { getSession, resetSession } from './services/session';
import { printSessionEndReceipt, testPrintFullSession } from './services/content';
import { testPrint } from './services/printer';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/scroll', scrollRouter);

app.get('/session', (_req, res) => {
  const session = getSession();
  res.json({
    totalDistance: session.totalDistance,
    signalCount: session.signalCount,
    lastSignalAt: session.lastSignalAt,
    startedAt: session.startedAt,
  });
});

app.post('/session/reset', async (_req, res) => {
  try {
    const previous = resetSession();
    const durationMs = (previous.lastSignalAt ?? Date.now()) - previous.startedAt;
    await printSessionEndReceipt(previous.totalDistance, previous.signalCount, durationMs);
    res.json({
      ok: true,
      previous: {
        totalDistance: previous.totalDistance,
        signalCount: previous.signalCount,
        durationMs,
      },
    });
  } catch (err) {
    console.error('Session reset error:', err);
    res.status(500).json({ error: 'Session reset failed' });
  }
});

app.post('/test-print', async (req, res) => {
  const { text } = req.body as { text?: string };
  try {
    await testPrint(text);
    res.json({ ok: true });
  } catch (err) {
    console.error('Print error:', err);
    res.status(500).json({ error: 'Print failed' });
  }
});

app.post('/test-print/full', async (req, res) => {
  const { repeatCount, totalDistance, durationMs } = req.body as {
    repeatCount?: number;
    totalDistance?: number;
    durationMs?: number;
  };
  try {
    await testPrintFullSession({ repeatCount, totalDistance, durationMs });
    res.json({ ok: true });
  } catch (err) {
    console.error('Full test print error:', err);
    res.status(500).json({ error: 'Full test print failed' });
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
