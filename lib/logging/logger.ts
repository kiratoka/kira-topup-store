import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const REDACTION_PATHS = [
  'email', '*.email', '*.*.email',
  'serverKey', '*.serverKey', 'server_key', '*.server_key',
  'token', '*.token', 'snap_token', '*.snap_token',
  'password', '*.password',
  'secret', '*.secret',
  'ip', '*.ip', 'ipAddress', '*.ipAddress', 'ip_address', '*.ip_address',
  'connectionString', '*.connectionString',
];

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'debug'),
  redact: {
    paths: REDACTION_PATHS,
    censor: '[REDACTED]',
  },
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
});

export const paymentLogger = logger.child({ domain: 'payment' });
export const webhookLogger = logger.child({ domain: 'webhook' });
export const redisLogger = logger.child({ domain: 'redis' });
export const invoiceLogger = logger.child({ domain: 'invoice' });
export const dbLogger = logger.child({ domain: 'db' });
