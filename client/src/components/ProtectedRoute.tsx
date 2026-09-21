import { Navigate } from 'react-router-dom';
import type { JSX } from 'react';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('studyhub_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
