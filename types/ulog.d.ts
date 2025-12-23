declare module "ulog" {
  interface Logger {
    (...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    log(...args: any[]): void;
    debug(...args: any[]): void;
    trace(...args: any[]): void;
    level: number;
  }

  interface UlogLevels {
    error: number;
    warn: number;
    info: number;
    log: number;
    debug: number;
    trace: number;
  }

  interface Ulog {
    (name: string): Logger;
    levels: UlogLevels;
    level: number;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    log(...args: any[]): void;
    debug(...args: any[]): void;
    trace(...args: any[]): void;
  }

  const ulog: Ulog;
  export default ulog;
  export = ulog;
}
