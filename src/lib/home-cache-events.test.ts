import { afterEach, describe, expect, it } from 'vitest';
import { queryClient } from './query-client';
import { notifyExpensesChanged } from './expense-events';
import { notifyIncomesChanged } from './income-events';

describe('Inactive Home cache', () => {
  afterEach(() => queryClient.clear());
  it.each([notifyExpensesChanged, notifyIncomesChanged])(
    'invalidates cached Home data when a mutation happens on another page',
    async (notify) => {
      const key = ['home', 'user', 'board', 'forecast', '2026-10'];
      queryClient.setQueryData(key, { remaining: 100 });
      queryClient.setQueryData(['unrelated'], 'keep');
      notify();
      await Promise.resolve();
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['unrelated'])?.isInvalidated).toBe(
        false,
      );
    },
  );
});
