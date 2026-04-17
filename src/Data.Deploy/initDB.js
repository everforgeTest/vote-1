const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const settings = require('../settings.json').settings;
const { Tables } = require('../Constants/Tables');

class DBInitializer {
  static async init() {
    const dbPath = settings.dbPath;

    if (!fs.existsSync(dbPath)) {
      const db = new sqlite3.Database(dbPath);
      await run(db, 'PRAGMA foreign_keys = ON');

      await run(db, `CREATE TABLE IF NOT EXISTS ${Tables.CONTRACTVERSION} (
        Id INTEGER,
        Version FLOAT NOT NULL,
        Description TEXT,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      await run(db, `CREATE TABLE IF NOT EXISTS ${Tables.PROPOSAL} (
        Id INTEGER,
        Title TEXT NOT NULL,
        Description TEXT,
        CreatedBy TEXT NOT NULL,
        Status TEXT DEFAULT 'OPEN',
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      await run(db, `CREATE TABLE IF NOT EXISTS ${Tables.VOTE} (
        Id INTEGER,
        ProposalId INTEGER NOT NULL,
        VoterPubKey TEXT NOT NULL,
        Choice TEXT NOT NULL,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY("Id" AUTOINCREMENT),
        UNIQUE(ProposalId, VoterPubKey),
        FOREIGN KEY(ProposalId) REFERENCES ${Tables.PROPOSAL}(Id)
      )`);

      await run(db, `CREATE TABLE IF NOT EXISTS ${Tables.ACTIVITYLOG} (
        Id INTEGER,
        ActivityType TEXT,
        User TEXT,
        Service TEXT,
        Action TEXT,
        Message TEXT,
        ExceptionMessage TEXT,
        TimeStamp TEXT,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      db.close();
    }

    if (fs.existsSync(settings.dbScriptsFolderPath)) {
      // Placeholder for script runner (no SQL files by default). Implement as needed.
    }
  }
}

function run(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) return reject(err);
      resolve({ lastId: this.lastID, changes: this.changes });
    });
  });
}

module.exports = { DBInitializer };
