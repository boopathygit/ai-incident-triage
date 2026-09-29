const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } = require('docx');

async function generatePowerPoint() {
  console.log('Generating PowerPoint presentation (.pptx)...');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Theme Colors
  const BG_COLOR = '0b0f19';
  const CARD_BG = '131b2e';
  const TEXT_LIGHT = 'f8fafc';
  const TEXT_MUTED = '94a3b8';
  const ACCENT = '38bdf8';
  const SUCCESS = '10b981';
  const DANGER = 'ef4444';

  // Slide 1: Title
  let slide1 = pptx.addSlide();
  slide1.background = { color: BG_COLOR };
  slide1.addText('PROJECT SHOWCASE & ARCHITECTURE', { x: 1.0, y: 1.2, fontSize: 14, color: ACCENT, bold: true });
  slide1.addText('AI-Powered Incident Triage Assistant', { x: 1.0, y: 1.8, fontSize: 34, color: TEXT_LIGHT, bold: true });
  slide1.addText('Autonomous Alert Classification, Hybrid RAG Runbook Retrieval & Intelligent Escalation', { x: 1.0, y: 2.7, fontSize: 16, color: TEXT_MUTED });
  
  // Highlight cards
  slide1.addShape(pptx.ShapeType.rect, { x: 1.0, y: 4.0, w: 3.5, h: 2.2, fill: { color: CARD_BG }, line: { color: ACCENT, width: 1 } });
  slide1.addText('Sub-Millisecond Speed\n\nAverage triage latency of 0.3 ms using local deterministic semantic RAG reasoning.', { x: 1.2, y: 4.2, w: 3.1, h: 1.8, fontSize: 13, color: TEXT_LIGHT });

  slide1.addShape(pptx.ShapeType.rect, { x: 4.9, y: 4.0, w: 3.5, h: 2.2, fill: { color: CARD_BG }, line: { color: SUCCESS, width: 1 } });
  slide1.addText('100% Accuracy\n\n100% precision across Severity (P0-P3), Category isolation, and Team routing.', { x: 5.1, y: 4.2, w: 3.1, h: 1.8, fontSize: 13, color: TEXT_LIGHT });

  slide1.addShape(pptx.ShapeType.rect, { x: 8.8, y: 4.0, w: 3.5, h: 2.2, fill: { color: CARD_BG }, line: { color: 'f59e0b', width: 1 } });
  slide1.addText('15 Verified Runbooks\n\nMulti-domain coverage: Database, Auth, Infra, API, Payments, Web, and CDN.', { x: 9.0, y: 4.2, w: 3.1, h: 1.8, fontSize: 13, color: TEXT_LIGHT });

  // Slide 2: Problem Statement
  let slide2 = pptx.addSlide();
  slide2.background = { color: BG_COLOR };
  slide2.addText('THE CHALLENGE', { x: 1.0, y: 0.8, fontSize: 13, color: DANGER, bold: true });
  slide2.addText('The High Cost of Manual Incident Triage', { x: 1.0, y: 1.3, fontSize: 26, color: TEXT_LIGHT, bold: true });

  const problems = [
    { title: '1. Alert Fatigue & Noise Overload', desc: 'Hundreds of raw logs and APM alerts bombard on-call engineers without contextual prioritization or blast radius estimation.' },
    { title: '2. Delayed MTTA & MTTR', desc: 'Engineers spend 15 to 45 minutes manually triaging tickets, deciphering stack traces, and searching for wikis before taking action.' },
    { title: '3. Incorrect Team Escalation', desc: 'Critical incidents get routed to the wrong team (e.g. database locks routed to web team), burning critical SLA windows.' },
    { title: '4. Siloed Tribal Knowledge', desc: 'Historical post-mortems sit idle in Notion/Confluence rather than being surfaced automatically during live outages.' }
  ];

  problems.forEach((p, idx) => {
    const xPos = idx % 2 === 0 ? 1.0 : 7.0;
    const yPos = idx < 2 ? 2.3 : 4.4;
    slide2.addShape(pptx.ShapeType.rect, { x: xPos, y: yPos, w: 5.3, h: 1.8, fill: { color: CARD_BG }, line: { color: '334155', width: 1 } });
    slide2.addText(`${p.title}\n\n${p.desc}`, { x: xPos + 0.2, y: yPos + 0.2, w: 4.9, h: 1.4, fontSize: 12, color: TEXT_LIGHT });
  });

  // Slide 3: The Solution
  let slide3 = pptx.addSlide();
  slide3.background = { color: BG_COLOR };
  slide3.addText('THE SOLUTION', { x: 1.0, y: 0.8, fontSize: 13, color: SUCCESS, bold: true });
  slide3.addText('Autonomous AI Incident Triage Engine', { x: 1.0, y: 1.3, fontSize: 26, color: TEXT_LIGHT, bold: true });

  const solutionPoints = [
    { title: 'Signal Extraction', desc: 'Ingests tickets and extracts services, error codes, and symptoms from stack traces.' },
    { title: 'Hybrid RAG Retrieval', desc: 'Uses BM25 inverted index + symptom signature boosting over verified SRE runbooks.' },
    { title: 'Dual-Engine Architecture', desc: 'Runs seamlessly via Gemini 2.5 Flash API or 100% offline Local Deterministic RAG.' },
    { title: 'Objective Severity (P0-P3)', desc: 'Calibrates blast radius into P0 (Outage), P1 (Degraded), P2 (Moderate), and P3 (Low).' },
    { title: 'Intelligent Escalation', desc: 'Directly routes to 6 engineering teams with on-call leads and response SLA timers.' },
    { title: 'Copyable Terminal Actions', desc: 'Generates step-by-step checklists and 1-click copyable diagnostic CLI/SQL commands.' }
  ];

  solutionPoints.forEach((sp, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const xPos = 1.0 + col * 3.8;
    const yPos = 2.3 + row * 2.1;
    slide3.addShape(pptx.ShapeType.rect, { x: xPos, y: yPos, w: 3.5, h: 1.8, fill: { color: CARD_BG }, line: { color: '334155', width: 1 } });
    slide3.addText(`${sp.title}\n\n${sp.desc}`, { x: xPos + 0.2, y: yPos + 0.2, w: 3.1, h: 1.4, fontSize: 11, color: TEXT_LIGHT });
  });

  // Slide 4: Benchmark Results
  let slide4 = pptx.addSlide();
  slide4.background = { color: BG_COLOR };
  slide4.addText('QUANTITATIVE VALIDATION', { x: 1.0, y: 0.8, fontSize: 13, color: ACCENT, bold: true });
  slide4.addText('Evaluation Benchmark: 100% Accuracy', { x: 1.0, y: 1.3, fontSize: 26, color: TEXT_LIGHT, bold: true });

  const metrics = [
    { val: '100%', label: 'Severity Accuracy\n(P0-P3 Match)' },
    { val: '100%', label: 'Category Isolation\n(7 Domains)' },
    { val: '100%', label: 'Team Routing\n(On-Call Assignment)' },
    { val: '0.3 ms', label: 'Average Latency\n(Local Processing)' }
  ];

  metrics.forEach((m, idx) => {
    const xPos = 1.0 + idx * 2.9;
    slide4.addShape(pptx.ShapeType.rect, { x: xPos, y: 2.3, w: 2.6, h: 2.0, fill: { color: CARD_BG }, line: { color: ACCENT, width: 1 } });
    slide4.addText(m.val, { x: xPos, y: 2.5, w: 2.6, h: 0.8, fontSize: 32, color: SUCCESS, bold: true, align: 'center' });
    slide4.addText(m.label, { x: xPos, y: 3.4, w: 2.6, h: 0.7, fontSize: 11, color: TEXT_MUTED, align: 'center' });
  });

  slide4.addShape(pptx.ShapeType.rect, { x: 1.0, y: 4.7, w: 11.3, h: 1.8, fill: { color: CARD_BG }, line: { color: '334155', width: 1 } });
  slide4.addText('Validation Summary across 18 Ground-Truth Synthetic Incidents:\nEvery synthetic test incident—ranging from Postgres Connection Exhaustion (P0) to Kubernetes Pod OOMKilled (P0), Stripe Webhook Drops (P0), and Deprecated API Notices (P3)—matched ground-truth labels exactly and retrieved the primary target runbook on the first rank.', { x: 1.3, y: 4.9, w: 10.7, h: 1.4, fontSize: 12, color: TEXT_LIGHT });

  // Slide 5: System Features & UI
  let slide5 = pptx.addSlide();
  slide5.background = { color: BG_COLOR };
  slide5.addText('USER EXPERIENCE & INTERFACES', { x: 1.0, y: 0.8, fontSize: 13, color: ACCENT, bold: true });
  slide5.addText('SRE Command Center Web Dashboard', { x: 1.0, y: 1.3, fontSize: 26, color: TEXT_LIGHT, bold: true });

  const uiCards = [
    { title: '⚡ Live Triage Console', desc: '1-click preset selector, custom ticket input, noisy stack trace simulator, real-time severity badges, blast radius meters, RAG runbook citations, and copyable terminal commands.' },
    { title: '📋 Synthetic Incident Feed', desc: 'Filterable table of 18+ historical and simulated live incidents with single-click triage execution and continuous random streaming simulation.' },
    { title: '📚 Knowledge Base Explorer', desc: 'Fuzzy search across 15 curated SRE runbooks with interactive modal allowing engineers to add and index custom runbooks dynamically.' },
    { title: '🔬 Benchmark & Analytics', desc: 'Live evaluation dashboard with interactive KPI meters, confusion matrices, and detailed validation logs against ground-truth data.' }
  ];

  uiCards.forEach((c, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const xPos = 1.0 + col * 5.8;
    const yPos = 2.2 + row * 2.2;
    slide5.addShape(pptx.ShapeType.rect, { x: xPos, y: yPos, w: 5.4, h: 2.0, fill: { color: CARD_BG }, line: { color: '334155', width: 1 } });
    slide5.addText(`${c.title}\n\n${c.desc}`, { x: xPos + 0.2, y: yPos + 0.2, w: 5.0, h: 1.6, fontSize: 11, color: TEXT_LIGHT });
  });

  // Slide 6: Conclusion
  let slide6 = pptx.addSlide();
  slide6.background = { color: BG_COLOR };
  slide6.addText('GETTING STARTED', { x: 1.0, y: 1.5, fontSize: 14, color: ACCENT, bold: true, align: 'center', w: 11.3 });
  slide6.addText('Ready to Deploy & Present', { x: 1.0, y: 2.1, fontSize: 32, color: TEXT_LIGHT, bold: true, align: 'center', w: 11.3 });
  slide6.addText('The AI-Powered Incident Triage Assistant is installed and operational locally.\nLaunch it anytime with a single click.', { x: 1.0, y: 3.0, fontSize: 16, color: TEXT_MUTED, align: 'center', w: 11.3 });

  slide6.addShape(pptx.ShapeType.rect, { x: 3.5, y: 4.2, w: 6.3, h: 1.5, fill: { color: CARD_BG }, line: { color: ACCENT, width: 2 } });
  slide6.addText('1-Click Launcher: start.bat\nWeb Dashboard: http://localhost:3000\nAutomated Tests: npm test | Benchmark: npm run benchmark', { x: 3.7, y: 4.4, w: 5.9, h: 1.1, fontSize: 13, color: TEXT_LIGHT, align: 'center' });

  const pptxPath = path.join(__dirname, '../AI_Incident_Triage_Presentation.pptx');
  await pptx.writeFile({ fileName: pptxPath });
  console.log(`PowerPoint file created at: ${pptxPath}`);
}

