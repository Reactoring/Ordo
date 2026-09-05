import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const server = createApp().listen(port, process.env.HOST ?? '127.0.0.1', () => {
  console.log(`ORDO API: http://${process.env.HOST ?? '127.0.0.1'}:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => server.close());
}
