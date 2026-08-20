const prisma = require('../src/lib/prisma');

async function ensureAlexPro() {
  try {
    const alex = await prisma.user.findUnique({ where: { email: 'alex@nichelink.dev' } });
    if (alex) {
      await prisma.subscription.upsert({
        where: { userId: alex.id },
        update: { planCode: 'PRO', status: 'ACTIVE' },
        create: {
          userId: alex.id,
          planCode: 'PRO',
          status: 'ACTIVE',
        },
      });
      console.log('Alex PRO subscription confirmed.');
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

ensureAlexPro();
