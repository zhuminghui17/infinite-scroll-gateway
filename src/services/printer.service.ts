import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';
import { config } from '../config';

const printer = config.mockPrinter
  ? null
  : new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: config.printerInterface,
      characterSet: CharacterSet.PC437_USA,
      width: 48,
      options: { timeout: 5000 },
    });

const queue: (() => Promise<void>)[] = [];
let draining = false;

async function drain(): Promise<void> {
  if (draining) return;
  draining = true;
  while (queue.length > 0) {
    const job = queue.shift()!;
    try {
      await job();
    } catch (err) {
      console.error('[printer queue] job failed:', err);
    }
  }
  draining = false;
}

export function enqueue(job: () => Promise<void>): void {
  queue.push(job);
  drain();
}

export function getQueueLength(): number {
  return queue.length;
}

export interface PrintOptions {
  cut?: boolean;
}

export async function printLines(lines: string[], options: PrintOptions = {}): Promise<void> {
  const { cut = false } = options;

  if (!printer) {
    lines.forEach(l => console.log(`[mock] ${l}`));
    if (cut) console.log('[mock] --- cut ---');
    return;
  }

  printer.alignLeft();
  for (const line of lines) {
    printer.println(line);
  }
  if (cut) {
    printer.newLine();
    printer.cut();
  }
  await printer.execute();
  printer.clear();
}
