import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/db.js';

async function main() {
  const email = 'demo@studyhub.test';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const password_hash = await bcrypt.hash('demo1234', 10);
    const user = await prisma.user.create({ data: { name: 'Demo', email, password_hash } });
    await prisma.course.create({
      data: {
        user_id: user.id,
        course_name: 'Pemrograman Web 1',
        lecturer_name: 'Dosen',
        day_of_week: 'Senin',
        start_time: '08:00',
        end_time: '10:00',
        color_code: '#6366F1',
      },
    });
    console.log('[seed] demo user created:', email, '/ demo1234');
  } else {
    console.log('[seed] demo user exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
