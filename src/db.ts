// Expenses are stored only on the phone, in a small SQLite database.
import * as SQLite from 'expo-sqlite';

import type { Category } from './parser';

export type Expense = {
  id: number;
  amount: number;
  category: Category;
  note: string;
  spoken: string;
  createdAt: number;
};

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
`);

export function addExpense(e: Omit<Expense, 'id' | 'createdAt'>): void {
  db.runSync(
    'INSERT INTO expenses (amount, category, note, spoken, createdAt) VALUES (?, ?, ?, ?, ?)',
    e.amount,
    e.category,
    e.note,
    e.spoken,
    Date.now(),
  );
}

export function deleteExpense(id: number): void {
  db.runSync('DELETE FROM expenses WHERE id = ?', id);
}

export function listExpenses(limit = 200): Expense[] {
  return db.getAllSync<Expense>('SELECT * FROM expenses ORDER BY createdAt DESC LIMIT ?', limit);
}

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const DAY = 24 * 60 * 60 * 1000;

export type Overview = {
  today: number;
  week: number;
  weekByCategory: { category: Category; total: number }[];
  streak: number;
};

export function getOverview(expenses: Expense[]): Overview {
  const todayStart = startOfDay(Date.now());
  const weekStart = todayStart - 6 * DAY;

  let today = 0;
  let week = 0;
  const byCat = new Map<Category, number>();
  const days = new Set<number>();

  for (const e of expenses) {
    days.add(startOfDay(e.createdAt));
    if (e.createdAt >= todayStart) today += e.amount;
    if (e.createdAt >= weekStart) {
      week += e.amount;
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
    }
  }

  // Streak counts back from today (or yesterday, so it isn't lost before you log today).
  let streak = 0;
  let day = days.has(todayStart) ? todayStart : todayStart - DAY;
  while (days.has(day)) {
    streak++;
    day = startOfDay(day - DAY / 2);
  }

  const weekByCategory = [...byCat.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return { today, week, weekByCategory, streak };
}
