import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightRow } from './insight-row';
import type { Insight, InsightType } from '@/types/insight';

function makeInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'total_variation:board-1:2026-09:total',
    type: 'total_variation',
    severity: 'negative',
    title: 'Tus gastos totales subieron',
    description: 'Gastaste un 18% más que en agosto: $24.000 adicionales.',
    categoryId: null,
    categoryName: null,
    installmentPlanId: null,
    installmentPlanLabel: null,
    currency: 'ARS',
    currentAmount: 118,
    previousAmount: 100,
    absoluteChange: 18,
    percentChange: 18,
    currentPeriod: '2026-09',
    previousPeriod: '2026-08',
    ...overrides,
  };
}

const ALL_TYPES: InsightType[] = [
  'total_variation',
  'category_increase',
  'category_decrease',
  'category_new',
  'installment_started',
  'installment_finished',
  'projected_variation',
  'insufficient_data',
  'no_activity',
  'future_month',
];

describe('InsightRow', () => {
  it.each(ALL_TYPES)(
    'renders the title and description for type "%s"',
    (type) => {
      const insight = makeInsight({
        type,
        title: `Título ${type}`,
        description: `Descripción ${type}`,
      });

      render(<InsightRow insight={insight} />);

      expect(screen.getByText(`Título ${type}`)).toBeInTheDocument();
      expect(screen.getByText(`Descripción ${type}`)).toBeInTheDocument();
    },
  );

  it('omits the title in compact mode but still shows the description', () => {
    const insight = makeInsight({ title: 'No debería verse' });

    render(<InsightRow insight={insight} compact />);

    expect(screen.queryByText('No debería verse')).not.toBeInTheDocument();
    expect(screen.getByText(insight.description)).toBeInTheDocument();
  });

  it('renders a null percentChange without crashing (e.g. category_new or insufficient_data)', () => {
    const insight = makeInsight({
      type: 'category_new',
      percentChange: null,
      previousAmount: 0,
      description: 'Este mes comenzaste a registrar gastos en Salud.',
    });

    render(<InsightRow insight={insight} />);

    expect(
      screen.getByText('Este mes comenzaste a registrar gastos en Salud.'),
    ).toBeInTheDocument();
  });

  it('renders long descriptions with word-wrap classes instead of a fixed width that would clip on mobile', () => {
    const longDescription =
      'Gastaste bastante más en Comida este mes comparado con el mes anterior, sumando un total considerable de gastos adicionales que vale la pena revisar.';
    const insight = makeInsight({ description: longDescription });

    render(<InsightRow insight={insight} />);

    const descriptionEl = screen.getByText(longDescription);
    expect(descriptionEl.className).toMatch(/overflow-wrap:anywhere/);
  });

  it('applies distinct severity classes for positive vs negative tone (not color-only: icon differs too)', () => {
    const { container: positiveContainer } = render(
      <InsightRow insight={makeInsight({ severity: 'positive' })} />,
    );
    const { container: negativeContainer } = render(
      <InsightRow insight={makeInsight({ severity: 'negative' })} />,
    );

    expect(positiveContainer.querySelector('svg')).not.toBeNull();
    expect(negativeContainer.querySelector('svg')).not.toBeNull();
    expect(positiveContainer.innerHTML).not.toBe(negativeContainer.innerHTML);
  });
});
