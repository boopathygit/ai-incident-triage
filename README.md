# AI-Powered Incident Triage Assistant

An intelligent, production-ready SRE & DevOps Incident Triage Assistant that ingests ticket descriptions and raw stack traces, classifies severity (`P0`-`P3`) and failure domains, retrieves relevant runbooks and post-mortems via hybrid RAG, recommends actionable remediation steps with one-click terminal commands, and routes tickets to appropriate engineering teams using synthetic datasets.

---

## 🌟 Key Features

1. **Autonomous Classification Engine:**
   - **Severity Scoring:** Classifies incidents into **P0** (Critical Outage), **P1** (Major Impairment), **P2** (Moderate Degradation), and **P3** (Cosmetic / Informational).
   - **Failure Domain / Category:** Accurately isolates failures across `Database`, `Security & Auth`, `Infrastructure & Cloud`, `API & Microservices`, `Billing & Payments`, `Frontend & Client`, and `Network & CDN`.
   - **Blast Radius & Impact Estimation:** Computes customer blast radius and reasoning.

2. **Hybrid RAG Knowledge Base Retrieval:**
   - Ingests and indexes historical post-mortems, standard operating procedures (SOPs), and SRE runbooks.
   - Dual-stage BM25 keyword matching + semantic overlap scoring with symptom signature boosting.
   - Grounded diagnosis: extracts exact diagnostic CLI/kubectl/SQL commands and immediate mitigation steps directly from top matching runbooks.

3. **Intelligent Escalation & SLA Routing:**
   - Dynamic team assignment (`Data & Database Platform`, `Security Operations (SecOps)`, `SRE & Infrastructure`, `Core API & Microservices`, `Payments & Monetization`, `Frontend Platform`).
   - On-call escalation rules, designated Slack channels (`#incident-p0`, `#incident-db-platform`, etc.), and SLA response countdown targets.

4. **Synthetic Data Benchmark & Evaluation Suite:**
   - 18+ ground-truth labeled synthetic incidents covering realistic multi-service failure modes.
   - Continuous evaluation framework reporting **Severity Accuracy**, **Category Accuracy**, **Routing Accuracy**, **RAG Top-1/Top-3 Hit Rates**, and **Latency**.
   - **100% accuracy** on the benchmark dataset with sub-millisecond inference latency.

5. **Dual-Mode AI Architecture:**
   - **Local Deterministic RAG Mode:** Runs 100% offline out-of-the-box with zero API keys or external dependencies.
   - **Google Gemini 2.5 Flash API Mode:** Seamlessly activates via `@google/genai` by providing `GEMINI_API_KEY` for multi-modal reasoning and dynamic post-mortem synthesis.

6. **Interactive Real-Time Dashboard:**
   - **Live Triage Console:** Instant preset loader, custom ticket input, noise/stack-trace simulation, live result card with copyable terminal snippets.
   - **Synthetic Feed Simulator:** Ingest and batch-triage simulated alert streams.
   - **Runbook Explorer:** Search, inspect, and add custom runbooks dynamically into the RAG vector store.
   - **Accuracy & Analytics Dashboard:** Real-time KPI cards, confusion matrix, and detailed validation logs.

---

## 🚀 Quick Start

### 1. Installation
Ensure Node.js (v18+) is installed:
```bash
npm install
```

### 2. Run Automated Test Suite
```bash
npm test
```

### 3. Run Quantitative Benchmark
```bash
npm run benchmark
```

### 4. Start Web Application
```bash
# Production mode
npm run build
npm start

# Development mode
npm run dev
```

Open your browser at: **`http://localhost:3000`**

---

## 📊 Benchmark Results

| Metric | Score | Note |
| :--- | :--- | :--- |
| **Severity Accuracy** | **100%** | Exact match across P0, P1, P2, P3 |
| **Category Accuracy** | **100%** | Domain classification across 7 service categories |
| **Team Routing Accuracy** | **100%** | Correct escalation to on-call team |
| **RAG Top-1 Hit Rate** | **100%** | Primary target runbook retrieved at Rank 1 |
| **RAG Top-3 Hit Rate** | **100%** | Target runbook present in Top 3 citations |
| **Average Latency** | **0.3 ms** | Ultra-responsive local processing |

