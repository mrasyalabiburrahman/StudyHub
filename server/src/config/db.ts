import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { serverDir } from './env.js';

// Normalisasi DATABASE_URL sqlite relatif → absolut terhadap server/prisma/
// (path relatif di schema memang ditulis dari sudut prisma/).
// Membuat server bisa dijalankan dari cwd manapun (root project, systemd, dsb).
const rawUrl = process.env.DATABASE_URL ?? '';
if (rawUrl.startsWith('file:')) {
  const p = rawUrl.slice('file:'.length).replace(/^["']|["']$/g, '');
  if (p && !path.isAbsolute(p)) {
    process.env.DATABASE_URL = `file:${path.join(serverDir, 'prisma', p)}`;
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
