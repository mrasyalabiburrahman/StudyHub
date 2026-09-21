import dotenv from 'dotenv';
import path from 'node:path';

// Direktori server/ — valid untuk tsx (src/) maupun hasil build (dist/).
export const serverDir = path.resolve(__dirname, '../..');

// Muat .env dari cwd (mis. root project / platform hosting) lalu lengkapi
// dari server/.env. Variabel yang sudah ada tidak ditimpa.
dotenv.config();
dotenv.config({ path: path.join(serverDir, '.env') });

function required(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (!v) throw new Error(`Missing env ${key}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  botToken: process.env.BOT_TOKEN ?? '',
  botUsername: process.env.BOT_USERNAME ?? 'StudyHubBot',
};
