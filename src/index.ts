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

app.listen(config.serverPort, () => {
  console.log(`Gateway listening on port ${config.serverPort}`);
  console.log(`Printer: tcp://${config.printerIp}:${config.printerPort}`);
});
