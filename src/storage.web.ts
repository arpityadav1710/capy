// Browser-preview version of storage.ts, kept in localStorage.
import type { Expense, NewExpense } from './types';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(`capy:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(`capy:${key}`, JSON.stringify(value));
  } catch {}
};

export function addExpense(e: NewExpense): void {
  const all = read<Expense[]>('expenses', []);
  const id = all.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  all.push({ id, amount: e.amount, category: e.category, note: e.note, spoken: e.spoken, createdAt: e.createdAt ?? Date.now() });
  write('expenses', all);
}

export function deleteExpense(id: number): void {
  write('expenses', read<Expense[]>('expenses', []).filter((e) => e.id !== id));
}

export function listExpenses(): Expense[] {
  return read<Expense[]>('expenses', []).sort((a, b) => b.createdAt - a.createdAt);
}

export function listCheckins(): string[] {
  return read<string[]>('checkins', []);
}

export function addCheckin(day: string): void {
  const all = new Set(listCheckins());
  all.add(day);
  write('checkins', [...all]);
}

export function getSetting(key: string): string | null {
  return read<Record<string, string>>('settings', {})[key] ?? null;
}

export function setSetting(key: string, value: string): void {
  write('settings', { ...read<Record<string, string>>('settings', {}), [key]: value });
}
