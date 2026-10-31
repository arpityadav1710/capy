// Totals, streaks and chart data worked out from the saved expenses.
import { CATEGORIES, type Category } from './parser';
import type { Expense } from './types';

const DAY = 24 * 60 * 60 * 1000;

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "2026-11-01" in local time. */
export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const prevDay = (t: number) => startOfDay(startOfDay(t) - DAY / 2);
export const nextDay = (t: number) => startOfDay(startOfDay(t) + DAY * 1.5);

export function expensesOn(expenses: Expense[], day: number): Expense[] {
  const start = startOfDay(day);
  const end = nextDay(start);
  return expenses.filter((e) => e.createdAt >= start && e.createdAt < end);
}

export const sum = (expenses: Expense[]) => expenses.reduce((s, e) => s + e.amount, 0);

/** Days that count towards the streak: any day with an expense or a check-in. */
export function activeDays(expenses: Expense[], checkins: string[]): Set<string> {
  const days = new Set(checkins);
  for (const e of expenses) days.add(dayKey(e.createdAt));
  return days;
}

/** Counts back from today, or from yesterday so the streak isn't lost before you log today. */
export function streak(active: Set<string>, now = Date.now()): number {
  let day = active.has(dayKey(now)) ? startOfDay(now) : prevDay(now);
  let n = 0;
  while (active.has(dayKey(day))) {
    n++;
    day = prevDay(day);
  }
  return n;
}

export type Band = { category: Category; amount: number };

/** Today's spend grouped by category, in the order it was first spent (for the stacked bands). */
export function bandsFor(dayExpenses: Expense[]): Band[] {
  const order: Category[] = [];
  const totals = new Map<Category, number>();
  for (const e of [...dayExpenses].sort((a, b) => a.createdAt - b.createdAt)) {
    if (!totals.has(e.category)) order.push(e.category);
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }
  return order.map((category) => ({ category, amount: totals.get(category)! }));
}

export type ChartColumn = { label: string; total: number; bands: Band[]; highlight: boolean };
export type Range = 'days' | 'weeks' | 'months';

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Columns for the summary chart: last 7 days, last 4 weeks (daily average) or last 6 months. */
export function chartColumns(expenses: Expense[], range: Range, now = Date.now()): ChartColumn[] {
  const today = startOfDay(now);
  const cols: ChartColumn[] = [];

  if (range === 'days') {
    let day = today;
    for (let i = 0; i < 7; i++) {
      const list = expensesOn(expenses, day);
      cols.unshift({ label: WEEKDAY[new Date(day).getDay()], total: sum(list), bands: bandsFor(list), highlight: i === 0 });
      day = prevDay(day);
    }
  } else if (range === 'weeks') {
    let end = nextDay(today);
    for (let i = 0; i < 4; i++) {
      const start = startOfDay(end - 7 * DAY + DAY / 2);
      const list = expenses.filter((e) => e.createdAt >= start && e.createdAt < end);
      const avg = (b: Band[]) => b.map((x) => ({ ...x, amount: x.amount / 7 }));
      cols.unshift({ label: i === 0 ? 'This wk' : `${i}w ago`, total: sum(list) / 7, bands: avg(bandsFor(list)), highlight: i === 0 });
      end = start;
    }
  } else {
    const d = new Date(today);
    for (let i = 0; i < 6; i++) {
      const start = new Date(d.getFullYear(), d.getMonth() - i, 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 1).getTime();
      const list = expenses.filter((e) => e.createdAt >= start && e.createdAt < end);
      cols.unshift({ label: MONTH[new Date(start).getMonth()], total: sum(list), bands: bandsFor(list), highlight: i === 0 });
    }
  }
  return cols;
}

/** Share of spend per category across the given columns, biggest first. */
export function legendFor(cols: ChartColumn[]): { category: Category; share: number }[] {
  const totals = new Map<Category, number>();
  for (const c of cols) for (const b of c.bands) totals.set(b.category, (totals.get(b.category) ?? 0) + b.amount);
  const all = [...totals.values()].reduce((s, v) => s + v, 0) || 1;
  return CATEGORIES.filter((c) => totals.has(c))
    .map((category) => ({ category, share: (totals.get(category)! / all) * 100 }))
    .sort((a, b) => b.share - a.share);
}

/** Playful headline for the day-complete celebration, e.g. "Thrifty Tuesday!". */
export function dayHeadline(now = Date.now(), overBudget = false): string {
  const names = [
    ['Steady Sunday', 'Sunny Sunday'],
    ['Mindful Monday', 'Mighty Monday'],
    ['Thrifty Tuesday', 'Tidy Tuesday'],
    ['Wise Wednesday', 'Winning Wednesday'],
    ['Thoughtful Thursday', 'Tidy Thursday'],
    ['Frugal Friday', 'Fabulous Friday'],
    ['Smart Saturday', 'Super Saturday'],
  ];
  const day = new Date(now).getDay();
  return `${names[day][overBudget ? 1 : 0]}!`;
}
