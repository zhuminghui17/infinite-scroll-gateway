import { enqueue } from './printer.service';
import { printLines } from './printer.service';
import { loadContentLines } from './content.service';

// --- Tuning constants ---

// EPSON thermal printer: 30 dots line spacing at 203 DPI ≈ 3.75mm per line.
// 1 CSS pixel ≈ 0.2646mm (1/96 inch).
// At ratio 1.0 → ~14 CSS px per printer line (true 1:1 physical distance).
const PRINTER_LINE_HEIGHT_PX = 14;

// Adjusts how much phone scrolling maps to printer output.
// 1.0 = 1:1 physical distance (scroll 3.75mm on phone → print 3.75mm on paper)
// 2.0 = half speed (scroll 7.5mm → print 3.75mm)
// 0.5 = double speed
const SCROLL_TO_PRINT_RATIO = 1.0;

const PIXELS_PER_LINE = Math.round(PRINTER_LINE_HEIGHT_PX * SCROLL_TO_PRINT_RATIO);

// Safety cap: max lines printed per single scroll signal
const MAX_LINES_PER_BATCH = 20;

// --- Content ---

const startLines = loadContentLines('start.txt');
const repeatLines = loadContentLines('repeat.txt');

// --- State ---

let printCursor = 0;
let pixelAccumulator = 0;

function getLineAtPosition(pos: number): string {
  if (pos < startLines.length) {
    return startLines[pos];
  }
  const offset = pos - startLines.length;
  return repeatLines[offset % repeatLines.length];
}

export function advanceByPixels(deltaY: number): void {
  if (deltaY <= 0) return;

  pixelAccumulator += deltaY;
  let linesToPrint = Math.floor(pixelAccumulator / PIXELS_PER_LINE);
  pixelAccumulator %= PIXELS_PER_LINE;

  if (linesToPrint === 0) return;
  linesToPrint = Math.min(linesToPrint, MAX_LINES_PER_BATCH);

  const lines: string[] = [];
  for (let i = 0; i < linesToPrint; i++) {
    lines.push(getLineAtPosition(printCursor + i));
  }
  printCursor += linesToPrint;

  enqueue(() => printLines(lines));
}

export function resetPrintState(): void {
  printCursor = 0;
  pixelAccumulator = 0;
}

export function getPrintState() {
  return { printCursor, pixelAccumulator, pixelsPerLine: PIXELS_PER_LINE };
}
