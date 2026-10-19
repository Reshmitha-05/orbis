// Repository Quality Index & Diagnostic Types

export type CheckStatus = 'passed' | 'partial' | 'failed' | 'unverifiable';

export interface QualityCheck {
  id: string;
  category: 'documentation' | 'licensing' | 'ci_cd' | 'testing' | 'community' | 'dependencies' | 'maintenance';
  title: string;
  weight: number;
  earnedPoints: number;
  status: CheckStatus;
  evidence: string;
  explanation: string;
  recommendation: string;
  remediationLink?: string;
  isVerifiable: boolean;
}

export interface CategoryScore {
  category: string;
  title: string;
  maxWeight: number;
  earnedScore: number;
  percentage: number;
  checkCount: number;
  passedCount: number;
}

export type QualityGrade = 'A+' | 'A' | 'B' | 'C' | 'D';

export interface QualityAnalysisResult {
  repoFullName: string;
  repoName: string;
  owner: string;
  assessedAt: string;
  overallScore: number; // 0 - 100
  grade: QualityGrade;
  gradeDescription: string;
  categories: CategoryScore[];
  checks: QualityCheck[];
  summary: {
    passedChecks: number;
    failedChecks: number;
    unverifiableChecks: number;
    totalChecks: number;
  };
  repoMetadata: {
    description: string | null;
    stars: number;
    forks: number;
    openIssues: number;
    language: string | null;
    defaultBranch: string;
    licenseName: string | null;
    lastPushed: string;
    isArchived: boolean;
  };
  isDemoData?: boolean;
}

export interface QualitySnapshot {
  id: string;
  timestamp: string;
  repoFullName: string;
  score: number;
  grade: QualityGrade;
  passedCount: number;
  totalChecks: number;
  analysis: QualityAnalysisResult;
  notes?: string;
}
