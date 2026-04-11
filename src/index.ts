import 'dotenv/config';
import express from 'express';
import { config } from './config';
import scrollRouter from './routes/scroll.route';
import sessionRouter from './routes/session.route';
import printRouter from './routes/print.route';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/scroll', scrollRouter);
app.use('/session', sessionRouter);
app.use(printRouter);

app.listen(config.serverPort, () => {
  console.log(`Gateway listening on port ${config.serverPort}`);
  console.log(`Printer: ${config.mockPrinter ? 'mock (console)' : config.printerInterface}`);
});
