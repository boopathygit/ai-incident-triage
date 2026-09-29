import fs from 'fs';
import path from 'path';
import { Runbook, MatchedRunbook } from '../types';

export class RagService {
  private runbooks: Runbook[] = [];
  private invertedIndex: Map<string, Set<string>> = new Map();
  private docFrequencies: Map<string, number> = new Map();
  private docLengths: Map<string, number> = new Map();
  private avgDocLength: number = 0;

  constructor() {
    this.loadRunbooks();
  }

  private loadRunbooks(): void {
    try {
      let filePath = path.join(__dirname, '../data/runbooks.json');
      if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), 'src/data/runbooks.json');
      }
      if (!fs.existsSync(filePath)) {
        filePath = path.resolve(__dirname, '../../src/data/runbooks.json');
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      this.runbooks = JSON.parse(raw);
      this.buildIndex();
    } catch (err) {
      console.error('Failed to load runbooks.json:', err);
      this.runbooks = [];
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_\-\.\:\/]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  private buildIndex(): void {
    this.invertedIndex.clear();
    this.docFrequencies.clear();
    this.docLengths.clear();

    let totalLen = 0;

    for (const rb of this.runbooks) {
      const docText = [
        rb.title,
        rb.category,
        ...rb.symptoms,
        ...rb.root_causes,
        ...rb.diagnostic_commands,
        ...rb.mitigation_steps,
        rb.long_term_fix,
        ...rb.related_services,
        ...rb.tags
      ].join(' ');

      const tokens = this.tokenize(docText);
      this.docLengths.set(rb.id, tokens.length);
      totalLen += tokens.length;

      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Set());
        }
        this.invertedIndex.get(token)!.add(rb.id);
        this.docFrequencies.set(token, (this.docFrequencies.get(token) || 0) + 1);
      }
    }

    this.avgDocLength = this.runbooks.length > 0 ? totalLen / this.runbooks.length : 1;
  }

  public getAllRunbooks(): Runbook[] {
    return this.runbooks;
  }

  public addRunbook(runbook: Runbook): void {
    this.runbooks.push(runbook);
    this.buildIndex();
  }

  /**
   * Hybrid RAG Retrieval:
   * Uses BM25 scoring with exact symptom/error phrase boost to retrieve top-k matching runbooks.
   */
  public retrieveRunbooks(queryText: string, topK: number = 3): MatchedRunbook[] {
    if (!queryText || this.runbooks.length === 0) return [];

    const queryTokens = this.tokenize(queryText);
    const queryTokenSet = new Set(queryTokens);
    const queryLower = queryText.toLowerCase();

    const k1 = 1.5;
    const b = 0.75;
    const N = this.runbooks.length;

    const scores = new Map<string, { score: number; matchedKeywords: Set<string> }>();

    for (const rb of this.runbooks) {
      scores.set(rb.id, { score: 0, matchedKeywords: new Set() });
    }

    // 1. BM25 calculation
    for (const token of queryTokens) {
      const docIds = this.invertedIndex.get(token);
      if (!docIds) continue;

      const df = this.docFrequencies.get(token) || 1;
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

      for (const docId of docIds) {
        const docEntry = scores.get(docId)!;
        const docLen = this.docLengths.get(docId) || this.avgDocLength;
        
        // Term frequency heuristic in this doc
        const tf = 1.0;
        const bm25 = idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / this.avgDocLength))));
        
        docEntry.score += bm25;
        docEntry.matchedKeywords.add(token);
      }
    }

    // 2. High-precision exact phrase & signature boosting
    for (const rb of this.runbooks) {
      const docEntry = scores.get(rb.id)!;
      let boost = 0;

      // Symptom substring matches
      for (const symptom of rb.symptoms) {
        const symptomTokens = this.tokenize(symptom);
        const overlap = symptomTokens.filter(t => queryTokenSet.has(t)).length;
        if (overlap >= 3 || (symptomTokens.length > 0 && overlap / symptomTokens.length > 0.5)) {
          boost += 3.5 * (overlap / symptomTokens.length);
          docEntry.matchedKeywords.add(symptom.substring(0, 30));
        }
      }

      // Title match
      const titleTokens = this.tokenize(rb.title);
      const titleOverlap = titleTokens.filter(t => queryTokenSet.has(t)).length;
      if (titleOverlap > 0) {
        boost += titleOverlap * 1.8;
      }

      // Tags & Services
      for (const tag of rb.tags) {
        if (queryTokenSet.has(tag.toLowerCase())) {
          boost += 2.0;
          docEntry.matchedKeywords.add(tag);
        }
      }
      for (const s of rb.related_services) {
        if (queryLower.includes(s.toLowerCase())) {
          boost += 2.5;
          docEntry.matchedKeywords.add(s);
        }
      }

      docEntry.score += boost;
    }

    // Sort by final score
    const sorted = Array.from(scores.entries())
      .map(([id, data]) => {
        const runbook = this.runbooks.find(r => r.id === id)!;
        return {
          runbook,
          rawScore: data.score,
          matchedKeywords: Array.from(data.matchedKeywords)
        };
      })
      .filter(item => item.rawScore > 0)
      .sort((a, b) => b.rawScore - a.rawScore);

    const maxScore = sorted.length > 0 ? sorted[0].rawScore : 1;

    return sorted.slice(0, topK).map(item => ({
      runbook: item.runbook,
      relevanceScore: Math.min(1.0, Math.round((item.rawScore / (maxScore * 1.1)) * 100) / 100),
      matchedKeywords: item.matchedKeywords.slice(0, 6)
    }));
  }
}

export const ragService = new RagService();
