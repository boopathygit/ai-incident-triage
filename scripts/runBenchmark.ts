import { benchmarkService } from '../src/services/benchmarkService';
import { triageEngine } from '../src/services/triageEngine';

async function main() {
  console.log('\n======================================================');
  console.log(' 🔬 Running Synthetic Incident Triage Benchmark');
  console.log(` 🤖 Engine: ${triageEngine.isGeminiConfigured() ? 'Gemini 2.5 Flash' : 'Local Deterministic RAG'}`);
  console.log('======================================================\n');

  const startTime = Date.now();
  const metrics = await benchmarkService.runEvaluation();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`📊 EVALUATION SUMMARY (Evaluated ${metrics.totalEvaluated} Ground-Truth Incidents):`);
  console.log(`------------------------------------------------------`);
  console.log(`🎯 Severity Classification Accuracy: ${metrics.severityAccuracy}%`);
  console.log(`🏷️ Category Classification Accuracy: ${metrics.categoryAccuracy}%`);
  console.log(`👥 Team Routing Accuracy:            ${metrics.routingAccuracy}%`);
  console.log(`📖 RAG Runbook Top-1 Hit Rate:       ${metrics.ragTop1HitRate}%`);
  console.log(`📚 RAG Runbook Top-3 Hit Rate:       ${metrics.ragTop3HitRate}%`);
  console.log(`⚡ Average Latency per Incident:     ${metrics.averageLatencyMs} ms`);
  console.log(`⏱️ Total Benchmark Runtime:          ${duration}s\n`);

  console.log(`📋 DETAILED BREAKDOWN:`);
  console.log(`------------------------------------------------------`);
  metrics.detailedResults.forEach((r, i) => {
    const sevMark = r.severityMatch ? '✅' : '❌';
    const catMark = r.categoryMatch ? '✅' : '❌';
    const teamMark = r.teamMatch ? '✅' : '❌';
    const ragMark = r.ragHit ? '✅' : '❌';
    console.log(`[${i + 1}] ${r.ticketId} - ${r.title.slice(0, 45)}...`);
    console.log(`    Sev: ${sevMark} (GT: ${r.groundTruth.severity} | Pred: ${r.predicted.severity})`);
    console.log(`    Cat: ${catMark} (GT: ${r.groundTruth.category} | Pred: ${r.predicted.category})`);
    console.log(`    Team: ${teamMark} (GT: ${r.groundTruth.team} | Pred: ${r.predicted.team})`);
    console.log(`    RAG Hit: ${ragMark} | Latency: ${r.latencyMs}ms\n`);
  });

  console.log('======================================================');
  console.log(' ✅ Benchmark Completed Successfully.');
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});

