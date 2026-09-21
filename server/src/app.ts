import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authMiddleware } from './middlewares/auth.js';
import { authRouter } from './routes/auth.js';
import { courseRouter } from './routes/courses.js';
import { taskRouter } from './routes/tasks.js';
import { telegramRouter } from './routes/telegram.js';
import { initBot } from './services/botService.js';
import { checkAndSendReminders, initCron } from './services/cronService.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'studyhub' }));
  app.use('/api/auth', authRouter);
  app.use('/api/courses', courseRouter);
  app.use('/api/tasks', taskRouter);
  app.use('/api/telegram', telegramRouter);

  // Dev/testing: trigger cron manual (butuh auth)
  app.post('/api/_cron-test', authMiddleware, async (_req, res) => {
    const result = await checkAndSendReminders();
    res.json(result);
  });

  // 404 fallback
  app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
  return app;
}

if (process.argv[1]?.endsWith('app.ts')) {
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[studyhub] listening on :${env.port}`);
    initBot();
    initCron();
  });
}
