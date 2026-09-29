import assert from 'assert';
import { ragService } from '../src/services/ragService';
import { routeToTeam, calculateSlaTarget } from '../src/services/routingService';
import { triageEngine } from '../src/services/triageEngine';
import { SYNTHETIC_INCIDENT_DATASET } from '../src/data/syntheticTickets';

async function runTests() {
  console.log('\n🧪 Running AI Incident Triage Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res.then(() => {
          console.log(`  ✅ PASS: ${name}`);
          passed++;
        }).catch(err => {
          console.error(`  ❌ FAIL: ${name}`, err);
          failed++;
        });
      }
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`, err);
      failed++;
    }
  }

  // 1. Test RAG Runbook Loading & Retrieval
  await test('RAG Service loads knowledge base runbooks', () => {
    const runbooks = ragService.getAllRunbooks();
    assert(runbooks.length >= 10, `Expected at least 10 runbooks, found ${runbooks.length}`);
  });

  await test('RAG Service retrieves PostgreSQL Connection Exhaustion runbook', () => {
    const results = ragService.retrieveRunbooks('FATAL: remaining connection slots are reserved SequelizeConnectionAcquireTimeoutError', 3);
    assert(results.length > 0, 'Expected at least 1 matched runbook');
    assert.strictEqual(results[0].runbook.id, 'RB-DB-001', `Expected RB-DB-001, got ${results[0].runbook.id}`);
    assert(results[0].relevanceScore > 0.5, `Expected score > 0.5, got ${results[0].relevanceScore}`);
  });

  await test('RAG Service retrieves Kubernetes OOMKilled runbook', () => {
    const results = ragService.retrieveRunbooks('CrashLoopBackOff Exit Code 137 Terminated Reason OOMKilled', 3);
    assert(results.length > 0, 'Expected at least 1 matched runbook');
    assert.strictEqual(results[0].runbook.id, 'RB-INFRA-001', `Expected RB-INFRA-001, got ${results[0].runbook.id}`);
  });

  // 2. Test Team Routing and SLA Calculations
  await test('Route Database category to Data & Database Platform', () => {
    const team = routeToTeam('Database');
    assert.strictEqual(team.teamId, 'data-platform');
    assert.strictEqual(team.teamName, 'Data & Database Platform');
  });

  await test('Route Security & Auth category to SecOps', () => {
    const team = routeToTeam('Security & Auth');
    assert.strictEqual(team.teamId, 'secops');
    assert(team.slackChannel.includes('security'));
  });

  await test('Route Payments & Monetization correctly', () => {
    const team = routeToTeam('Billing & Payments', 'payment-service', 'Stripe webhook failure');
    assert.strictEqual(team.teamId, 'payments');
  });

  await test('Verify SLA Targets by Severity', () => {
    assert(calculateSlaTarget('P0').includes('15 Minutes'));
    assert(calculateSlaTarget('P1').includes('30 Minutes'));
    assert(calculateSlaTarget('P2').includes('4 Hours'));
    assert(calculateSlaTarget('P3').includes('24 Hours'));
  });

  // 3. Test End-to-End Triage Engine
  await test('Triage critical database outage ticket as P0', async () => {
    const sample = SYNTHETIC_INCIDENT_DATASET.find(t => t.id === 'INC-2026-0101')!;
    const result = await triageEngine.triageTicket(sample);
    assert.strictEqual(result.severity, 'P0');
    assert.strictEqual(result.category, 'Database');
    assert.strictEqual(result.assignedTeam.teamId, 'data-platform');
    assert(result.suggestedRemediation.diagnosticCommands.length > 0);
    assert(result.suggestedRemediation.immediateActions.length > 0);
  });

  await test('Triage minor cosmetic frontend ticket as P3', async () => {
    const sample = SYNTHETIC_INCIDENT_DATASET.find(t => t.id === 'INC-2026-0602')!;
    const result = await triageEngine.triageTicket(sample);
    assert.strictEqual(result.severity, 'P3');
    assert.strictEqual(result.category, 'Frontend & Client');
    assert.strictEqual(result.assignedTeam.teamId, 'frontend');
  });

  await test('Verify tokenUsage and engineUsed metadata exist on TriageResult', async () => {
    const sample = SYNTHETIC_INCIDENT_DATASET[0];
    const result = await triageEngine.triageTicket(sample);
    assert(result.engineUsed, 'Expected engineUsed to be defined');
    assert(result.tokenUsage !== undefined, 'Expected tokenUsage to be defined');
    assert(typeof result.tokenUsage?.totalTokens === 'number', 'Expected totalTokens to be a number');
    assert(typeof result.tokenUsage?.promptTokens === 'number', 'Expected promptTokens to be a number');
    assert(typeof result.tokenUsage?.outputTokens === 'number', 'Expected outputTokens to be a number');
  });

  console.log(`\n==============================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`==============================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});

