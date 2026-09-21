import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, CheckSquare, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const doLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-bold text-lg">📚 StudyHub</Link>
          <nav className="flex gap-3 text-sm">
            <Link to="/" className="flex items-center gap-1 hover:underline"><CalendarDays size={16} /> Dashboard</Link>
            <Link to="/courses" className="flex items-center gap-1 hover:underline"><BookOpen size={16} /> Kuliah</Link>
            <Link to="/tasks" className="flex items-center gap-1 hover:underline"><CheckSquare size={16} /> Tugas</Link>
            <Link to="/settings" className="flex items-center gap-1 hover:underline"><Settings size={16} /> Settings</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span>{user?.name}</span>
            <button onClick={doLogout} className="flex items-center gap-1 rounded bg-slate-200 dark:bg-slate-800 px-2 py-1">
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
