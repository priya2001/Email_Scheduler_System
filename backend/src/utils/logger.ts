import { environment } from '../config/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private currentLogLevel: number;

  constructor() {
    this.currentLogLevel = LOG_LEVELS[environment.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }

    return `${prefix} ${message}`;
  }

  debug(message: string, data?: unknown): void {
    if (LOG_LEVELS.debug >= this.currentLogLevel) {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (LOG_LEVELS.info >= this.currentLogLevel) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (LOG_LEVELS.warn >= this.currentLogLevel) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, error?: Error | unknown): void {
    if (LOG_LEVELS.error >= this.currentLogLevel) {
      const errorData = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error;

      console.error(this.formatMessage('error', message, errorData));
    }
  }
}

export const logger = new Logger();
