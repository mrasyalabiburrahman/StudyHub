import type { Response } from 'express';
import { prisma } from '../config/db.js';
import type { AuthRequest } from '../middlewares/auth.js';

export async function listTasks(req: AuthRequest, res: Response) {
  const { completed, due_soon } = req.query as { completed?: string; due_soon?: string };
  const where: Record<string, unknown> = { user_id: req.userId! };
  if (completed === 'true') where.is_completed = true;
  if (completed === 'false') where.is_completed = false;
  if (due_soon === 'true') {
    where.due_date = { lte: new Date(Date.now() + 48 * 3600 * 1000) };
    where.is_completed = false;
  }
  const tasks = await prisma.task.findMany({
    where: where as never,
    orderBy: { due_date: 'asc' },
    include: { course: true },
  });
  res.json(tasks);
}

export async function createTask(req: AuthRequest, res: Response) {
  const { title, description, due_date, priority, course_id } = req.body ?? {};
  if (!title || !due_date) return res.status(400).json({ message: 'title & due_date wajib diisi' });
  if (course_id) {
    const c = await prisma.course.findFirst({ where: { id: Number(course_id), user_id: req.userId! } });
    if (!c) return res.status(400).json({ message: 'course_id tidak valid' });
  }
  const task = await prisma.task.create({
    data: {
      user_id: req.userId!,
      course_id: course_id ? Number(course_id) : null,
      title,
      description,
      due_date: new Date(due_date),
      priority: priority ?? 'medium',
    },
  });
  res.status(201).json(task);
}

export async function updateTask(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.task.findFirst({ where: { id, user_id: req.userId! } });
  if (!existing) return res.status(404).json({ message: 'Task tidak ditemukan' });
  const data = { ...req.body };
  if (data.due_date) data.due_date = new Date(data.due_date);
  if (data.course_id !== undefined) data.course_id = data.course_id ? Number(data.course_id) : null;
  delete data.user_id;
  // Field pengingat dikelola server, bukan client.
  delete data.reminder_stage;
  delete data.last_reminded_at;
  delete data.reminder_sent;
  const dueChanged = data.due_date && new Date(data.due_date).getTime() !== existing.due_date.getTime();
  const reopened = data.is_completed === false && existing.is_completed === true;
  if (dueChanged || reopened) {
    // Jadwal berubah / tugas dibuka lagi → mulai ulang eskalasi dari tahap 0.
    data.reminder_stage = 0;
    data.reminder_sent = false;
    data.last_reminded_at = null;
  }
  const task = await prisma.task.update({ where: { id }, data });
  res.json(task);
}

export async function completeTask(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.task.findFirst({ where: { id, user_id: req.userId! } });
  if (!existing) return res.status(404).json({ message: 'Task tidak ditemukan' });
  const task = await prisma.task.update({
    where: { id },
    data: { is_completed: true },
  });
  res.json(task);
}

export async function deleteTask(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.task.findFirst({ where: { id, user_id: req.userId! } });
  if (!existing) return res.status(404).json({ message: 'Task tidak ditemukan' });
  await prisma.task.delete({ where: { id } });
  res.status(204).send();
}
