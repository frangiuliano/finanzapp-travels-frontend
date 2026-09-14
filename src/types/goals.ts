export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';

export type GoalPaceStatus =
  | 'undefined_pace'
  | 'on_track'
  | 'behind'
  | 'completed'
  | 'out_of_horizon'
  | 'currency_not_computable';

export interface Goal {
  _id: string;
  boardId: string;
  createdBy: string;
  name: string;
  icon?: string;
  targetAmount: number;
  currency: string;
  targetDate?: string;
  desiredMonthlyContribution?: number;
  priority: number;
  status: GoalStatus;
  useEstimatedFxForForecast: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalHoldingSelection {
  _id: string;
  goalId: string;
  holdingId: string;
  useEstimatedFx: boolean;
}

export interface GoalCheckpointHoldingValue {
  holdingId: string;
  currency: string;
  value: number;
  computable: boolean;
}

export interface GoalCheckpoint {
  _id: string;
  boardId: string;
  goalId: string;
  yearMonth: string;
  totalConsideredValue: number;
  valueByHolding: GoalCheckpointHoldingValue[];
  isBaseline: boolean;
  capturedAt: string;
}

export interface PlannerHoldingContributionResult {
  holdingId: string;
  currency: string;
  fullValue: number;
  computable: boolean;
  isEstimated: boolean;
  valueInGoalCurrencyIndividual: number | null;
  valueInGoalCurrencyJoint: number | null;
  sharedWithGoalIds: string[];
}

export interface PlannerGoalResult {
  goalId: string;
  status: GoalStatus;
  currentComputableValueIndividual: number;
  currentComputableValueJoint: number;
  remainingAmountIndividual: number;
  remainingAmountJoint: number;
  monthsAvailable: number | null;
  withinHorizon: boolean;
  requiredMonthlyContributionIndividual: number | null;
  requiredMonthlyContributionJoint: number | null;
  forecastCapacityComputable: boolean;
  averageMonthlyCapacity: number | null;
  viableIndividual: boolean | null;
  viableJoint: boolean | null;
  estimatedCompletionYearMonthIndividual: string | null;
  estimatedCompletionYearMonthJoint: string | null;
  tightestYearMonthIndividual: string | null;
  tightestYearMonthJoint: string | null;
  deficitIndividual: number | null;
  deficitJoint: number | null;
  negativeCapacityYearMonths: string[];
  holdingContributions: PlannerHoldingContributionResult[];
  paceStatusIndividual: GoalPaceStatus;
  paceStatusJoint: GoalPaceStatus;
}

export interface GoalWithResult {
  goal: Goal;
  selections: GoalHoldingSelection[];
  result: PlannerGoalResult;
}

export interface GoalsSummary {
  total: number;
  achievable: number;
  atRisk: number;
  insufficientData: number;
}

export interface GoalsListResponse {
  goals: GoalWithResult[];
  summary: GoalsSummary;
}

export interface GoalHoldingSelectionInput {
  holdingId: string;
  useEstimatedFx?: boolean;
}

export interface CreateGoalInput {
  name: string;
  icon?: string;
  targetAmount: number;
  currency: string;
  targetDate?: string;
  desiredMonthlyContribution?: number;
  priority?: number;
  useEstimatedFxForForecast?: boolean;
  holdingSelections?: GoalHoldingSelectionInput[];
}

export interface UpdateGoalInput {
  name?: string;
  icon?: string;
  targetAmount?: number;
  targetDate?: string;
  desiredMonthlyContribution?: number;
  priority?: number;
  status?: GoalStatus;
  useEstimatedFxForForecast?: boolean;
}

export interface UpdateGoalHoldingsInput {
  holdingSelections: GoalHoldingSelectionInput[];
}

export interface PreviewGoalInput extends CreateGoalInput {
  goalId?: string;
  status?: GoalStatus;
  holdingSelections: GoalHoldingSelectionInput[];
}

export interface GoalPreviewResponse {
  candidate: PlannerGoalResult;
  affectedGoals: Array<{
    goalId: string;
    name: string;
    before: PlannerGoalResult;
    after: PlannerGoalResult;
  }>;
}

export interface GoalProgressMonth {
  yearMonth: string;
  observedAdvance: number;
  expectedAdvance: number;
  difference: number;
  met: boolean;
}

export type GoalProgressResponse =
  | {
      hasEnoughData: false;
      message?: string;
      checkpoints?: GoalCheckpoint[];
    }
  | {
      hasEnoughData: true;
      months: GoalProgressMonth[];
      monthsMet: number;
      monthsMissed: number;
      currentRequiredMonthlyContribution: number | null;
      currentEstimatedCompletionYearMonth: string | null;
      note: string;
    };
