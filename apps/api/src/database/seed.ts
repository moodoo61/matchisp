import { hash } from 'bcrypt';
import { ALL_PERMISSIONS, PERMISSION_LABELS } from '@isp/shared';
import { PrismaClient, UserStatus } from '../../generated/core';

async function main() {
  const prisma = new PrismaClient();
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';
  const name = process.env.SEED_ADMIN_NAME ?? 'مدير النظام';

  for (const code of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: { name: PERMISSION_LABELS[code] },
      create: {
        code,
        name: PERMISSION_LABELS[code],
        description: PERMISSION_LABELS[code],
      },
    });
  }

  const role = await prisma.role.upsert({
    where: { code: 'super_admin' },
    update: { name: 'مدير النظام', isSystem: true },
    create: {
      code: 'super_admin',
      name: 'مدير النظام',
      description: 'صلاحيات كاملة',
      isSystem: true,
    },
  });

  const permissions = await prisma.permission.findMany();
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.upsert({
    where: { username },
    update: {
      name,
      passwordHash,
      status: UserStatus.ACTIVE,
    },
    create: {
      username,
      name,
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded admin user: ${username}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
