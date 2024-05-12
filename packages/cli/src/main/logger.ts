/* eslint-disable import/prefer-default-export */
import { createLogger, transports, format } from 'winston';

// eslint-disable-next-line object-curly-newline
const { combine, timestamp, prettyPrint, splat, simple, colorize, printf } = format;

const timezoneFormat = () => {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Africa/Lagos',
  });
};

export const logger = createLogger({
  transports: [
    new transports.Console({
      level: 'debug',
      format: combine(
        timestamp({
          format: timezoneFormat,
        }),
        prettyPrint(),
        colorize({
          level: true,
          message: true,
          colors: {
            info: 'blue',
            error: 'red',
            warn: 'yellow',
            debug: 'green',
          },
        }),
        splat(),
        simple(),
        printf((info) => {
          return `[${info.timestamp}]::[${info.level}]: ${info.message}`;
        }),
      ),
    }),
  ],
});
