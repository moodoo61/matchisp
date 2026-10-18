import { hash } from 'bcrypt';
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSIONS,
} from '@isp/shared';
import { PrismaClient, UserStatus } from '../../generated/core';

/** حزم أدوار تشغيلية جاهزة — تُحدَّث صلاحياتها في كل seed */
const PRESET_ROLES: Array<{
  code: string;
  name: string;
  description: string;
  permissionCodes: string[];
}> = [
  {
    code: 'maintenance_manager',
    name: 'مسؤول الصيانة',
    description:
      'فرز، توزيع، مراجعة وإغلاق، قطع، وحذف — بدون تنفيذ ميداني إلزامي',
    permissionCodes: [
      PERMISSIONS.MAINTENANCE_READ,
      PERMISSIONS.MAINTENANCE_REQUEST_CREATE,
      PERMISSIONS.MAINTENANCE_TRIAGE,
      PERMISSIONS.MAINTENANCE_DISPATCH,
      PERMISSIONS.MAINTENANCE_PARTS,
      PERMISSIONS.MAINTENANCE_SUPERVISE,
      PERMISSIONS.MAINTENANCE_DELETE,
    ],
  },
  {
    code: 'maintenance_technician',
    name: 'فني صيانة',
    description: 'تنفيذ أوامر العمل الميدانية (قبول / بدء / إنجاز / طلب قطع)',
    permissionCodes: [
      PERMISSIONS.MAINTENANCE_READ,
      PERMISSIONS.MAINTENANCE_EXECUTE,
    ],
  },
  {
    code: 'maintenance_desk',
    name: 'مكتب البلاغات',
    description: 'تقديم بلاغات ومتابعة العرض فقط',
    permissionCodes: [
      PERMISSIONS.MAINTENANCE_READ,
      PERMISSIONS.MAINTENANCE_REQUEST_CREATE,
    ],
  },
];

async function syncRolePermissions(
  prisma: PrismaClient,
  roleId: string,
  permissionCodes: string[],
) {
  const perms = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
  });
  const want = new Set(perms.map((p) => p.id));
  const existing = await prisma.rolePermission.findMany({
    where: { roleId },
    select: { permissionId: true },
  });
  const have = new Set(existing.map((e) => e.permissionId));

  for (const permissionId of want) {
    if (have.has(permissionId)) continue;
    await prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
  }
  for (const permissionId of have) {
    if (want.has(permissionId)) continue;
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });
  }
}

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

  // إزالة صلاحيات أُلغيت من الكود (مثل نظام المهام القديم)
  const allowed = new Set<string>(ALL_PERMISSIONS);
  const obsolete = await prisma.permission.findMany({
    where: { code: { notIn: [...allowed] } },
    select: { id: true, code: true },
  });
  if (obsolete.length) {
    await prisma.rolePermission.deleteMany({
      where: { permissionId: { in: obsolete.map((p) => p.id) } },
    });
    await prisma.permission.deleteMany({
      where: { id: { in: obsolete.map((p) => p.id) } },
    });
    // eslint-disable-next-line no-console
    console.log(
      `Removed obsolete permissions: ${obsolete.map((p) => p.code).join(', ')}`,
    );
  }

  const role = await prisma.role.upsert({
    where: { code: 'super_admin' },
    update: { name: 'مدير النظام', isSystem: true },
    create: {
      code: 'super_admin',
      name: 'مدير النظام',
      description: 'صلاحيات كاملة لكل الأقسام',
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

  for (const preset of PRESET_ROLES) {
    const presetRole = await prisma.role.upsert({
      where: { code: preset.code },
      update: {
        name: preset.name,
        description: preset.description,
        isSystem: true,
      },
      create: {
        code: preset.code,
        name: preset.name,
        description: preset.description,
        isSystem: true,
      },
    });
    await syncRolePermissions(
      prisma,
      presetRole.id,
      preset.permissionCodes,
    );
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
  // eslint-disable-next-line no-console
  console.log(
    `Preset roles: ${PRESET_ROLES.map((r) => r.code).join(', ')}`,
  );
  await prisma.$disconnect();
}

main().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
