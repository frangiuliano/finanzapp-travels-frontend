import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightRow } from '@/components/insight-row';
import { insightsService } from '@/services/insightsService';
import { useExpensesChangedRefresh } from '@/hooks/useExpensesChangedRefresh';

interface MonthlyInsightsSectionProps {
  boardId: string;
  yearMonth: string;
}

export function MonthlyInsightsSection({
  boardId,
  yearMonth,
}: MonthlyInsightsSectionProps) {
  const expensesChangedRefresh = useExpensesChangedRefresh();

  const insightsQuery = useQuery({
    queryKey: ['monthly-insights', boardId, yearMonth, expensesChangedRefresh],
    queryFn: () => insightsService.getMonthlyInsights(boardId, yearMonth),
    enabled: !!boardId && !boardId.startsWith('mock-'),
  });

  if (!boardId || boardId.startsWith('mock-')) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Así viene tu mes</CardTitle>
      </CardHeader>
      <CardContent>
        {insightsQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        ) : insightsQuery.isError ? (
          <p className="py-2 text-center text-sm text-destructive">
            No se pudieron cargar los insights de este mes.
          </p>
        ) : (
          <div className="space-y-4">
            {(insightsQuery.data?.insights.insights ?? []).map((insight) => (
              <InsightRow key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
