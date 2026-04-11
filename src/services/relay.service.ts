import WebSocket from 'ws';
import { config } from '../config';
import { printLines, enqueue, getQueueLength, isPrinterOnline } from './printer.service';
import { loadContentLines, printSessionEndReceipt } from './content.service';

const startLines = loadContentLines('start.txt');
const repeatLines = loadContentLines('repeat.txt');

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const RECONNECT_DELAY = 5000;

function enqueueLiveScrollPrint(signalCount: number): void {
  const lines = signalCount === 1 ? startLines : repeatLines;
  enqueue(() => printLines(lines));
}

async function handleRequest(requestId: string, action: string, payload: any): Promise<any> {
  try {
    switch (action) {
      case 'scroll': {
        const { signalCount } = payload;
        if (typeof signalCount !== 'number' || signalCount < 1) {
          return { error: 'signalCount must be a positive number' };
        }
        enqueueLiveScrollPrint(signalCount);
        return { ok: true, queued: true, queueLength: getQueueLength() };
      }

      case 'session/end': {
        const { totalDistance, signalCount, durationMs } = payload;
        if (typeof totalDistance !== 'number' || typeof signalCount !== 'number' || typeof durationMs !== 'number') {
          return { error: 'totalDistance, signalCount, and durationMs must be numbers' };
        }
        await printSessionEndReceipt(totalDistance, signalCount, durationMs);
        return { ok: true, totalDistance, signalCount, durationMs };
      }

      case 'health': {
        const online = await isPrinterOnline();
        return { ok: true, printerOnline: online };
      }

      case 'print/test': {
        const repeatCount = payload?.repeatCount ?? 1;
        const { testPrintFullSession } = await import('./content.service');
        await testPrintFullSession({ repeatCount });
        return { ok: true };
      }

      default:
        return { error: `Unknown action: ${action}` };
    }
  } catch (err: any) {
    console.error(`[relay] Error handling ${action}:`, err);
    return { error: err.message };
  }
}

function connect(): void {
  if (!config.relayUrl) {
    console.error('[relay] No RELAY_URL configured');
    return;
  }

  const wsUrl = config.relayUrl.replace(/^http/, 'ws') + '/gateway?type=printer';
  console.log(`[relay] Connecting to ${wsUrl}`);

  ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('[relay] Connected to relay server');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'connected') {
        console.log(`[relay] Registered as printer: ${message.id}`);
      } else if (message.type === 'pong') {
        // Heartbeat response
      } else if (message.type === 'request') {
        const { requestId, action, payload } = message;
        const result = await handleRequest(requestId, action, payload);
        
        ws?.send(JSON.stringify({
          type: 'response',
          requestId,
          data: result,
        }));
      }
    } catch (err) {
      console.error('[relay] Failed to parse message:', err);
    }
  });

  ws.on('close', () => {
    console.log('[relay] Disconnected from relay server');
    ws = null;
    scheduleReconnect();
  });

  ws.on('error', (err) => {
    console.error('[relay] WebSocket error:', err.message);
  });
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  
  console.log(`[relay] Reconnecting in ${RECONNECT_DELAY / 1000}s...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_DELAY);
}

let pingInterval: ReturnType<typeof setInterval> | null = null;

export function startRelayClient(): void {
  if (!config.useRelay || !config.relayUrl) {
    console.log('[relay] Relay mode disabled');
    return;
  }

  connect();

  pingInterval = setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000);
}

export function stopRelayClient(): void {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
}
