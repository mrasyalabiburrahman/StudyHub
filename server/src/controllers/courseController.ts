import type { Response } from 'express';
import { prisma } from '../config/db.js';
import type { AuthRequest } from '../middlewares/auth.js';

export async function listCourses(req: AuthRequest, res: Response) {
  const courses = await prisma.course.findMany({
    where: { user_id: req.userId! },
    orderBy: { id: 'desc' },
    include: { _count: { select: { tasks: true } } },
  });
  res.json(courses);
}

export async function createCourse(req: AuthRequest, res: Response) {
  const { course_name, lecturer_name, day_of_week, start_time, end_time, color_code } = req.body ?? {};
  if (!course_name) return res.status(400).json({ message: 'course_name wajib diisi' });
  const course = await prisma.course.create({
    data: {
      user_id: req.userId!,
      course_name,
      lecturer_name,
      day_of_week,
      start_time,
      end_time,
      color_code,
    },
  });
  res.status(201).json(course);
}

export async function updateCourse(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.course.findFirst({ where: { id, user_id: req.userId! } });
  if (!existing) return res.status(404).json({ message: 'Course tidak ditemukan' });
  const course = await prisma.course.update({ where: { id }, data: req.body });
  res.json(course);
}

export async function deleteCourse(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.course.findFirst({ where: { id, user_id: req.userId! } });
  if (!existing) return res.status(404).json({ message: 'Course tidak ditemukan' });
  await prisma.course.delete({ where: { id } });
  res.status(204).send();
}
