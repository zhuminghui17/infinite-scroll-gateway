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
  scrollDepthCm: number,
): string[] {
  if (typeof scrollDepthCm !== 'number' || !Number.isFinite(scrollDepthCm)) {
    throw new Error('scrollDepthCm must be a finite number (from client; device-calibrated)');
  }
  const raw = fs.readFileSync(path.join(CONTENTS_DIR, 'summary.txt'), 'utf-8');
  const scrollDepthCmStr = scrollDepthCm.toFixed(1);
  const timeSec = Math.round(durationMs / 1000);
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const filled = raw
    .replace(/\{\{SCROLL_DEPTH_CM\}\}/g, scrollDepthCmStr)
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
  scrollDepthCm: number,
): Promise<void> {
  await printLines(loadContentLines('end.txt'));
  await printLines(buildSummaryLines(totalDistance, signalCount, durationMs, scrollDepthCm), { cut: true });
}

export interface TestPrintFullOptions {
  repeatCount?: number;
  totalDistance?: number;
  durationMs?: number;
  /** Sample depth for demo print only (app sends real device-calibrated cm). */
  scrollDepthCm?: number;
}

/** Prints start → repeat (×repeatCount) → end → summary with coherent sample stats. */
export async function testPrintFullSession(options: TestPrintFullOptions = {}): Promise<void> {
  const repeatCount = Math.max(0, options.repeatCount ?? 1);
  const totalDistance = options.totalDistance ?? 8000;
  const durationMs = options.durationMs ?? 60_000;
  const signalCount = 1 + repeatCount;
  const scrollDepthCm = options.scrollDepthCm ?? 120;

  await printLines(loadContentLines('start.txt'));
  for (let i = 0; i < repeatCount; i++) {
    await printLines(loadContentLines('repeat.txt'));
  }
  await printSessionEndReceipt(totalDistance, signalCount, durationMs, scrollDepthCm);
}
