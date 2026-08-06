import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'demo@roundtreasury.com' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'demo@roundtreasury.com',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
