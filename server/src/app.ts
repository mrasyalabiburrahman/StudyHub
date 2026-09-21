import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
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
  // CSP dimatikan: vite-plugin-pwa menyisipkan script registrasi inline di index.html.
  app.use(helmet({ contentSecurityPolicy: false }));
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

  // Serve frontend (hasil `npm run build` di client/) dari backend yang sama.
  // Aktif hanya jika folder client/dist ada — saat dev (vite) abaikan dengan aman.
  // Berlaku untuk src/ (tsx) maupun dist/ (node): <root>/client/dist.
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { maxAge: '1d', index: false }));
    // SPA fallback: semua GET non-API yang menerima HTML → index.html (react-router).
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      if (!req.accepts('html')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
    console.log(`[studyhub] serving frontend dari ${clientDist}`);
  } else {
    console.log('[studyhub] client/dist tidak ada — frontend tidak di-serve (jalankan build client / vite dev)');
  }

  // 404 fallback (API + non-HTML)
  app.use((req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'Not found' });
    res.status(404).send('Not found');
  });
  return app;
}

const isMain = process.argv[1]?.endsWith('app.ts') || process.argv[1]?.endsWith('app.js');
if (isMain) {
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[studyhub] listening on :${env.port}`);
    initBot();
    initCron();
  });
}