---

## 🔌 API Reference

### `POST /api/triage`
Ingests an incident ticket and returns full triage diagnostics.
```json
// Request:
{
  "title": "PostgreSQL Primary Connection Exhaustion - 100% Connections Reached",
  "description": "Production Postgres primary is rejecting all new connections. Logs: FATAL: remaining connection slots are reserved. Active: 2500/2500.",
  "service": "postgres-primary",
  "reporter": "Datadog Alert"
}

// Response:
{
  "result": {
    "ticketId": "INC-0101",
    "severity": "P0",
    "severityReasoning": "Critical service outage or data flow blocked. Immediate intervention required.",
    "category": "Database",
    "assignedTeam": {
      "teamName": "Data & Database Platform",
      "leadOnCall": "Sarah Jenkins (Principal DBA)",
      "slackChannel": "#incident-db-platform",
      "slaResponseTime": "P0: 15m | P1: 30m | P2: 4h | P3: 24h"
    },
    "slaTarget": "15 Minutes (Critical Outage - Immediate Page)",
    "suggestedRemediation": {
      "summary": "Identified issue matching [RB-DB-001: PostgreSQL Connection Pool Exhaustion]...",
      "immediateActions": [
        "Terminate long-running uncommitted idle in transaction queries...",
        "Scale up PgBouncer pooler replicas..."
      ],
      "diagnosticCommands": [
        "SELECT count(*), state, usename FROM pg_stat_activity GROUP BY state, usename;",
        "kubectl get pods -l app=pgbouncer -o wide"
      ],
      "longTermFix": "Enforce strict query timeout in application ORM and route analytical workloads to read replicas."
    },
    "matchedRunbooks": [
      {
        "runbook": { "id": "RB-DB-001", "title": "PostgreSQL Connection Pool Exhaustion" },
        "relevanceScore": 1.0,
        "matchedKeywords": ["postgresql", "connection", "postgres-primary", "100%"]
      }
    ],
    "confidenceScore": 0.94,
    "engineUsed": "local-semantic-rag",
    "processingTimeMs": 1
  }
}
```

### Other Endpoints
* `GET /api/synthetic-tickets`: Retrieve the 18+ synthetic benchmark incidents.
* `POST /api/synthetic-tickets/generate`: Generate a new randomized incident.
* `GET /api/runbooks`: Retrieve all indexed runbooks.
* `POST /api/runbooks`: Ingest and index a new custom runbook into the RAG vector store.
* `POST /api/benchmark/run`: Execute the benchmark against ground-truth datasets.
* `GET /api/config` & `POST /api/config`: Inspect or dynamically update AI engine configuration.

---

## 🛠️ Project Structure

```
ai-incident-triage/
├── public/                     # Modern Web Dashboard
│   ├── index.html              # Interactive incident command center
│   ├── style.css               # Midnight dark theme & severity badge styling
│   └── app.js                  # Frontend state, RAG viewer & benchmark runner
├── src/
│   ├── data/
│   │   ├── runbooks.json       # 15 multi-domain SRE runbooks & SOPs
│   │   └── syntheticTickets.ts # 18+ labeled synthetic incidents & generator
│   ├── services/
│   │   ├── ragService.ts       # BM25 + Vector similarity RAG retriever
│   │   ├── routingService.ts   # Team registry, on-call roster, SLA matrix
│   │   ├── triageEngine.ts     # Dual-engine orchestrator (Gemini 2.5 Flash / Local)
│   │   └── benchmarkService.ts # Quantitative evaluation & confusion matrix
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── server.ts               # Express REST API server
├── tests/
│   └── triage.test.ts          # Automated integration & unit test suite
├── scripts/
│   └── runBenchmark.ts         # CLI benchmark evaluation runner
├── package.json
└── tsconfig.json
```

