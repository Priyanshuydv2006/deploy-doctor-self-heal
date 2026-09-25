'use strict';

const express = require('express');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ⚠️  BUG: hardcoded SQLite path crashes on Render's ephemeral filesystem
// Error: SQLITE_CANTOPEN: unable to open database file
// Deploy Doctor patch: replaced hardcoded SQLite path with DATABASE_URL env var.
// Set DATABASE_URL to a hosted DB connection string (e.g. PostgreSQL on Render)
// or leave unset to fall back to in-memory SQLite (data lost on restart — testing only).
const db =
new Database(process.env.DATABASE_URL || ':memory:');

db.prepare(`
  CREATE TABLE IF NOT EXISTS notes (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    text  TEXT NOT NULL,
    ts    INTEGER NOT NULL
  )
`).run();

app.get('/', (_req, res) => {
  res.json({ service: 'heal-demo-app', status: 'running' });
});

app.get('/notes', (_req, res) => {
  const notes = db.prepare('SELECT * FROM notes ORDER BY ts DESC LIMIT 20').all();
  res.json(notes);
});

app.post('/notes', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  const info = db.prepare('INSERT INTO notes (text, ts) VALUES (?, ?)').run(text, Date.now());
  res.status(201).json({ id: info.lastInsertRowid, text });
});


// Health-check endpoint (added by deploy-doctor)
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.listen(PORT, () => {
  console.log(`heal-demo-app listening on port ${PORT}`);
});
