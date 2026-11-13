const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const MIGRATIONS_DIR = path.resolve(__dirname, "..", "supabase", "migrations");
const COMPAT_SHIM = path.resolve(__dirname, "..", "supabase", "hub-compat", "00000_hub_compat_shim.sql");

async function runLocalMigrations() {
  const connectionString =
    process.env.HUB_DATABASE_URL ||
    `postgresql://${process.env.HUB_DB_USER || "postgres"}:${process.env.HUB_DB_PASSWORD || "postgres"}@${process.env.HUB_DB_HOST || "127.0.0.1"}:${process.env.HUB_DB_PORT || "5432"}/${process.env.HUB_DB_NAME || "nsei_sukul_hub"}`;

  console.log(`[Hub Migrator] Connecting to local PostgreSQL cluster: ${connectionString.replace(/:[^:]*@/, ":****@")}`);
  const client = new Client({ connectionString });
  await client.connect();

  try {
    // 1. Create migration tracking table in hub schema
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS hub;
      CREATE TABLE IF NOT EXISTS hub.schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 2. Apply 00000 compatibility shim first
    console.log("[Hub Migrator] Applying 00000_hub_compat_shim.sql...");
    const shimSql = fs.readFileSync(COMPAT_SHIM, "utf8");
    await client.query(shimSql);
    await client.query(
      "INSERT INTO hub.schema_migrations (version) VALUES ('00000_hub_compat_shim') ON CONFLICT DO NOTHING;"
    );

    // 3. Collect and sort all existing migrations
    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const { rows: appliedRows } = await client.query("SELECT version FROM hub.schema_migrations;");
    const appliedSet = new Set(appliedRows.map((r) => r.version));

    for (const file of migrationFiles) {
      const versionKey = path.basename(file, ".sql");
      if (appliedSet.has(versionKey)) {
        console.log(`[Hub Migrator] Skipping already applied: ${file}`);
        continue;
      }

      console.log(`[Hub Migrator] Applying migration: ${file}...`);
      const sqlContent = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");

      await client.query("BEGIN;");
      try {
        await client.query(sqlContent);
        await client.query("INSERT INTO hub.schema_migrations (version) VALUES ($1);", [versionKey]);
        await client.query("COMMIT;");
        console.log(`[Hub Migrator] Successfully applied: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK;");
        console.error(`[Hub Migrator] FAILED migration: ${file}`);
        throw err;
      }
    }

    console.log("[Hub Migrator] All migrations applied successfully!");
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runLocalMigrations().catch((err) => {
    console.error("[Hub Migrator] Fatal migration error:", err);
    process.exit(1);
  });
}

module.exports = { runLocalMigrations };
