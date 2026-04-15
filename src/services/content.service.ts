import * as fs from 'fs';
import * as path from 'path';
import { printLines } from './printer.service';
import { buildReceiptLines } from './receipt-builder';
import { getCurrentSessionMainSet, loadMainContentLines } from './session-content';
import { resetPrintState } from './scroll-printer.service';

const CONTENTS_DIR = path.join(__dirname, '..', '..', 'contents');

export function loadContentLines(filename: string): string[] {
  const filePath = path.join(CONTENTS_DIR, filename);
  return fs.readFileSync(filePath, 'utf-8').split('\n');
}

export async function printSessionEndReceipt(
  durationMs: number,
  scrollDepthCm: number,
  scrollTouches: number,
  accumulatedDistanceCm: number,
): Promise<void> {
  if (typeof scrollDepthCm !== 'number' || !Number.isFinite(scrollDepthCm)) {
    throw new Error('scrollDepthCm must be a finite number (from client; device-calibrated)');
  }
  if (typeof accumulatedDistanceCm !== 'number' || !Number.isFinite(accumulatedDistanceCm)) {
    throw new Error('accumulatedDistanceCm must be a finite number');
  }
  await printLines(loadMainContentLines(getCurrentSessionMainSet(), 'end.txt'));
  await printLines(
    buildReceiptLines({ scrollDepthCm, accumulatedDistanceCm, durationMs, scrollTouches }),
    { cut: true },
  );
}

export interface TestPrintFullOptions {
  repeatCount?: number;
  totalDistance?: number;
  durationMs?: number;
  /** Sample depth for demo print only (app sends real device-calibrated cm). */
  scrollDepthCm?: number;
  scrollTouches?: number;
}

/** Prints start → repeat (×repeatCount) → end → summary with coherent sample stats. */
export async function testPrintFullSession(options: TestPrintFullOptions = {}): Promise<void> {
  resetPrintState();
  const set = getCurrentSessionMainSet();
  const repeatCount = Math.max(0, options.repeatCount ?? 1);
  const durationMs = options.durationMs ?? 60_000;
  const signalCount = 1 + repeatCount;
  const scrollDepthCm = options.scrollDepthCm ?? 120;
  const scrollTouches = options.scrollTouches ?? signalCount * 12;

  await printLines(loadMainContentLines(set, 'start.txt'));
  for (let i = 0; i < repeatCount; i++) {
    await printLines(loadMainContentLines(set, 'repeat.txt'));
  }
  await printSessionEndReceipt(durationMs, scrollDepthCm, scrollTouches, scrollDepthCm);
}
