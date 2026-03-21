# infinite-scroll-gateway

A lightweight Node.js/TypeScript gateway that receives scroll signals from the Expo app and drives a thermal printer via TCP (ESC/POS).

## Setup

```bash
npm install
```

## Configuration

Set environment variables before starting (or rely on the defaults):

| Variable       | Default         | Description                        |
|----------------|-----------------|------------------------------------|
| `PRINTER_IP`   | `192.168.1.100` | Thermal printer IP address         |
| `PRINTER_PORT` | `9100`          | Thermal printer TCP port (ESC/POS) |
| `SERVER_PORT`  | `3000`          | HTTP port the gateway listens on   |

Example:

```bash
PRINTER_IP=192.168.0.55 npm run dev
```

## Run

Development (ts-node):

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

## API

### `POST /scroll`

Receives a scroll event and prints a proportional line on the thermal printer.

**Body** (JSON):

```json
{
  "type": "scroll",
  "deltaY": 42,
  "scrollY": 1200,
  "timestamp": 1711000000000,
  "url": "https://example.com"
}
```

Only `deltaY` (number) is required. The absolute value is mapped to a line of characters proportional to the scroll distance (1 char per 10 px, capped at 48).

**Response** `200`:

```json
{ "ok": true }
```

### `GET /health`

Returns `{ "ok": true }` — useful for checking the gateway is reachable.

## Printer Requirements

- ESC/POS-compatible thermal printer (Epson, Rongta, etc.)
- Connected to the same local network as the gateway
- Raw TCP printing enabled on port 9100

## Notes

- The mobile app (`scroll-tracker-browser`) does not yet POST to this gateway. A `fetch` call sending `ScrollEvent` JSON to `http://<gateway-ip>:3000/scroll` needs to be added to `BrowserView.tsx` in that project.
- Printer type defaults to `EPSON`. Change `PrinterTypes.EPSON` in `src/services/printer.ts` if using a Star printer.
