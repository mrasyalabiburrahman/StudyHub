import { Router } from 'express';
import { getLinkToken, getStatus, unlink } from '../controllers/telegramController.js';
import { authMiddleware } from '../middlewares/auth.js';

export const telegramRouter = Router();
telegramRouter.use(authMiddleware);
telegramRouter.get('/link-token', getLinkToken);
telegramRouter.get('/status', getStatus);
telegramRouter.post('/unlink', unlink);
