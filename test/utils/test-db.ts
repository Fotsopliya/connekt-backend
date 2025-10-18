import 'reflect-metadata';
import { AppDataSource } from '../../data-source';
import { config } from 'dotenv';
import path from 'path';

// Load .env.test
config({ path: path.resolve(process.cwd(), '.env.test') });

export async function initTestDB() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  await AppDataSource.runMigrations();
}

export async function truncateAll() {
  const ds = AppDataSource;
  const tables: Array<{ table_name: string }> = await ds.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`,
  );
  const toTruncate = tables
    .map((t) => t.table_name)
    .filter((t) => t !== 'migrations');
  if (toTruncate.length > 0) {
    const quoted = toTruncate.map((t) => `"${t}"`).join(', ');
    await ds.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
  }
  await ensureAdmin();
}

export async function ensureAdmin() {
  const ds = AppDataSource;
  const extlId = process.env.DEFAULT_ADMIN_EXTL_ID;
  if (!extlId) return;
  const email = process.env.DEFAULT_ADMIN_EMAIL ?? null;
  const avatarUrl = process.env.DEFAULT_ADMIN_AVATAR_URL ?? null;
  await ds.query(
    `INSERT INTO "users" (extl_id, email, avatar_url, role, blocked, verified)
     VALUES ($1, $2, $3, 'admin', false, true)
     ON CONFLICT (extl_id) DO UPDATE SET email = EXCLUDED.email, avatar_url = EXCLUDED.avatar_url, role='admin', verified=true, blocked=false`,
    [extlId, email, avatarUrl],
  );
}

export async function closeTestDB() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
