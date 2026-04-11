import 'dotenv/config';
import express from 'express';
import { config } from './config';
import scrollRouter from './routes/scroll.route';
import sessionRouter from './routes/session.route';
import printRouter from './routes/print.route';
import { startRelayClient } from './services/relay.service';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, mode: config.useRelay ? 'relay' : 'direct' }));
app.use('/scroll', scrollRouter);
app.use('/session', sessionRouter);
app.use(printRouter);

if (config.useRelay) {
  console.log(`[gateway] Starting in RELAY mode`);
  console.log(`[gateway] Connecting to: ${config.relayUrl}`);
  startRelayClient();
} else {
  console.log(`[gateway] Starting in DIRECT mode`);
}

app.listen(config.serverPort, () => {
  console.log(`Gateway listening on port ${config.serverPort}`);
  console.log(`Printer: ${config.mockPrinter ? 'mock (console)' : config.printerInterface}`);
});
