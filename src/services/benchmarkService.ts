import { BenchmarkMetrics, IncidentTicket, SeverityLevel } from '../types';
import { SYNTHETIC_INCIDENT_DATASET } from '../data/syntheticTickets';
import { triageEngine } from './triageEngine';

export class BenchmarkService {
  public async runEvaluation(dataset: IncidentTicket[] = SYNTHETIC_INCIDENT_DATASET): Promise<BenchmarkMetrics> {
    const detailedResults: BenchmarkMetrics['detailedResults'] = [];
    const severityLevels: SeverityLevel[] = ['P0', 'P1', 'P2', 'P3'];

    const confusionMatrix: BenchmarkMetrics['confusionMatrix'] = {
      severity: {
        P0: { P0: 0, P1: 0, P2: 0, P3: 0 },
        P1: { P0: 0, P1: 0, P2: 0, P3: 0 },
        P2: { P0: 0, P1: 0, P2: 0, P3: 0 },
        P3: { P0: 0, P1: 0, P2: 0, P3: 0 }
      },
      category: {}
    };

    let severityCorrect = 0;
    let categoryCorrect = 0;
    let routingCorrect = 0;
    let ragTop1Hits = 0;
    let ragTop3Hits = 0;
    let totalLatency = 0;

    for (const ticket of dataset) {
      if (!ticket.groundTruth) continue;

      const result = await triageEngine.triageTicket(ticket);
      totalLatency += result.processingTimeMs;

      const gtSev = ticket.groundTruth.severity;
      const predSev = result.severity;
      const gtCat = ticket.groundTruth.category;
      const predCat = result.category;
      const gtTeam = ticket.groundTruth.routedTeam;
      const predTeam = result.assignedTeam.teamName;
      const targetRbId = ticket.groundTruth.targetRunbookId;

      const severityMatch = gtSev === predSev;
      const categoryMatch = gtCat === predCat;
      const teamMatch = gtTeam.toLowerCase().includes(predTeam.toLowerCase()) || predTeam.toLowerCase().includes(gtTeam.toLowerCase());

      if (severityMatch) severityCorrect++;
      if (categoryMatch) categoryCorrect++;
      if (teamMatch) routingCorrect++;

      // Confusion matrix updates
      if (confusionMatrix.severity[gtSev]) {
        confusionMatrix.severity[gtSev][predSev] = (confusionMatrix.severity[gtSev][predSev] || 0) + 1;
      }
      if (!confusionMatrix.category[gtCat]) confusionMatrix.category[gtCat] = {};
      confusionMatrix.category[gtCat][predCat] = (confusionMatrix.category[gtCat][predCat] || 0) + 1;

      // RAG Retrieval accuracy
      const top1Match = result.matchedRunbooks.length > 0 && result.matchedRunbooks[0].runbook.id === targetRbId;
      const top3Match = result.matchedRunbooks.some(m => m.runbook.id === targetRbId);

      if (top1Match) ragTop1Hits++;
      if (top3Match) ragTop3Hits++;

      detailedResults.push({
        ticketId: ticket.id,
        title: ticket.title,
        groundTruth: {
          severity: gtSev,
          category: gtCat,
          team: gtTeam
        },
        predicted: {
          severity: predSev,
          category: predCat,
          team: predTeam
        },
        severityMatch,
        categoryMatch,
        teamMatch,
        ragHit: top1Match || top3Match,
        latencyMs: result.processingTimeMs
      });
    }

    const total = dataset.filter(t => !!t.groundTruth).length;

    return {
      totalEvaluated: total,
      severityAccuracy: total > 0 ? Math.round((severityCorrect / total) * 1000) / 10 : 0,
      categoryAccuracy: total > 0 ? Math.round((categoryCorrect / total) * 1000) / 10 : 0,
      routingAccuracy: total > 0 ? Math.round((routingCorrect / total) * 1000) / 10 : 0,
      ragTop1HitRate: total > 0 ? Math.round((ragTop1Hits / total) * 1000) / 10 : 0,
      ragTop3HitRate: total > 0 ? Math.round((ragTop3Hits / total) * 1000) / 10 : 0,
      averageLatencyMs: total > 0 ? Math.round((totalLatency / total) * 10) / 10 : 0,
      confusionMatrix,
      detailedResults
    };
  }
}

export const benchmarkService = new BenchmarkService();

