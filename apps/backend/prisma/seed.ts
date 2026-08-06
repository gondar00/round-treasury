import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.upsert({
    where: { email: 'demo@roundtreasury.com' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'demo@roundtreasury.com',
    },
  });
  console.log('Seeded demo user');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
