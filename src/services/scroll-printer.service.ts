import { enqueue } from './printer.service';
import { printLines } from './printer.service';
import { pickNewSessionContentSet } from './session-content';

// --- Tuning constants ---

// EPSON thermal printer: 30 dots line spacing at 203 DPI ≈ 3.75mm per line.
// Legacy path: map WebView deltaY (CSS px) to lines via PRINTER_LINE_HEIGHT_PX.
const PRINTER_LINE_HEIGHT_PX = 14;
const PRINTER_LINE_SPACING_MM = 3.75;

// Adjusts how much phone scrolling maps to printer output.
// 1.0 = 1:1 physical distance (scroll 3.75mm on phone → print 3.75mm on paper)
// 2.0 = half speed (scroll 7.5mm → print 3.75mm)
// 0.5 = double speed
const SCROLL_TO_PRINT_RATIO = 1.0;

const PIXELS_PER_LINE = Math.round(PRINTER_LINE_HEIGHT_PX * SCROLL_TO_PRINT_RATIO);
const CM_PER_PRINT_LINE = (PRINTER_LINE_SPACING_MM / 10) * SCROLL_TO_PRINT_RATIO;

// Safety cap: max lines printed per single scroll signal
const MAX_LINES_PER_BATCH = 20;

// --- Content (one of main/{cloud,money,surf} per session) ---

let startLines: string[] = [];
let repeatLines: string[] = [];

function applySessionLines(pick: { startLines: string[]; repeatLines: string[] }): void {
  startLines = pick.startLines;
  repeatLines = pick.repeatLines;
}

applySessionLines(pickNewSessionContentSet());

// --- State ---

let printCursor = 0;
let pixelAccumulator = 0;
let cmAccumulator = 0;

function getLineAtPosition(pos: number): string {
  if (pos < startLines.length) {
    return startLines[pos];
  }
  const offset = pos - startLines.length;
  return repeatLines[offset % repeatLines.length];
}

function enqueueLines(linesToPrint: number): void {
  if (linesToPrint === 0) return;
  linesToPrint = Math.min(linesToPrint, MAX_LINES_PER_BATCH);

  const lines: string[] = [];
  for (let i = 0; i < linesToPrint; i++) {
    lines.push(getLineAtPosition(printCursor + i));
  }
  printCursor += linesToPrint;

  enqueue(() => printLines(lines));
}

/** Scroll distance in cm (from client, same formula as receipt / Scroll Stats). */
export function advanceByCm(deltaCm: number): void {
  if (deltaCm <= 0 || !Number.isFinite(deltaCm)) return;

  cmAccumulator += deltaCm;
  let linesToPrint = Math.floor(cmAccumulator / CM_PER_PRINT_LINE);
  cmAccumulator -= linesToPrint * CM_PER_PRINT_LINE;

  enqueueLines(linesToPrint);
}

export function advanceByPixels(deltaY: number): void {
  if (deltaY <= 0) return;

  pixelAccumulator += deltaY;
  let linesToPrint = Math.floor(pixelAccumulator / PIXELS_PER_LINE);
  pixelAccumulator %= PIXELS_PER_LINE;

  enqueueLines(linesToPrint);
}

export function resetPrintState(): void {
  printCursor = 0;
  pixelAccumulator = 0;
  cmAccumulator = 0;
  applySessionLines(pickNewSessionContentSet());
}

export function getPrintState() {
  return {
    printCursor,
    pixelAccumulator,
    cmAccumulator,
    pixelsPerLine: PIXELS_PER_LINE,
    cmPerPrintLine: CM_PER_PRINT_LINE,
  };
}
