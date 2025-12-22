declare module "ulog" {
  interface Logger {
    (...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    log(...args: any[]): void;
    debug(...args: any[]): void;
    trace(...args: any[]): void;
  }

  function anylogger(name: string): Logger;

  export default anylogger;
}
