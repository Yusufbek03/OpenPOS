import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';

export interface PrintOptions {
  host: string;
  port: number;
  timeout?: number;
}

@Injectable()
export class TcpPrinterService {
  private readonly logger = new Logger(TcpPrinterService.name);

  async print(data: Buffer, options: PrintOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = options.timeout || 5000;
      let settled = false;

      const done = (success: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { socket.destroy(); } catch {}
        resolve(success);
      };

      const timer = setTimeout(() => {
        this.logger.warn(`Printer ${options.host}:${options.port} timeout`);
        done(false);
      }, timeout);

      socket.on('connect', () => {
        this.logger.log(`Connected to printer ${options.host}:${options.port}`);
        socket.write(data, () => {
          setTimeout(() => done(true), 500);
        });
      });

      socket.on('error', (err) => {
        this.logger.error(`Printer ${options.host}:${options.port} error: ${err.message}`);
        done(false);
      });

      socket.on('timeout', () => {
        this.logger.warn(`Printer ${options.host}:${options.port} socket timeout`);
        done(false);
      });

      socket.connect(options.port, options.host);
    });
  }

  async testConnection(options: PrintOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let settled = false;

      const done = (success: boolean) => {
        if (settled) return;
        settled = true;
        try { socket.destroy(); } catch {}
        resolve(success);
      };

      setTimeout(() => done(false), 3000);

      socket.on('connect', () => {
        this.logger.log(`Test connection to ${options.host}:${options.port} OK`);
        done(true);
      });

      socket.on('error', () => done(false));
      socket.connect(options.port, options.host);
    });
  }
}
