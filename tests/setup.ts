// Runs before each test file. Points the application's Prisma singleton at
// the isolated test database and speeds up password hashing for tests.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://ra:ra_local_dev_secret@127.0.0.1:5433/ra";
process.env.EMAIL_DRIVER = "console";
process.env.PASSWORD_HASH_COST = "4";
// vitest already sets NODE_ENV=test
