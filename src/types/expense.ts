import { z } from 'zod';

export const expenseSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number(),
  currency: z.string(),
  tripName: z.string(),
  type: z.enum(['shared', 'personal']),
  createdAt: z.string(),
  createdBy: z.string(),
});

export type Expense = z.infer<typeof expenseSchema>;
