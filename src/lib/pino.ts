import pino from "pino";

export interface LoggerOptions {
  name: string;
  version: string;
  environment?: "development" | "production";
  level?: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
}

export const DEFAULT_REDACTED_PATHS = [
  "headers.authorization",
  "headers.cookie",
  'headers["set-cookie"]',
];

export const createPinoLogger = (options: LoggerOptions) => {
  const logger = pino({
    level: options.level,

    // Redact sensitive fields that might contain secrets
    redact: {
      paths: DEFAULT_REDACTED_PATHS,
      censor: "[REDACTED]",
    },

    // // Pretty print in development
    // transport:
    //   options.environment === "development"
    //     ? {
    //         target: "pino-pretty",
    //         options: {
    //           colorize: true,
    //           translateTime: "yyyy-mm-dd HH:MM:ss.l Z",
    //         },
    //       }
    //     : undefined,

    // Production settings
    ...(options.environment === "production" && {
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    }),

    // Base context for all logs
    base: {
      service: options.name,
      version: options.version,
    },
  });

  return logger;
};
