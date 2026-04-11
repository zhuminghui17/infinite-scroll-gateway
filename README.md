# infinite-scroll-gateway

A Node.js/TypeScript gateway that receives scroll events from the mobile app and drives a thermal printer via ESC/POS. Scrolling on your phone physically prints content — the further you scroll, the more it prints.

## How It Works

The gateway uses **distance-based proportional printing**. Instead of printing a fixed block per scroll event, it maps phone scroll distance to printer output 1:1:

- EPSON thermal printer line height ≈ 3.75mm (30 dots @ 203 DPI)
- 1 CSS pixel on phone ≈ 0.2646mm
- **~14px of phone scroll = 1 printed line**

Content is a virtual infinite roll: `start.txt` plays once, then `repeat.txt` loops forever. Session end prints `end.txt` + a statistics receipt.

The ratio is configurable via `SCROLL_TO_PRINT_RATIO` in `src/services/scroll-printer.service.ts`.

## Setup

```bash
npm install
cp .env.example .env   # edit with your printer IP
```

## Configuration

| Variable            | Default              | Description                                    |
|---------------------|----------------------|------------------------------------------------|
| `PRINTER_INTERFACE` | `tcp://<IP>:<PORT>`  | Printer connection string                      |
| `PRINTER_IP`        | `192.168.1.100`      | Printer IP (fallback if INTERFACE not set)      |
| `PRINTER_PORT`      | `9100`               | Printer TCP port                               |
| `SERVER_PORT`       | `3000`               | HTTP port the gateway listens on               |
| `MOCK_PRINTER`      | `false`              | `true` to log to console instead of printing   |
| `USE_RELAY`         | `false`              | `true` to connect to cloud relay via WebSocket |
| `RELAY_URL`         | —                    | Cloud relay server URL (e.g. Railway)          |

## Run

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

## Modes

### Direct Mode (default)

Phone → HTTP → Gateway → Printer

Phone and gateway must be on the same network.

### Relay Mode

Phone → Cloud Relay → WebSocket → Gateway → Printer

Phone and gateway can be on different networks. The gateway connects outbound to the relay server, so no port forwarding or static IP needed.

```env
USE_RELAY=true
RELAY_URL=https://your-relay.railway.app
```

## API

### `POST /scroll`

Send a scroll event. The gateway advances the print cursor proportionally.

```json
{ "deltaY": 280 }
```

- Only `deltaY` (number) is required
- Only downward scroll (positive deltaY) triggers printing
- Capped at 20 lines per batch

Response:

```json
{ "ok": true, "queued": true, "queueLength": 0 }
```

### `POST /session/end`

End the current session. Prints a closing graphic and statistics receipt, then resets the print cursor for the next session.

**SCROLL DEPTH on the receipt uses only `scrollDepthCm`** (computed on the phone with device PPI, same as Scroll Stats). The gateway does not convert pixels to cm.

```json
{
  "totalDistance": 12500,
  "signalCount": 42,
  "durationMs": 180000,
  "scrollDepthCm": 210.4
}
```

### `GET /health`

```json
{ "ok": true, "mode": "relay" }
```

### `POST /print-file`

Print a specific content file directly (for testing).

```json
{ "path": "start.txt" }
```

## Content Files

Located in `contents/`:

| File           | Purpose                                |
|----------------|----------------------------------------|
| `start.txt`    | Printed once at the start of a session |
| `repeat.txt`   | Loops infinitely as user scrolls       |
| `end.txt`      | Printed when session ends              |
| `summary.txt`  | Statistics receipt (templated)         |

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Mobile App │─────►│ Cloud Relay │─────►│   Gateway   │──► Printer
│  (Expo)     │ HTTP │ (Railway)   │  WS  │ (Mac / Pi)  │    ESC/POS
└─────────────┘      └─────────────┘      └─────────────┘
                           OR
┌─────────────┐      ┌─────────────┐
│  Mobile App │─────►│   Gateway   │──► Printer
│  (Expo)     │ HTTP │ (Mac / Pi)  │    ESC/POS
└─────────────┘      └─────────────┘
```

## Printer Requirements

- ESC/POS-compatible thermal printer (Epson, VRETTI, Rongta, etc.)
- Connected via Ethernet (TCP port 9100) or USB
- 80mm paper width (48 char columns)
