export const config = {
  printerIp: process.env.PRINTER_IP ?? '192.168.1.100',
  printerPort: Number(process.env.PRINTER_PORT ?? 9100),
  serverPort: Number(process.env.SERVER_PORT ?? 3000),
  mockPrinter: process.env.MOCK_PRINTER === 'true',
};
