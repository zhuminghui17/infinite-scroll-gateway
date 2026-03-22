const printerIp = process.env.PRINTER_IP ?? '192.168.1.100';
const printerPort = process.env.PRINTER_PORT ?? '9100';

export const config = {
  printerIp,
  printerPort: Number(printerPort),
  printerInterface: process.env.PRINTER_INTERFACE ?? `tcp://${printerIp}:${printerPort}`,
  serverPort: Number(process.env.SERVER_PORT ?? 3000),
  mockPrinter: process.env.MOCK_PRINTER === 'true',
};
