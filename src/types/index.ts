export type SeverityLevel = 'P0' | 'P1' | 'P2' | 'P3';

export type IncidentCategory =
  | 'Database'
  | 'Security & Auth'
  | 'Infrastructure & Cloud'
  | 'API & Microservices'
  | 'Frontend & Client'
  | 'Billing & Payments'
  | 'Network & CDN';

export interface Runbook {
  id: string;
  title: string;
  category: IncidentCategory;
  symptoms: string[];
  root_causes: string[];
  diagnostic_commands: string[];
  mitigation_steps: string[];
  long_term_fix: string;
  primary_team: string;
  related_services: string[];
  tags: string[];
}

export interface MatchedRunbook {
  runbook: Runbook;
  relevanceScore: number;
  matchedKeywords: string[];
}

export interface IncidentTicket {
  id: string;
  title: string;
  description: string;
  source: 'monitoring' | 'user_report' | 'synthetic_stream' | 'jira' | 'pagerduty';
  service?: string;
  createdAt: string;
  reporter?: string;
  groundTruth?: {
    severity: SeverityLevel;
    category: IncidentCategory;
    routedTeam: string;
    targetRunbookId: string;
  };
}

export interface TeamRoutingInfo {
  teamId: string;
  teamName: string;
  leadOnCall: string;
  slackChannel: string;
  escalationPolicy: string;
  slaResponseTime: string;
  description: string;
  supportedCategories: IncidentCategory[];
}

export interface TriageResult {
  ticketId: string;
  title: string;
  severity: SeverityLevel;
  severityReasoning: string;
  category: IncidentCategory;
  categoryReasoning: string;
  blastRadius: string;
  assignedTeam: TeamRoutingInfo;
  slaTarget: string;
  suggestedRemediation: {
    summary: string;
    immediateActions: string[];
    diagnosticCommands: string[];
    longTermFix: string;
  };
  matchedRunbooks: MatchedRunbook[];
  confidenceScore: number;
  engineUsed: string;
  tokenUsage?: {
    promptTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  triagedAt: string;
  processingTimeMs: number;
}

export interface BenchmarkMetrics {
  totalEvaluated: number;
  severityAccuracy: number;
  categoryAccuracy: number;
  routingAccuracy: number;
  ragTop1HitRate: number;
  ragTop3HitRate: number;
  averageLatencyMs: number;
  confusionMatrix: {
    severity: Record<SeverityLevel, Record<SeverityLevel, number>>;
    category: Record<string, Record<string, number>>;
  };
  detailedResults: Array<{
    ticketId: string;
    title: string;
    groundTruth: {
      severity: SeverityLevel;
      category: IncidentCategory;
      team: string;
    };
    predicted: {
      severity: SeverityLevel;
      category: IncidentCategory;
      team: string;
    };
    severityMatch: boolean;
    categoryMatch: boolean;
    teamMatch: boolean;
    ragHit: boolean;
    latencyMs: number;
  }>;
}

