const prisma = require('./src/lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const demoUsers = [
      {
        name: 'Alex Vance',
        username: 'alex_vance',
        email: 'alex@nichelink.dev',
        password: 'ProMember',
        isVerified: true,
      },
      {
        name: 'Taylor Lee',
        username: 'taylor_lee',
        email: 'taylor@nichelink.dev',
        password: 'FreeMember',
        isVerified: true,
      }
    ];

    for (const u of demoUsers) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(u.password, 12);
        await prisma.user.create({
          data: {
            name: u.name,
            username: u.username,
            email: u.email,
            password: hashedPassword,
            isVerified: u.isVerified,
          }
        });
        console.log(`Created demo user: ${u.email}`);
      } else {
        console.log(`Demo user already exists: ${u.email}`);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