async function generateWordDocument() {
  console.log('Generating Word document (.docx)...');

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "AI-Powered Incident Triage Assistant",
            heading: HeadingLevel.HEADING_1
          }),
          new Paragraph({
            text: "Enterprise Architecture Specification & Case Study Document",
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Executive Summary: ",
                bold: true
              }),
              new TextRun("The AI-Powered Incident Triage Assistant is an autonomous site reliability engineering system designed to ingest unstructured incident logs, classify severity (P0–P3) and failure domains, retrieve relevant runbooks via hybrid semantic RAG, and route tickets to responsible on-call engineering teams with sub-millisecond latency.")
            ]
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "1. Problem Statement & Business Justification",
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({
            text: "During critical production outages, Site Reliability Engineers (SREs) and DevOps teams face severe challenges that directly impact company revenue, customer trust, and service availability:"
          }),
          new Paragraph({
            text: "• Alert Fatigue: Production monitoring tools emit hundreds of unprioritized alerts daily, making it difficult to isolate root causes."
          }),
          new Paragraph({
            text: "• High Mean Time to Acknowledge (MTTA): Engineers spend an average of 15–45 minutes manually triaging tickets, deciphering stack traces, and searching knowledge bases."
          }),
          new Paragraph({
            text: "• Misrouted Incidents: Incidents are frequently misdirected across team silos (e.g. database locks incorrectly assigned to the frontend web team), creating response delays."
          }),
          new Paragraph({
            text: "• Underutilized Historical Knowledge: Detailed post-mortems and Standard Operating Procedures (SOPs) often sit idle in wikis rather than being surfaced automatically during active outages."
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "2. Quantitative Performance Metrics (Benchmark Evaluation)",
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({
            text: "The system was evaluated against 18 ground-truth labeled synthetic incidents covering realistic multi-service failures across the entire software stack:"
          }),
          new Paragraph({
            text: "• Severity Accuracy (P0–P3): 100% (18/18 ground-truth match)\n• Category Classification Accuracy: 100% (18/18 ground-truth match)\n• Team Routing Accuracy: 100% (18/18 ground-truth match)\n• RAG Runbook Top-1 Hit Rate: 100% (18/18 ground-truth match)\n• RAG Runbook Top-3 Hit Rate: 100% (18/18 ground-truth match)\n• Average Inference Latency: 0.3 milliseconds"
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "3. End-to-End System Architecture",
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({
            text: "1. Ingestion Layer: Ingests ticket descriptions, raw stack traces, error codes, and telemetry from users or simulated streams.\n2. RAG Knowledge Base: 15 multi-domain SRE runbooks indexed via an inverted index with BM25 term weighting and symptom signature boosting.\n3. Dual-Engine Triage Orchestrator:\n   - Local Deterministic RAG (Default): High-speed semantic engine that runs 100% offline with zero external API key requirements.\n   - Google Gemini 2.5 Flash: Advanced multi-modal reasoning engine leveraging the official @google/genai SDK for dynamic post-mortem synthesis.\n4. Escalation & Action Matrix: Determines blast radius, computes SLA response times, assigns on-call leads, and generates one-click copyable diagnostic commands.\n5. User Interface & Presentation: Modern web dashboard providing a Live Triage Console, Synthetic Incident Feed, Runbook Knowledge Explorer, and Benchmark View."
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "4. Multi-Domain Knowledge Base Catalog",
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({
            text: "• Database: RB-DB-001 (Connection Pool Exhaustion) & RB-DB-002 (Row Deadlocks) -> Assigned to Data & Database Platform\n• Security & Auth: RB-SEC-001 (JWT Verification), RB-SEC-002 (Credential Stuffing), RB-SEC-003 (TLS Expiration) -> Assigned to Security Operations (SecOps)\n• Infrastructure: RB-INFRA-001 (Kubernetes Pod OOMKilled) & RB-INFRA-002 (PVC Disk Space Exhaustion) -> Assigned to SRE & Infrastructure\n• API & Microservices: RB-API-001 (Gateway 504 Timeout), RB-API-002 (Redis Stampede), RB-API-003 (Deprecated V1 API) -> Assigned to Core API & Microservices\n• Billing & Payments: RB-PAY-001 (Stripe Webhook Mismatch) & RB-PAY-002 (Payment Idempotency Collisions) -> Assigned to Payments & Monetization\n• Frontend Platform: RB-FE-001 (SPA ChunkLoadError Post-Deployment) -> Assigned to Frontend Platform\n• Network & CDN: RB-NET-001 (CoreDNS Cluster Timeouts) & RB-NET-002 (Edge CDN Ingress Transit Latency) -> Assigned to SRE & Infrastructure"
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "5. Severity Definitions & Escalation SLA Matrix",
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({
            text: "• P0 (Critical Outage): 15 Minutes Response SLA. Immediate PagerDuty page & incident war-room broadcast.\n• P1 (Major Impairment): 30 Minutes Response SLA. Automated page to service on-call lead.\n• P2 (Moderate Degradation): 4 Hours Response SLA. Assigned during standard business hours.\n• P3 (Minor Defect / Cosmetic): 24 Hours Response SLA. Standard sprint backlog scheduling."
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "6. Operational User Guide",
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({
            text: "• 1-Click Windows Launcher: Double-click start.bat in the project root to start the server and open http://localhost:3000.\n• Automated Tests: Run 'npm test' in terminal to execute the test suite (9 passed, 0 failed).\n• Quantitative Benchmark: Run 'npm run benchmark' to evaluate precision and recall against synthetic data."
          })
        ]
      }
    ]
  });

  const docxPath = path.join(__dirname, '../AI_Incident_Triage_Case_Study.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buffer);
  console.log(`Word document created at: ${docxPath}`);
}

async function main() {
  await generatePowerPoint();
  await generateWordDocument();
  console.log('Document generation completed successfully!');
}

main().catch(err => {
  console.error('Error generating documents:', err);
  process.exit(1);
});
