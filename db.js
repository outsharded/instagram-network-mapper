const Database = require('better-sqlite3');
const db = new Database('insta_network.db');

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    full_name TEXT,
    is_private INTEGER
  );

  CREATE TABLE IF NOT EXISTS connections (
    source TEXT,
    target TEXT,
    PRIMARY KEY (source, target),
    FOREIGN KEY (source) REFERENCES users(username),
    FOREIGN KEY (target) REFERENCES users(username)
  );

  CREATE TABLE IF NOT EXISTS processed (
    username TEXT PRIMARY KEY
  );
`);

function insertUser(user) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO users (username, full_name, is_private)
    VALUES (?, ?, ?)
  `);
  stmt.run(user.username, user.full_name, user.is_private ? 1 : 0);
}

function insertConnection(source, target) {
    if (!source || !target) {
      console.warn('Skipping invalid connection:', source, target);
      return;
    }
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO connections (source, target)
      VALUES (?, ?)
    `);
    stmt.run(source, target);
  }
  

function markProcessed(username) {
  db.prepare(`INSERT OR IGNORE INTO processed (username) VALUES (?)`).run(username);
}

function isProcessed(username) {
  const row = db.prepare(`SELECT 1 FROM processed WHERE username = ?`).get(username);
  return !!row;
}

function getAllUsers() {
  return db.prepare(`SELECT * FROM users`).all();
}

function getAllConnections() {
  return db.prepare(`SELECT * FROM connections`).all();
}

function hasUser(username) {
    const row = db.prepare(`SELECT 1 FROM users WHERE username = ?`).get(username);
    return !!row;
  }
  
  function isUserPrivate(username) {
    const row = db.prepare(`SELECT is_private FROM users WHERE username = ?`).get(username);
    return row ? row.is_private === 1 : false;
  }
  

module.exports = {
  insertUser,
  insertConnection,
  markProcessed,
  isProcessed,
  getAllUsers,
  getAllConnections,
  hasUser,
  isUserPrivate,
  db
};
