import { initTestDB, truncateAll, closeTestDB, ensureAdmin } from './test-db';

beforeAll(async () => {
  await initTestDB();
  await ensureAdmin();
});

afterEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await closeTestDB();
});
