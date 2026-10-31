// Expenses, daily check-ins and settings, stored only on the phone in SQLite.
// storage.web.ts has the same functions for the browser preview.
import * as SQLite from 'expo-sqlite';

import type { Expense, NewExpense } from './types';

const db = SQLite.openDatabaseSync('capy.db');

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    spoken TEXT NOT NULL DEFAULT '',
    createdAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS checkins (day TEXT PRIMARY KEY NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
`);

export function addExpense(e: NewExpense): void {
  db.runSync(
    'INSERT INTO expenses (amount, category, note, spoken, createdAt) VALUES (?, ?, ?, ?, ?)',
    e.amount,
    e.category,
    e.note,
    e.spoken,
    e.createdAt ?? Date.now(),
  );
}

export function deleteExpense(id: number): void {
  db.runSync('DELETE FROM expenses WHERE id = ?', id);
}

export function listExpenses(): Expense[] {
  return db.getAllSync<Expense>('SELECT * FROM expenses ORDER BY createdAt DESC LIMIT 5000');
}

export function listCheckins(): string[] {
  return db.getAllSync<{ day: string }>('SELECT day FROM checkins').map((r) => r.day);
}

export function addCheckin(day: string): void {
  db.runSync('INSERT OR IGNORE INTO checkins (day) VALUES (?)', day);
}

export function getSetting(key: string): string | null {
  return db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
}
