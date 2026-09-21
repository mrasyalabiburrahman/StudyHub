import { Router } from 'express';
import { createCourse, deleteCourse, listCourses, updateCourse } from '../controllers/courseController.js';
import { authMiddleware } from '../middlewares/auth.js';

export const courseRouter = Router();
courseRouter.use(authMiddleware);
courseRouter.get('/', listCourses);
courseRouter.post('/', createCourse);
courseRouter.put('/:id', updateCourse);
courseRouter.delete('/:id', deleteCourse);
