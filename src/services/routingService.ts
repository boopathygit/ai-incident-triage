import { IncidentCategory, SeverityLevel, TeamRoutingInfo } from '../types';

export const TEAMS_REGISTRY: Record<string, TeamRoutingInfo> = {
  'data-platform': {
    teamId: 'data-platform',
    teamName: 'Data & Database Platform',
    leadOnCall: 'Sarah Jenkins (Principal DBA)',
    slackChannel: '#incident-db-platform',
    escalationPolicy: 'Page primary DBA -> Page data infra lead -> Page VP Eng',
    slaResponseTime: 'P0: 15m | P1: 30m | P2: 4h | P3: 24h',
    description: 'Responsible for PostgreSQL, PgBouncer, Redis cache, replication, and data persistence layers.',
    supportedCategories: ['Database']
  },
  'secops': {
    teamId: 'secops',
    teamName: 'Security Operations (SecOps)',
    leadOnCall: 'Alex Vance (Security Incident Commander)',
    slackChannel: '#incident-security-war-room',
    escalationPolicy: 'Instant PagerDuty war room -> Notify CISO within 30 minutes',
    slaResponseTime: 'P0: 10m | P1: 20m | P2: 2h | P3: 12h',
    description: 'Responsible for authentication, JWTs, WAF, DDoS mitigation, certificates, and intrusion response.',
    supportedCategories: ['Security & Auth']
  },
  'sre-infra': {
    teamId: 'sre-infra',
    teamName: 'SRE & Infrastructure',
    leadOnCall: 'Marcus Chen (Staff SRE)',
    slackChannel: '#incident-sre-ops',
    escalationPolicy: 'Page on-call SRE -> Page cloud architect -> Page Director of Infra',
    slaResponseTime: 'P0: 15m | P1: 30m | P2: 4h | P3: 24h',
    description: 'Responsible for Kubernetes clusters, CoreDNS, cloud networking, persistent storage, and ingress.',
    supportedCategories: ['Infrastructure & Cloud', 'Network & CDN']
  },
  'core-api': {
    teamId: 'core-api',
    teamName: 'Core API & Microservices',
    leadOnCall: 'Elena Rostova (Tech Lead Backend)',
    slackChannel: '#incident-backend-services',
    escalationPolicy: 'Page service on-call -> Escalate to API gateway team',
    slaResponseTime: 'P0: 15m | P1: 45m | P2: 4h | P3: 24h',
    description: 'Responsible for API Gateway, microservice mesh, inter-service communications, and circuit breakers.',
    supportedCategories: ['API & Microservices']
  },
  'payments': {
    teamId: 'payments',
    teamName: 'Payments & Monetization',
    leadOnCall: 'David Kalu (Billing Systems Architect)',
    slackChannel: '#incident-monetization-critical',
    escalationPolicy: 'Immediate page -> Notify Finance & Ops Director on P0',
    slaResponseTime: 'P0: 15m | P1: 30m | P2: 2h | P3: 24h',
    description: 'Responsible for Stripe webhooks, checkout flows, subscription provisioning, and revenue reconciliation.',
    supportedCategories: ['Billing & Payments']
  },
  'frontend': {
    teamId: 'frontend',
    teamName: 'Frontend Platform',
    leadOnCall: 'Chloe Rivera (Staff Web Architect)',
    slackChannel: '#incident-web-frontend',
    escalationPolicy: 'Page web team on-call -> CDN edge on-call',
    slaResponseTime: 'P0: 30m | P1: 1h | P2: 6h | P3: 48h',
    description: 'Responsible for React/Vite single page applications, CDN asset distribution, and client Sentry errors.',
    supportedCategories: ['Frontend & Client']
  }
};

export function routeToTeam(category: IncidentCategory, service?: string, description?: string): TeamRoutingInfo {
  const text = `${service || ''} ${description || ''}`.toLowerCase();

  // Specific overrides based on text signals
  if (text.includes('certificate') || text.includes('mtls') || text.includes('jwt') || text.includes('jwks')) {
    return TEAMS_REGISTRY['secops'];
  }
  if (text.includes('stripe') || (text.includes('checkout') && text.includes('idempotency'))) {
    return TEAMS_REGISTRY['payments'];
  }
  if (text.includes('coredns') || (text.includes('dns') && !text.includes('challenge')) || text.includes('edge transit') || text.includes('fiber')) {
    return TEAMS_REGISTRY['sre-infra'];
  }
  if (text.includes('redis') && (category === 'API & Microservices' || text.includes('cache stampede'))) {
    return TEAMS_REGISTRY['core-api'];
  }

  // Category mapping
  switch (category) {
    case 'Database':
      return TEAMS_REGISTRY['data-platform'];
    case 'Security & Auth':
      return TEAMS_REGISTRY['secops'];
    case 'Infrastructure & Cloud':
    case 'Network & CDN':
      return TEAMS_REGISTRY['sre-infra'];
    case 'API & Microservices':
      return TEAMS_REGISTRY['core-api'];
    case 'Billing & Payments':
      return TEAMS_REGISTRY['payments'];
    case 'Frontend & Client':
      return TEAMS_REGISTRY['frontend'];
    default:
      return TEAMS_REGISTRY['sre-infra'];
  }
}

export function calculateSlaTarget(severity: SeverityLevel): string {
  switch (severity) {
    case 'P0':
      return '15 Minutes (Critical Outage - Immediate Page)';
    case 'P1':
      return '30 Minutes (Major Impairment - On-Call Action)';
    case 'P2':
      return '4 Hours (Moderate Degradation - Business Hours)';
    case 'P3':
      return '24 Hours (Minor Issue / Cosmetic Defect)';
  }
}
