import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';
import { config } from '../config';

const printer = config.mockPrinter
  ? null
  : new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: config.printerInterface,
      width: 48,
      options: { timeout: 5000 },
    });

export async function printScrollLine(deltaY: number): Promise<void> {
  const chars = Math.min(Math.ceil(Math.abs(deltaY) / 10), 48);
  const line = '·'.repeat(chars);

  if (!printer) {
    console.log(`[mock printer] deltaY=${deltaY} → "${line}"`);
    return;
  }

  printer.println(line);
  await printer.execute();
  printer.clear();
}

export async function printText(text: string): Promise<void> {
  if (!printer) {
    console.log(`[mock printer] text → "${text}"`);
    return;
  }

  printer.alignCenter();
  printer.println(text);
  printer.cut();
  await printer.execute();
  printer.clear();
}

const DEFAULT_TEST_MESSAGE = 'test print';

export async function testPrint(text: string = DEFAULT_TEST_MESSAGE): Promise<void> {
  await printText(text);
}

export async function printLines(lines: string[]): Promise<void> {
  if (!printer) {
    lines.forEach(l => console.log(`[mock printer] ${l}`));
    return;
  }

  printer.alignLeft();
  for (const line of lines) {
    printer.println(line);
  }
  printer.newLine();
  printer.cut();
  await printer.execute();
  printer.clear();
}

export async function printArt(lines: string[]): Promise<void> {
  if (!printer) {
    lines.forEach(l => console.log(`[mock printer] ${l}`));
    return;
  }

  printer.alignLeft();
  for (const line of lines) {
    printer.println(line);
  }
  await printer.execute();
  printer.clear();
}

export async function printImage(imagePath: string): Promise<void> {
  if (!printer) {
    console.log(`[mock printer] image → "${imagePath}"`);
    return;
  }

  printer.alignCenter();
  await printer.printImage(imagePath);
  printer.newLine();
  printer.cut();
  await printer.execute();
  printer.clear();
}
