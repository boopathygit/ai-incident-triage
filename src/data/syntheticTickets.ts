import { IncidentTicket } from '../types';

export const SYNTHETIC_INCIDENT_DATASET: IncidentTicket[] = [
  // --- DATABASE INCIDENTS ---
  {
    id: "INC-2026-0101",
    title: "PostgreSQL Primary Connection Exhaustion - 100% Connections Reached",
    description: "Production Postgres primary is rejecting all new connections. Logs: 'FATAL: remaining connection slots are reserved for non-replication superuser connections'. Application pods across order-service and auth-service are throwing SequelizeConnectionAcquireTimeoutError. Customer transactions are failing globally. Active connection count: 2,500/2,500.",
    source: "monitoring",
    service: "postgres-primary",
    createdAt: "2026-09-11T14:15:00Z",
    reporter: "Datadog Alert: PostgresConnectionsMaxedOut",
    groundTruth: {
      severity: "P0",
      category: "Database",
      routedTeam: "Data & Database Platform",
      targetRunbookId: "RB-DB-001"
    }
  },
  {
    id: "INC-2026-0102",
    title: "ExclusiveLock Deadlock in Orders & Inventory Update Pipeline",
    description: "Checkout operations intermittently failing with 500 status. PostgreSQL log excerpt: 'ERROR: deadlock detected - Process 48194 waits for ExclusiveLock on tuple (1420, 18) of relation orders; blocked by Process 48201'. Lock wait queue has risen to 45 concurrent blocked queries. 12% of checkout attempts are failing.",
    source: "monitoring",
    service: "order-service",
    createdAt: "2026-09-11T14:18:22Z",
    reporter: "Sentry Alert: DBDeadlockSpike",
    groundTruth: {
      severity: "P1",
      category: "Database",
      routedTeam: "Data & Database Platform",
      targetRunbookId: "RB-DB-002"
    }
  },
  {
    id: "INC-2026-0103",
    title: "Slow Query Alert on Analytics Table Scan During Peak Hours",
    description: "Internal business analytics cron running on read replica with unindexed sequential scan on table `event_telemetry` (>40M rows). Replica CPU is at 78%, causing slight 200ms read lag on reporting dashboard. Customer facing critical APIs are unaffected.",
    source: "jira",
    service: "postgres-replica",
    createdAt: "2026-09-11T13:45:10Z",
    reporter: "analytics-team@internal",
    groundTruth: {
      severity: "P3",
      category: "Database",
      routedTeam: "Data & Database Platform",
      targetRunbookId: "RB-DB-001"
    }
  },

  // --- SECURITY & AUTH INCIDENTS ---
  {
    id: "INC-2026-0201",
    title: "JWT Signature Verification Failures Across All Edge API Requests",
    description: "API Gateway is throwing 401 Unauthorized for 100% of incoming customer requests with Bearer tokens. Error: 'JsonWebTokenError: invalid signature. Unable to verify JWT against JWKS URI: https://auth.company.com/.well-known/jwks.json'. Users cannot log in or perform any authenticated operations.",
    source: "pagerduty",
    service: "api-gateway",
    createdAt: "2026-09-11T14:22:05Z",
    reporter: "PagerDuty P0 Trigger: AuthGatewayTotalOutage",
    groundTruth: {
      severity: "P0",
      category: "Security & Auth",
      routedTeam: "Security Operations (SecOps)",
      targetRunbookId: "RB-SEC-001"
    }
  },
  {
    id: "INC-2026-0202",
    title: "Spike in Distributed Brute-Force Login Attempts (Credential Stuffing)",
    description: "WAF rate-limit rules tripped on POST /api/v1/auth/login. Over 85,000 login attempts in 10 minutes coming from 1,200 distinct residential IP proxies. Failure rate is 94%. Auth service CPU utilization is at 88% due to bcrypt hashing volume. No breach detected yet, but potential service degradation.",
    source: "monitoring",
    service: "auth-service",
    createdAt: "2026-09-11T14:05:40Z",
    reporter: "AWS WAF Security Alert",
    groundTruth: {
      severity: "P1",
      category: "Security & Auth",
      routedTeam: "Security Operations (SecOps)",
      targetRunbookId: "RB-SEC-002"
    }
  },
  {
    id: "INC-2026-0203",
    title: "Expired Secondary Service-to-Service mTLS Certificate Warning",
    description: "Cert-manager logged warning: Internal mTLS leaf certificate for telemetry-collector-service will expire in 36 hours. Auto-renewal failed due to DNS challenge timeout. No customer traffic affected yet, but will fail if not renewed.",
    source: "monitoring",
    service: "telemetry-collector-service",
    createdAt: "2026-09-11T12:10:00Z",
    reporter: "cert-manager-bot",
    groundTruth: {
      severity: "P2",
      category: "Security & Auth",
      routedTeam: "Security Operations (SecOps)",
      targetRunbookId: "RB-SEC-003"
    }
  },

  // --- INFRASTRUCTURE & CLOUD INCIDENTS ---
  {
    id: "INC-2026-0301",
    title: "Kubernetes Pod OOMKilled CrashLoop in Search Service",
    description: "Search service pods in production namespace are repeatedly crashing with exit code 137: 'Last State: Terminated, Reason: OOMKilled'. 8 out of 10 replicas are in CrashLoopBackOff. User product searches are failing with 503 Service Unavailable across the web store.",
    source: "monitoring",
    service: "search-service",
    createdAt: "2026-09-11T14:30:15Z",
    reporter: "Prometheus: KubePodCrashLooping",
    groundTruth: {
      severity: "P0",
      category: "Infrastructure & Cloud",
      routedTeam: "SRE & Infrastructure",
      targetRunbookId: "RB-INFRA-001"
    }
  },
  {
    id: "INC-2026-0302",
    title: "Elasticsearch Data Node PVC Disk Space at 96% Capacity",
    description: "Storage on volume /var/data on elasticsearch-data-2 is at 96.4% utilization. Disk space is predicted to be completely exhausted within 45 minutes if unaddressed. Write operations will transition to read-only once 98% is hit.",
    source: "monitoring",
    service: "elasticsearch",
    createdAt: "2026-09-11T14:02:11Z",
    reporter: "Prometheus: DiskSpaceFillingUp",
    groundTruth: {
      severity: "P1",
      category: "Infrastructure & Cloud",
      routedTeam: "SRE & Infrastructure",
      targetRunbookId: "RB-INFRA-002"
    }
  },
  {
    id: "INC-2026-0303",
    title: "Nightly Backup Snapshot Verification Warning on Staging Cluster",
    description: "Nightly Velero backup snapshot completed with non-fatal warning: 2 temporary configmap volume claims skipped on staging cluster. Production backups verified successfully.",
    source: "jira",
    service: "backup-operator",
    createdAt: "2026-09-11T08:00:00Z",
    reporter: "sre-cron-bot",
    groundTruth: {
      severity: "P3",
      category: "Infrastructure & Cloud",
      routedTeam: "SRE & Infrastructure",
      targetRunbookId: "RB-INFRA-002"
    }
  },

  // --- API & MICROSERVICES INCIDENTS ---
  {
    id: "INC-2026-0401",
    title: "API Gateway Circuit Breaker Tripped on Checkout Microservice",
    description: "Edge API Gateway opened circuit breaker for downstream checkout-service. Upstream gateway timeouts (HTTP 504) spiked to 450 requests/min. Thread pool in Envoy ingress has hit saturation. New orders cannot be completed.",
    source: "pagerduty",
    service: "api-gateway",
    createdAt: "2026-09-11T14:35:10Z",
    reporter: "Envoy CircuitBreakerOpen Alert",
    groundTruth: {
      severity: "P0",
      category: "API & Microservices",
      routedTeam: "Core API & Microservices",
      targetRunbookId: "RB-API-001"
    }
  },
  {
    id: "INC-2026-0402",
    title: "Redis Primary Cache Stampede and 100% CPU Saturation",
    description: "Redis cluster primary node `redis-primary-01` CPU utilization at 100%. Connected clients count jumped to 10,000 (maxclients ceiling). Hot cache key `catalog_top_categories_v2` expired without pre-warming, causing massive avalanche of identical DB queries. Catalog endpoints P99 latency jumped to 3,400ms.",
    source: "monitoring",
    service: "redis",
    createdAt: "2026-09-11T14:12:00Z",
    reporter: "Grafana Redis HighCPULatency Alert",
    groundTruth: {
      severity: "P1",
      category: "API & Microservices",
      routedTeam: "Core API & Microservices",
      targetRunbookId: "RB-API-002"
    }
  },
  {
    id: "INC-2026-0403",
    title: "Deprecated V1 Recommendation API Endpoint Returning Deprecation Headers",
    description: "Some legacy mobile app clients still calling `/api/v1/recommendations` instead of `/api/v2`. Endpoint is serving normally but logging high volume of Sunset header telemetry. No error rates or outages observed.",
    source: "jira",
    service: "recommendation-service",
    createdAt: "2026-09-11T11:30:00Z",
    reporter: "mobile-team-lead",
    groundTruth: {
      severity: "P3",
      category: "API & Microservices",
      routedTeam: "Core API & Microservices",
      targetRunbookId: "RB-API-003"
    }
  },

  // --- BILLING & PAYMENTS INCIDENTS ---
  {
    id: "INC-2026-0501",
    title: "Stripe Webhook Signature Verification Failure - 100% Dropped Payments",
    description: "Payment microservice is returning 400 Bad Request to all Stripe webhook callbacks. Error log: 'StripeSignatureVerificationError: No signatures found matching the expected signature for payload'. Customer subscriptions are not being provisioned and payments are not being reconciled in DB. 1,400 webhook events failed in last 30 minutes.",
    source: "monitoring",
    service: "payment-service",
    createdAt: "2026-09-11T14:28:44Z",
    reporter: "Stripe Webhook Delivery Monitor",
    groundTruth: {
      severity: "P0",
      category: "Billing & Payments",
      routedTeam: "Payments & Monetization",
      targetRunbookId: "RB-PAY-001"
    }
  },
  {
    id: "INC-2026-0502",
    title: "Spike in Idempotency Key Conflicts on Checkout Purchase Submissions",
    description: "Payment API experiencing surge in 409 Conflict errors. Logs indicate client apps submitting identical `Idempotency-Key` headers on double-click checkout actions before the first request finishes processing. Affecting ~4% of checkout attempts.",
    source: "user_report",
    service: "payment-service",
    createdAt: "2026-09-11T13:50:00Z",
    reporter: "Customer Support Escalation: Users reporting double-click error",
    groundTruth: {
      severity: "P2",
      category: "Billing & Payments",
      routedTeam: "Payments & Monetization",
      targetRunbookId: "RB-PAY-002"
    }
  },

  // --- FRONTEND & CLIENT INCIDENTS ---
  {
    id: "INC-2026-0601",
    title: "Frontend ChunkLoadError Spike After Release 4.18.0",
    description: "Sentry alert: 12,500 ChunkLoadError events in 15 minutes. Error: 'ChunkLoadError: Loading chunk 842 failed (missing: https://cdn.company.com/assets/842.a9f4c.js)'. Users who have not refreshed the browser are seeing white screens and broken routing upon clicking navigational links.",
    source: "monitoring",
    service: "web-app",
    createdAt: "2026-09-11T14:32:00Z",
    reporter: "Sentry Error Trigger: ChunkLoadError",
    groundTruth: {
      severity: "P1",
      category: "Frontend & Client",
      routedTeam: "Frontend Platform",
      targetRunbookId: "RB-FE-001"
    }
  },
  {
    id: "INC-2026-0602",
    title: "Footer Copyright Year Misaligned on Mobile Safari Viewport",
    description: "User reported footer copyright text wraps awkwardly on iPhone 13 mini Safari browser. Purely cosmetic visual layout issue. No functional loss or broken links.",
    source: "user_report",
    service: "web-app",
    createdAt: "2026-09-11T10:15:00Z",
    reporter: "qa-team",
    groundTruth: {
      severity: "P3",
      category: "Frontend & Client",
      routedTeam: "Frontend Platform",
      targetRunbookId: "RB-FE-001"
    }
  },

  // --- NETWORK & CDN INCIDENTS ---
  {
    id: "INC-2026-0701",
    title: "Cluster-Wide CoreDNS Resolution Timeouts Causing Cascading Failures",
    description: "Internal Kubernetes DNS resolution failing across all namespaces. Pod logs reporting 'dial tcp: lookup order-service.production.svc.cluster.local: i/o timeout'. CoreDNS pods CPU utilization at 100%. External payment and monitoring APIs are unreachable from inside cluster. Global API error rate at 85%.",
    source: "pagerduty",
    service: "coredns",
    createdAt: "2026-09-11T14:36:12Z",
    reporter: "PagerDuty P0 Trigger: ClusterDNSDown",
    groundTruth: {
      severity: "P0",
      category: "Network & CDN",
      routedTeam: "SRE & Infrastructure",
      targetRunbookId: "RB-NET-001"
    }
  },
  {
    id: "INC-2026-0702",
    title: "Elevated Edge Ingress Latency in US-West Region",
    description: "Cloudflare reports 180ms latency increase for transit between Seattle POP and origin load balancer due to upstream ISP fiber cut. Error rate remains low at 0.05%, but user interactive TTFB is degraded for Pacific Northwest users.",
    source: "monitoring",
    service: "ingress-controller",
    createdAt: "2026-09-11T12:40:00Z",
    reporter: "Cloudflare Edge Telemetry",
    groundTruth: {
      severity: "P2",
      category: "Network & CDN",
      routedTeam: "SRE & Infrastructure",
      targetRunbookId: "RB-NET-002"
    }
  }
];

export function generateSyntheticIncident(categoryPreference?: string, severityPreference?: string): IncidentTicket {
  const categories = ['Database', 'Security & Auth', 'Infrastructure & Cloud', 'API & Microservices', 'Billing & Payments', 'Frontend & Client', 'Network & CDN'];
  const severities = ['P0', 'P1', 'P2', 'P3'];

  // Filter pool based on preferences if provided
  let pool = SYNTHETIC_INCIDENT_DATASET;
  if (categoryPreference) {
    pool = pool.filter(t => t.groundTruth?.category.toLowerCase() === categoryPreference.toLowerCase());
  }
  if (severityPreference) {
    pool = pool.filter(t => t.groundTruth?.severity === severityPreference);
  }
  if (pool.length === 0) pool = SYNTHETIC_INCIDENT_DATASET;

  const base = pool[Math.floor(Math.random() * pool.length)];
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return {
    ...base,
    id: `INC-SIM-${randomSuffix}`,
    title: `[SIMULATED] ${base.title}`,
    createdAt: new Date().toISOString()
  };
}
