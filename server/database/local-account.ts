import type { Database } from "db0"
import type { LocalAccountInfo } from "#/types"

export class LocalAccountTable {
  private db
  constructor(db: Database) {
    this.db = db
  }

  async init() {
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS local_account (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created INTEGER,
        updated INTEGER
      );
    `).run()
    await this.db.prepare(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_local_account_username ON local_account(username);
    `).run()
    await this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_local_account_user_id ON local_account(user_id);
    `).run()
    logger.success(`init local account table`)
  }

  async addAccount(userID: string, username: string, passwordHash: string, passwordSalt: string) {
    const now = Date.now()
    const id = `local:${username}`
    await this.db.prepare(`
      INSERT INTO local_account (id, user_id, username, password_hash, password_salt, created, updated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userID, username, passwordHash, passwordSalt, now, now)
    logger.success(`add local account ${username}`)
  }

  async getByUsername(username: string) {
    return (await this.db.prepare(`
      SELECT id, user_id, username, password_hash, password_salt, created, updated
      FROM local_account
      WHERE username = ?
    `).get(username)) as LocalAccountInfo | undefined
  }
}
