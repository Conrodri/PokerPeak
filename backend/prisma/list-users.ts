import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { username: true, email: true, id: true } });
  if (!users.length) { console.log('Aucun user dans la DB dev.'); return; }
  users.forEach(u => console.log(`  username="${u.username}"  email="${u.email}"  id=${u.id}`));
}
main().finally(() => prisma.$disconnect());
