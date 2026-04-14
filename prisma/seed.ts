import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** All permission values from the PERMISSIONS constant */
const ALL_PERMISSIONS = [
  1, 2, 3, 4, 11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34, 41, 42, 43, 44,
  51, 52, 53, 54, 101, 102, 103, 104, 111, 112, 113, 114, 201, 202, 203, 204,
  211, 212, 213, 214, 301, 302, 303, 304, 311, 312, 313, 314, 401, 402, 403,
  404, 411, 412, 413, 414, 501, 601, 701, 702, 703, 801, 802,
];

/** Moderator permissions: CRUD books/authors/collections/publishers/editions/regions, READ users/stats */
const MODERATOR_PERMISSIONS = [
  1, 2, 3, 4, 11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34, 41, 42, 43, 44,
  51, 52, 53, 54, 202, 311, 312, 313, 314, 501,
];

/** Librarian permissions: CRUD rentals/stocks/users (own library), READ books/stats, CRUD sms/gateway, passports, verification */
const LIBRARIAN_PERMISSIONS = [
  2, 12, 22, 32, 42, 52, 101, 102, 103, 104, 111, 112, 113, 114, 201, 202,
  203, 204, 302, 401, 402, 403, 404, 411, 412, 413, 414, 501, 701, 702, 703,
  801, 802,
];

async function main() {
  console.log('Seeding database...');

  // Create roles
  const ownerRole = await prisma.role.upsert({
    where: { name: 'owner' },
    update: { permissions: ALL_PERMISSIONS },
    create: {
      name: 'owner',
      description: 'Full system access — all permissions',
      permissions: ALL_PERMISSIONS,
    },
  });

  const moderatorRole = await prisma.role.upsert({
    where: { name: 'moderator' },
    update: { permissions: MODERATOR_PERMISSIONS },
    create: {
      name: 'moderator',
      description:
        'Content management — books, authors, collections, publishers',
      permissions: MODERATOR_PERMISSIONS,
    },
  });

  const librarianRole = await prisma.role.upsert({
    where: { name: 'librarian' },
    update: { permissions: LIBRARIAN_PERMISSIONS },
    create: {
      name: 'librarian',
      description:
        'Library operations — rentals, stocks, users (own library only)',
      permissions: LIBRARIAN_PERMISSIONS,
    },
  });

  // Moderator + Librarian combined permissions (unique values)
  const MODERATOR_LIBRARIAN_PERMISSIONS = [
    ...new Set([...MODERATOR_PERMISSIONS, ...LIBRARIAN_PERMISSIONS]),
  ];

  const moderatorLibrarianRole = await prisma.role.upsert({
    where: { name: 'moderator_librarian' },
    update: { permissions: MODERATOR_LIBRARIAN_PERMISSIONS },
    create: {
      name: 'moderator_librarian',
      description:
        'Combined moderator + librarian — content management + library operations',
      permissions: MODERATOR_LIBRARIAN_PERMISSIONS,
    },
  });

  console.log('Roles created:', {
    owner: ownerRole.id,
    moderator: moderatorRole.id,
    librarian: librarianRole.id,
    moderator_librarian: moderatorLibrarianRole.id,
  });

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      password: hashedPassword,
      roleId: ownerRole.id,
      verified: true,
    },
  });

  console.log('Admin user created:', { id: adminUser.id, username: 'admin' });
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
