import * as winston from "winston"; // Logging
const { combine, timestamp, printf } = winston.format; // Format settings

// Setup formatter
const customFormat = printf(({ level, message, timestamp }) => {
  // Outputs [Timestamp] level: message
  return `[${timestamp}] ${level}: ${message}`;
});

// Setup winston logger
export const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), customFormat),
  transports: [
    // Output to logfile
    new winston.transports.File({ filename: "pool-sniper.log" }),
    // Output to console
    new winston.transports.Console()
  ]
});
