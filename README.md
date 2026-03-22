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

## Deployment

### Phase 1 — Development & First Exhibition (Mac + iPhone Hotspot)

One phone does everything. No routers, no venue Wi-Fi, no extra hardware needed.

```
iPhone
  ├── Cellular (4G/5G) ──► Internet (browse social media, generate scrolls)
  ├── Opens Wi-Fi Hotspot
  ├── Sends scroll signals via hotspot ──► Mac (gateway) ──ETH/USB──► Printer
  └── Mac + Printer both connect to the same hotspot
```

**Hardware:**
- MacBook (runs the gateway)
- Thermal printer with Ethernet port (e.g. VRETTI M817) — connected to Mac via Ethernet cable
- USB-C to Ethernet adapter (~$15) if MacBook has no Ethernet port

**Printer connection options (set in `.env`):**

```env
# Ethernet (recommended — no driver needed)
PRINTER_INTERFACE=tcp://192.168.1.100:9100

# USB (printer plugged directly into Mac — requires printer driver from USB disk)
# PRINTER_INTERFACE=printer:auto
```

**Steps:**

1. iPhone: Settings → Personal Hotspot → Allow Others to Join → on
2. Connect Mac to the iPhone hotspot Wi-Fi
3. Connect printer to Mac via Ethernet cable (or USB)
4. Print a self-test page (hold Feed button on power-on) to find the printer's IP
5. Update `.env` with the printer IP, start the gateway:
   ```bash
   npm run dev
   ```
6. Find Mac's hotspot IP: System Settings → Wi-Fi → Details
7. Point the Expo app to `http://<mac-ip>:3000`

**Why this works at school/venues:**
- No dependency on venue Wi-Fi or AP Isolation
- iPhone browses real internet via cellular, hosts the local network
- Printer talks directly to Mac over a cable — no Wi-Fi needed for the printer
- Entire setup: one phone + one Mac + one printer + two power outlets

---

### Phase 2 — Permanent Installation (Raspberry Pi + Cloud DB)

Fully autonomous setup. No Mac needed. Phone and printer can be anywhere.

```
iPhone ──4G/5G──► Firebase Realtime DB
                        │
                  Pi listens (WebSocket)
                        │
              Pi (gateway) ──USB──► Printer
```

**Hardware:**
- Raspberry Pi 4 (~$55) running the gateway 24/7
- USB thermal printer plugged into Pi
- Pi connects to Wi-Fi, Pi stays on-site with the printer

**Why this is better for long-term:**
- No Mac needs to be left running
- iPhone user can be anywhere — scrolls from home, printer outputs in gallery
- Multiple phones can contribute scroll data simultaneously
- Pi boots automatically on power, no manual intervention

**Stack addition needed:**
- Firebase Realtime DB (free tier) for scroll event relay
- Pi-side listener replaces the HTTP `/scroll` endpoint

> This phase is not yet implemented. The current gateway uses HTTP POST. Cloud DB integration will be added as a future module without changing the existing code structure.

#### Phase 2 Implementation Plan (Supabase)

**1. Supabase setup**
- Create a free project at [supabase.com](https://supabase.com)
- Create a `scroll_events` table:
  ```sql
  create table scroll_events (
    id bigint generated always as identity primary key,
    delta_y float not null,
    scroll_y float,
    url text,
    inserted_at timestamptz default now()
  );
  ```
- Enable Realtime on the table: Table Editor → `scroll_events` → Realtime on

**2. Mobile app (`scroll-tracker-browser`)**
- Install `@supabase/supabase-js`
- On each scroll event, insert a row instead of (or in addition to) HTTP POST:
  ```ts
  await supabase.from('scroll_events').insert({ delta_y: deltaY, scroll_y: scrollY, url })
  ```

**3. Gateway on Pi (`infinite-scroll-gateway`)**
- Install `@supabase/supabase-js`
- Add `src/listeners/supabase.ts` — subscribes to new inserts, calls `printScrollLine`:
  ```ts
  supabase.channel('scrolls')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scroll_events' },
      (payload) => printScrollLine(payload.new.delta_y))
    .subscribe()
  ```
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env`
- Import the listener in `src/index.ts` alongside the existing HTTP server

**The HTTP `/scroll` endpoint stays intact** — Phase 1 and Phase 2 can run simultaneously.

---

## Printer Requirements

- ESC/POS-compatible thermal printer (Epson, Rongta, etc.)
- Connected to the same local network as the gateway
- Raw TCP printing enabled on port 9100

## Notes

- The mobile app (`scroll-tracker-browser`) does not yet POST to this gateway. A `fetch` call sending `ScrollEvent` JSON to `http://<gateway-ip>:3000/scroll` needs to be added to `BrowserView.tsx` in that project.
- Printer type defaults to `EPSON`. Change `PrinterTypes.EPSON` in `src/services/printer.ts` if using a Star printer.
