type LogMethod = (...args: unknown[]) => void;

function isLocalRuntime(): boolean {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // localhost, 127.0.0.1, or custom local dev domains
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local")
    );
  }

  return process.env.NODE_ENV !== "production";
}

const shouldLog = (): boolean => {
  // Allow explicit opt-in via env variable even in production
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ENABLE_CLIENT_LOGS === "true") {
    return true;
  }
  return isLocalRuntime();
};

export function createLogger(namespace: string): {
  log: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
} {
  const enabled = shouldLog();

  const prefix = `[${namespace}]`;

  const wrap = (fn: LogMethod): LogMethod =>
    (...args) => {
      if (enabled) fn(prefix, ...args);
    };

  return {
    log: wrap(console.log.bind(console)),
    info: wrap(console.info.bind(console)),
    warn: wrap(console.warn.bind(console)),
    error: wrap(console.error.bind(console)),
  };
}

export const clientLogger = createLogger("client");


