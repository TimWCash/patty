import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "hub.db");

declare global {
  // eslint-disable-next-line no-var
  var __hubDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (global.__hubDb) return global.__hubDb;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(fs.readFileSync(path.join(process.cwd(), "src/lib/schema.sql"), "utf-8"));
  global.__hubDb = db;
  return db;
}
