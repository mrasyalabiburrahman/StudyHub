import type { Course } from '../services/api';

export function CourseCard({ course, onDelete }: { course: Course; onDelete: (id: number) => void }) {
  const time =
    course.start_time || course.end_time
      ? ` • ${course.start_time ?? '?'}–${course.end_time ?? '?'}`
      : '';
  return (
    <div className="rounded-lg border p-4 bg-white dark:bg-slate-950" style={{ borderLeft: `6px solid ${course.color_code ?? '#6366F1'}` }}>
      <h3 className="font-semibold">{course.course_name}</h3>
      <p className="text-sm opacity-70">
        👨‍🏫 {course.lecturer_name || '-'} • 📅 {course.day_of_week || '-'}{time}
      </p>
      <p className="text-xs mt-1 opacity-60">{course._count?.tasks ?? 0} tugas</p>
      <button onClick={() => onDelete(course.id)} className="mt-2 text-xs text-red-500 hover:underline">
        Hapus
      </button>
    </div>
  );
}
