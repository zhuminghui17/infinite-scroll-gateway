import * as fs from 'fs';
import * as path from 'path';
import { printLines } from './printer.service';

const CONTENTS_DIR = path.join(__dirname, '..', '..', 'contents');

export function loadContentLines(filename: string): string[] {
  const filePath = path.join(CONTENTS_DIR, filename);
  return fs.readFileSync(filePath, 'utf-8').split('\n');
}

export function buildSummaryLines(
  totalDistance: number,
  signalCount: number,
  durationMs: number,
): string[] {
  const raw = fs.readFileSync(path.join(CONTENTS_DIR, 'summary.txt'), 'utf-8');
  const scrollDepthCm = (totalDistance * 2.54 / 96).toFixed(1);
  const timeSec = Math.round(durationMs / 1000);
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const filled = raw
    .replace(/\{\{SCROLL_DEPTH_CM\}\}/g, scrollDepthCm)
    .replace(/\{\{TIME_ELAPSED_SEC\}\}/g, String(timeSec))
    .replace(/\{\{TOTAL_DISTANCE_PX\}\}/g, String(Math.round(totalDistance)))
    .replace(/\{\{SIGNAL_COUNT\}\}/g, String(signalCount))
    .replace(/\{\{DATE\}\}/g, date);
  return filled.split('\n');
}

export async function printSessionEndReceipt(
  totalDistance: number,
  signalCount: number,
  durationMs: number,
): Promise<void> {
  await printLines(loadContentLines('end.txt'));
  await printLines(buildSummaryLines(totalDistance, signalCount, durationMs), { cut: true });
}

export interface TestPrintFullOptions {
  repeatCount?: number;
  totalDistance?: number;
  durationMs?: number;
}

/** Prints start → repeat (×repeatCount) → end → summary with coherent sample stats. */
export async function testPrintFullSession(options: TestPrintFullOptions = {}): Promise<void> {
  const repeatCount = Math.max(0, options.repeatCount ?? 1);
  const totalDistance = options.totalDistance ?? 8000;
  const durationMs = options.durationMs ?? 60_000;
  const signalCount = 1 + repeatCount;

  await printLines(loadContentLines('start.txt'));
  for (let i = 0; i < repeatCount; i++) {
    await printLines(loadContentLines('repeat.txt'));
  }
  await printSessionEndReceipt(totalDistance, signalCount, durationMs);
}
