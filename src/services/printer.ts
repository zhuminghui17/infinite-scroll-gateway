import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';
import { config } from '../config';

const printer = config.mockPrinter
  ? null
  : new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${config.printerIp}:${config.printerPort}`,
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
