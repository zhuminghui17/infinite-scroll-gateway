import WebSocket from 'ws';
import { config } from '../config';
import { getQueueLength, isPrinterOnline } from './printer.service';
import { printSessionEndReceipt } from './content.service';
import { advanceByPixels, resetPrintState } from './scroll-printer.service';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const RECONNECT_DELAY = 5000;

async function handleRequest(requestId: string, action: string, payload: any): Promise<any> {
  try {
    switch (action) {
      case 'scroll': {
        const { deltaY } = payload;
        if (typeof deltaY !== 'number') {
          return { error: 'deltaY must be a number' };
        }
        advanceByPixels(deltaY);
        return { ok: true, queued: true, queueLength: getQueueLength() };
      }

      case 'session/end': {
        const { totalDistance, signalCount, durationMs, scrollDepthCm, accumulatedDistanceCm, scrollTouchCount } =
          payload;
        if (typeof totalDistance !== 'number' || typeof signalCount !== 'number' || typeof durationMs !== 'number') {
          return { error: 'totalDistance, signalCount, and durationMs must be numbers' };
        }
        if (typeof scrollDepthCm !== 'number' || !Number.isFinite(scrollDepthCm)) {
          return { error: 'scrollDepthCm must be a finite number (device-calibrated cm from client)' };
        }
        const accumulated =
          typeof accumulatedDistanceCm === 'number' && Number.isFinite(accumulatedDistanceCm) && accumulatedDistanceCm >= 0
            ? accumulatedDistanceCm
            : scrollDepthCm;
        const touches =
          typeof scrollTouchCount === 'number' && Number.isFinite(scrollTouchCount) && scrollTouchCount >= 0
            ? scrollTouchCount
            : signalCount;
        await printSessionEndReceipt(durationMs, scrollDepthCm, touches, accumulated);
        resetPrintState();
        return {
          ok: true,
          totalDistance,
          signalCount,
          durationMs,
          scrollDepthCm,
          accumulatedDistanceCm: accumulated,
          scrollTouchCount: touches,
        };
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
