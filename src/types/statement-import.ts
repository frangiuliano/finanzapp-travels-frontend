export type StatementLineSource = 'regex' | 'llm';

export interface StatementImportLine {
  tempId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  cuotaActual?: number;
  cuotaTotal?: number;
  confidence: number;
  parsedVia: StatementLineSource;
  isPossibleDuplicate: boolean;
  duplicateOfExpenseId?: string;
  duplicateOfDescription?: string;
  duplicateOfAmount?: number;
  duplicateOfDate?: string;
  rawText?: string;
}

export interface StatementImportStats {
  totalLines: number;
  possibleDuplicates: number;
  lowConfidenceDocument: boolean;
}

export interface StatementImportUploadResult {
  importId: string;
  lines: StatementImportLine[];
  stats: StatementImportStats;
  periodFrom: string;
  periodTo: string;
}

export interface StatementImportLineOverride {
  amount?: number;
  description?: string;
  categoryId?: string;
  expenseDate?: string;
  merchantName?: string;
}

export interface StatementImportSelection {
  tempId: string;
  include: boolean;
  overrides?: StatementImportLineOverride;
}

export interface StatementImportConfirmResult {
  created: number;
  failed: { tempId: string; message: string }[];
}
