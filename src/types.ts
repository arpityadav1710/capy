import type { Category } from './parser';

export type Expense = {
  id: number;
  amount: number;
  category: Category;
  note: string;
  spoken: string;
  createdAt: number;
};

export type NewExpense = Omit<Expense, 'id' | 'createdAt'> & { createdAt?: number };
