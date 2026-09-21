import { Router } from 'express';
import {
  completeTask,
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from '../controllers/taskController.js';
import { authMiddleware } from '../middlewares/auth.js';

export const taskRouter = Router();
taskRouter.use(authMiddleware);
taskRouter.get('/', listTasks);
taskRouter.post('/', createTask);
taskRouter.put('/:id', updateTask);
taskRouter.patch('/:id/complete', completeTask);
taskRouter.delete('/:id', deleteTask);
