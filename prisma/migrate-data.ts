/**
 * Data migration script: Old Express DB → New NestJS DB
 *
 * Usage: DATABASE_URL=... OLD_DATABASE_URL=... pnpm ts-node prisma/migrate-data.ts
 *
 * Prerequisites:
 * - New DB schema already applied (prisma migrate dev)
 * - New DB seeded (prisma db seed) — roles exist
 * - Old DB accessible
 */
import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import { generateSearchableName } from '../src/common/utils/string.utils';

const newPrisma = new PrismaClient();

const OLD_DB_URL = process.env.OLD_DATABASE_URL || 'postgresql://postgres:0103@localhost:5432/library';

async function getOldClient(): Promise<Client> {
  const client = new Client({ connectionString: OLD_DB_URL });
  await client.connect();
  return client;
}

async function main() {
  const old = await getOldClient();
  console.log('Connected to old DB');

  // ===== Pre-check: rent bo'lgan userlarning locationId si bo'lishi shart =====
  const { rows: nullLocUsers } = await old.query(
    `SELECT DISTINCT u.id, u."firstName", u."lastName"
     FROM users u
     JOIN rents r ON r."userId" = u.id
     WHERE u."locationId" IS NULL`,
  );
  if (nullLocUsers.length > 0) {
    console.error('ERROR: Rent bor lekin locationId NULL bo\'lgan userlar:');
    for (const u of nullLocUsers) {
      console.error(`  User #${u.id}: ${u.firstName} ${u.lastName}`);
    }
    throw new Error(`${nullLocUsers.length} ta userda locationId NULL (rent bor). Migration to'xtatildi.`);
  }
  console.log('Pre-check passed: rent bor userlarning barchasida locationId bor');

  // Get role IDs from new DB
  const ownerRole = await newPrisma.role.findUniqueOrThrow({ where: { name: 'owner' } });
  const moderatorRole = await newPrisma.role.findUniqueOrThrow({ where: { name: 'moderator' } });
  const librarianRole = await newPrisma.role.findUniqueOrThrow({ where: { name: 'librarian' } });
  const modLibRole = await newPrisma.role.findUniqueOrThrow({ where: { name: 'moderator_librarian' } });

  // ===== Step 1: Regions =====
  console.log('\n--- Step 1: Regions ---');
  const { rows: regions } = await old.query('SELECT * FROM regions ORDER BY id');
  for (const r of regions) {
    await newPrisma.region.upsert({
      where: { id: r.id },
      update: {},
      create: { id: r.id, name: r.name, createdAt: r.createdAt, updatedAt: r.updatedAt },
    });
  }
  console.log(`  Migrated ${regions.length} regions`);

  // Towns → child regions
  const { rows: towns } = await old.query('SELECT * FROM towns ORDER BY id');
  const regionNames = new Set(regions.map((r: { name: string }) => r.name));
  let townOffset = regions.length > 0 ? Math.max(...regions.map((r: { id: number }) => r.id)) + 1 : 1000;
  for (const t of towns) {
    // Agar town nomi region nomi bilan bir xil bo'lsa, " sh." qo'shamiz
    const townName = regionNames.has(t.name) ? `${t.name} sh.` : t.name;
    await newPrisma.region.upsert({
      where: { id: townOffset },
      update: {},
      create: {
        id: townOffset,
        name: townName,
        parentId: t.regionId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      },
    });
    townOffset++;
  }
  console.log(`  Migrated ${towns.length} towns as child regions`);

  // ===== Step 2: Libraries (from locations) =====
  console.log('\n--- Step 2: Libraries ---');
  const { rows: locations } = await old.query('SELECT * FROM locations ORDER BY id');
  for (const loc of locations) {
    await newPrisma.library.upsert({
      where: { id: loc.id },
      update: {},
      create: {
        id: loc.id,
        name: loc.name,
        description: loc.description,
        active: loc.active ?? true,
        link: loc.link,
        createdAt: loc.createdAt,
        updatedAt: loc.updatedAt,
        deletedAt: loc.deletedAt,
      },
    });
  }
  console.log(`  Migrated ${locations.length} locations → libraries`);

  // ===== Step 3: Addresses =====
  // Eski jadvalda: region (string), town (string), locationId (FK to locations)
  // Yangi jadvalda: regionId (FK to regions), library (Library.addressId orqali)
  console.log('\n--- Step 3: Addresses ---');
  const { rows: addresses } = await old.query('SELECT * FROM addresses ORDER BY id');
  for (const a of addresses) {
    // address.region (string) → regionId, address.town (string) → townId
    let regionId: number | null = null;
    let townId: number | null = null;

    if (a.region) {
      const region = await newPrisma.region.findFirst({ where: { name: a.region } });
      if (region) regionId = region.id;
    }
    if (a.town) {
      // Avval asl nomi, keyin " sh." qo'shilgan variant
      let town = await newPrisma.region.findFirst({ where: { name: a.town } });
      if (!town) town = await newPrisma.region.findFirst({ where: { name: `${a.town} sh.` } });
      if (town) townId = town.id;
    }

    await newPrisma.address.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        countryCode: a.countryCode || 'uz',
        addressLine: a.addressLine,
        street: a.street,
        home: a.home,
        latitude: a.latitude ?? null,
        longitude: a.longitude ?? null,
        regionId,
        townId,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      },
    });

    // locationId orqali kutubxonaga bog'lash
    if (a.locationId) {
      await newPrisma.library.update({
        where: { id: a.locationId },
        data: { addressId: a.id },
      }).catch(() => { /* kutubxona topilmasa skip */ });
    }
  }
  console.log(`  Migrated ${addresses.length} addresses`);

  // ===== Step 4: Users =====
  console.log('\n--- Step 4: Users ---');
  const { rows: users } = await old.query('SELECT * FROM users ORDER BY id');
  let passwordHashCount = 0;

  // telegramId dublikatlarni aniqlash — faqat eng yangi userga qo'yiladi
  const { rows: tgDups } = await old.query(
    `SELECT "telegramId", MAX(id) as keep_id
     FROM users WHERE "telegramId" IS NOT NULL AND "telegramId" != ''
     GROUP BY "telegramId" HAVING COUNT(*) > 1`,
  );
  const tgKeepMap = new Map<string, number>();
  for (const d of tgDups) {
    tgKeepMap.set(d.telegramId, d.keep_id);
  }

  for (const u of users) {
    // Map role: owner > moderator+librarian > librarian > moderator
    let roleId: number | null = null;
    if (u.owner) roleId = ownerRole.id;
    else if (u.moderator && u.librarian) roleId = modLibRole.id;
    else if (u.librarian) roleId = librarianRole.id;
    else if (u.moderator) roleId = moderatorRole.id;

    // Hash password if exists (old passwords are plain text)
    let hashedPassword: string | null = null;
    if (u.password) {
      hashedPassword = await bcrypt.hash(u.password, 10);
      passwordHashCount++;
    }

    // Map status: old 0=blocked, 1=active
    const status = u.status === 0 ? 'BLOCKED' : 'ACTIVE';

    // Map gender
    const gender = u.gender === 'male' ? 'MALE' : u.gender === 'female' ? 'FEMALE' : null;

    // Extra phones
    const extraPhones: string[] = [];
    if (u.extraPhone) extraPhones.push(u.extraPhone);

    await newPrisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        firstName: u.firstName || 'Unknown',
        lastName: u.lastName || '',
        username: u.username || null,
        phone: u.phone || null,
        extraPhones,
        gender,
        birthDate: u.birthDate,
        password: hashedPassword,
        verified: u.verified ?? false,
        phoneVerified: u.phoneVerified ?? false,
        status,
        balance: u.balance ?? 0,
        blockingReason: u.blockingReason,
        telegramId: u.telegramId && (!tgKeepMap.has(u.telegramId) || tgKeepMap.get(u.telegramId) === u.id)
          ? u.telegramId
          : null,
        extra: u.extra || null,
        roleId,
        adminLibraryId: roleId ? (u.libraryId || null) : null,
        addressId: u.addressId || null,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        deletedAt: u.deletedAt,
      },
    });

    // Create UserLibrary entry if user had libraryId
    if (u.libraryId) {
      await newPrisma.userLibrary.upsert({
        where: { userId_libraryId: { userId: u.id, libraryId: u.libraryId } },
        update: {},
        create: { userId: u.id, libraryId: u.libraryId },
      }).catch(() => { /* skip if library doesn't exist */ });
    }
  }
  console.log(`  Migrated ${users.length} users (${passwordHashCount} passwords hashed)`);

  // ===== Step 5: Passports =====
  console.log('\n--- Step 5: Passports ---');
  let passportCount = 0;
  for (const u of users) {
    if (u.passportId) {
      await newPrisma.passport.upsert({
        where: { passportId: u.passportId },
        update: {},
        create: {
          passportId: u.passportId,
          pinfl: u.pinfl || null,
          userId: u.id,
          isActive: true,
        },
      }).catch(() => { /* skip duplicates */ });
      passportCount++;
    }
  }
  console.log(`  Migrated ${passportCount} passports`);

  // ===== Step 6: Authors =====
  console.log('\n--- Step 6: Authors ---');
  const { rows: authors } = await old.query('SELECT * FROM authors ORDER BY id');
  for (const a of authors) {
    await newPrisma.author.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        name: a.name,
        searchableName: generateSearchableName(a.name),
        creatorId: a.creatorId || null,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        deletedAt: a.deletedAt,
      },
    });
  }
  console.log(`  Migrated ${authors.length} authors`);

  // ===== Step 7: Collections =====
  console.log('\n--- Step 7: Collections ---');
  const { rows: collections } = await old.query('SELECT * FROM collections ORDER BY id');
  for (const c of collections) {
    await newPrisma.collection.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        sort: c.sort ?? 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        deletedAt: c.deletedAt,
      },
    });
  }
  console.log(`  Migrated ${collections.length} collections`);

  // ===== Step 8: Publishers =====
  console.log('\n--- Step 8: Publishers ---');
  const { rows: publishers } = await old.query('SELECT * FROM publishings ORDER BY id');
  for (const p of publishers) {
    await newPrisma.publisher.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        image: p.image || null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        deletedAt: p.deletedAt,
      },
    });
  }
  console.log(`  Migrated ${publishers.length} publishers`);

  // ===== Step 9: Books =====
  console.log('\n--- Step 9: Books ---');
  // Author nomlarini map qilib olamiz (searchableName uchun)
  const authorNameMap = new Map<number, string>();
  for (const a of authors) {
    authorNameMap.set(a.id, a.name);
  }

  const { rows: books } = await old.query('SELECT * FROM books ORDER BY id');
  for (const b of books) {
    const langMap: Record<string, string> = { uz: 'UZ', oz: 'OZ', ru: 'RU', en: 'EN', ar: 'AR' };
    const authorName = b.authorId ? authorNameMap.get(b.authorId) : undefined;

    await newPrisma.book.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        name: b.name,
        description: b.description,
        images: b.image ? [b.image] : [],
        isbn: b.isbn || null,
        language: (langMap[b.language] || 'UZ') as 'UZ' | 'OZ' | 'RU' | 'EN' | 'AR',
        searchableName: generateSearchableName(b.name, authorName),
        sort: b.sort ?? 0,
        collectionId: b.collectionId || null,
        creatorId: b.creatorId || null,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        deletedAt: b.deletedAt,
      },
    });

    // BookAuthor (many-to-many)
    if (b.authorId) {
      await newPrisma.bookAuthor.upsert({
        where: { bookId_authorId: { bookId: b.id, authorId: b.authorId } },
        update: {},
        create: { bookId: b.id, authorId: b.authorId },
      }).catch(() => { /* skip invalid FK */ });
    }
  }
  console.log(`  Migrated ${books.length} books`);

  // ===== Step 9.5: BookEditions — books dagi pages, printedAt, isbn =====
  console.log('\n--- Step 9.5: BookEditions ---');
  let editionCount = 0;
  for (const b of books) {
    if (b.pages || b.printedAt || b.isbn) {
      // Invalid sanalarni filter (masalan +092022 yil)
      let printedAt: Date | null = null;
      if (b.printedAt) {
        const d = new Date(b.printedAt);
        if (d.getFullYear() > 1900 && d.getFullYear() < 2100) {
          printedAt = d;
        }
      }

      await newPrisma.bookEdition.create({
        data: {
          bookId: b.id,
          pages: b.pages || null,
          printedAt,
          isbn: b.isbn || null,
        },
      });
      editionCount++;
    }
  }
  console.log(`  Created ${editionCount} book editions`);

  // ===== Step 10: BookRules — rent eng ko'p 5 ta kutubxonaga =====
  // Kutubxona user.locationId orqali aniqlanadi (rent → user → locationId)
  // Rent yo'q kitoblarga BookRule yaratilmaydi
  console.log('\n--- Step 10: BookRules ---');
  let ruleCount = 0;
  for (const b of books) {
    const { rows: topLibraries } = await old.query(
      `SELECT u."locationId" as library_id, COUNT(*) as cnt
       FROM rents r
       JOIN stocks s ON s.id = r."stockId"
       JOIN users u ON u.id = r."userId"
       WHERE s."bookId" = $1 AND u."locationId" IS NOT NULL
       GROUP BY u."locationId"
       ORDER BY cnt DESC
       LIMIT 5`,
      [b.id],
    );

    const rarity = b.few === 1 ? 'UNCOMMON' : 'COMMON';
    for (const lib of topLibraries) {
      await newPrisma.bookRule.upsert({
        where: { bookId_libraryId: { bookId: b.id, libraryId: lib.library_id } },
        update: {},
        create: {
          bookId: b.id,
          libraryId: lib.library_id,
          price: b.price ?? 50000,
          rentDuration: b.rentDuration ?? 15,
          rarity: rarity as 'COMMON' | 'UNCOMMON',
        },
      });
      ruleCount++;
    }
  }
  console.log(`  Created ${ruleCount} book rules`);

  // ===== Step 11: Stocks =====
  console.log('\n--- Step 11: Stocks ---');
  const { rows: stocks } = await old.query('SELECT * FROM stocks WHERE "bookId" IS NOT NULL ORDER BY id');
  for (const s of stocks) {
    // Find book rule for this stock
    const bookRule = await newPrisma.bookRule.findUnique({
      where: { bookId_libraryId: { bookId: s.bookId, libraryId: s.locationId } },
    });

    await newPrisma.stock.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        busy: s.busy ?? false,
        status: 'ACTIVE',
        bookId: s.bookId,
        libraryId: s.locationId,
        bookRuleId: bookRule?.id || null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        deletedAt: s.deletedAt,
      },
    });
  }
  console.log(`  Migrated ${stocks.length} stocks`);

  // ===== Step 12: Rentals =====
  // libraryId = reader ning kutubxonasi (users.locationId)
  // pre-check kafolatlaydi: rent bor har bir userda locationId bor
  console.log('\n--- Step 12: Rentals ---');
  const { rows: rents } = await old.query(`
    SELECT r.*, u."locationId" as user_location_id
    FROM rents r
    JOIN users u ON u.id = r."userId"
    ORDER BY r.id
  `);
  for (const r of rents) {
    const libraryId = r.user_location_id;

    let issuedById = 1;
    const adminUser = await newPrisma.user.findFirst({
      where: { adminLibraryId: libraryId, role: { isNot: null } },
      select: { id: true },
    });
    if (adminUser) issuedById = adminUser.id;

    await newPrisma.rental.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        issuedAt: r.leasedAt,
        dueDate: r.returningDate,
        returnedAt: r.returnedAt || null,
        referenceId: r.customId ? String(r.customId) : null,
        rejected: r.rejected ?? false,
        readerId: r.userId,
        stockId: r.stockId,
        libraryId,
        issuedById,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      },
    }).catch((err: Error) => {
      console.warn(`  Skipped rental ${r.id}: ${err.message}`);
    });
  }
  console.log(`  Migrated ${rents.length} rentals`);

  // ===== Step 13: Comments =====
  // Eski comments da userId yo'q — authorId ni rent ning issuedById dan olamiz
  console.log('\n--- Step 13: Comments ---');
  const { rows: comments } = await old.query('SELECT * FROM comments ORDER BY id');
  for (const c of comments) {
    let authorId: number | null = null;
    if (c.rentId) {
      const rental = await newPrisma.rental.findUnique({
        where: { id: c.rentId },
        select: { issuedById: true },
      });
      if (rental) authorId = rental.issuedById;
    }

    await newPrisma.comment.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        text: c.text || '',
        rentalId: c.rentId || null,
        stockId: c.stockId || null,
        authorId,
        createdAt: c.createdAt,
      },
    }).catch(() => { /* skip invalid FK */ });
  }
  console.log(`  Migrated ${comments.length} comments`);

  // ===== Step 14: SMS (deviceId bog'langanlari skip) =====
  console.log('\n--- Step 14: SMS ---');
  const { rows: smsRows } = await old.query('SELECT * FROM sms WHERE "deviceId" IS NULL ORDER BY id');
  const providerMap: Record<number, string> = {
    1: 'PLAY_MOBILE',
    2: 'ESKIZ',
    3: 'MANUAL',
    4: 'GATEWAY',
  };
  const statusMap: Record<string, string> = {
    draft: 'DRAFT',
    pending: 'PENDING',
    sent: 'SENT',
    delivered: 'DELIVERED',
    error: 'ERROR',
  };

  for (const s of smsRows) {
    await newPrisma.sms.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        phone: s.phone,
        text: s.text,
        status: (statusMap[s.status] || 'DRAFT') as 'DRAFT' | 'PENDING' | 'SENT' | 'DELIVERED' | 'ERROR',
        errorReason: s.error_reason || null,
        provider: s.provider ? (providerMap[s.provider] || null) as 'PLAY_MOBILE' | 'ESKIZ' | 'MANUAL' | 'GATEWAY' | null : null,
        providerMessageId: s.provider_message_id || null,
        userId: s.userId || null,
        smsBulkId: s.smsbulkId || null,
      },
    }).catch(() => { /* skip invalid FK */ });
  }
  console.log(`  Migrated ${smsRows.length} SMS records`);

  // ===== Step 15: SmsBulks =====
  console.log('\n--- Step 15: SmsBulks ---');
  const { rows: bulks } = await old.query('SELECT * FROM smsbulks ORDER BY id');
  for (const b of bulks) {
    await newPrisma.smsBulk.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        text: b.text || '',
        userId: b.userId,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        deletedAt: b.deletedAt,
      },
    }).catch(() => { /* skip invalid FK */ });
  }
  console.log(`  Migrated ${bulks.length} SMS bulks`);

  // ===== Reset sequences =====
  console.log('\n--- Resetting sequences ---');
  const tables = [
    'users', 'regions', 'libraries', 'addresses', 'authors', 'collections',
    'publishers', 'books', 'book_editions', 'book_rules', 'stocks', 'rentals',
    'comments', 'sms', 'sms_bulks', 'passports',
  ];
  for (const table of tables) {
    await newPrisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`,
    ).catch(() => { /* table might not exist or be empty */ });
  }
  console.log('  Sequences reset');

  // ===== Validation =====
  console.log('\n=== VALIDATION ===');
  const { rows: oldCounts } = await old.query(`
    SELECT 'users' as t, COUNT(*) as c FROM users
    UNION ALL SELECT 'books', COUNT(*) FROM books
    UNION ALL SELECT 'stocks', COUNT(*) FROM stocks
    UNION ALL SELECT 'rents', COUNT(*) FROM rents
    UNION ALL SELECT 'authors', COUNT(*) FROM authors
    UNION ALL SELECT 'locations', COUNT(*) FROM locations
  `);

  for (const row of oldCounts) {
    const newTableMap: Record<string, string> = {
      users: 'users',
      books: 'books',
      stocks: 'stocks',
      rents: 'rentals',
      authors: 'authors',
      locations: 'libraries',
    };
    const newTable = newTableMap[row.t];
    const [{ count: newCount }] = await newPrisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "${newTable}"`,
    );
    const match = Number(newCount) >= Number(row.c) ? '✓' : '✗';
    console.log(`  ${match} ${row.t}: old=${row.c} new=${newCount}`);
  }

  console.log('\n=== MIGRATION COMPLETE ===');

  await old.end();
  await newPrisma.$disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
