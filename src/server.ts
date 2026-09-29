import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { triageEngine } from './services/triageEngine';
import { ragService } from './services/ragService';
import { TEAMS_REGISTRY } from './services/routingService';
import { benchmarkService } from './services/benchmarkService';
import { generateSyntheticIncident, SYNTHETIC_INCIDENT_DATASET } from './data/syntheticTickets';
import { IncidentTicket, Runbook } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(process.cwd(), 'public');

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

// In-memory triaged tickets log
const triageHistory: Array<{ ticket: IncidentTicket; result: any }> = [];

// 1. Triage an incident
app.post('/api/triage', async (req, res) => {
  try {
    const { id, title, description, service, source, reporter, groundTruth } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const ticket: IncidentTicket = {
      id: id || `INC-${Date.now().toString().slice(-4)}`,
      title,
      description,
      service: service || 'unspecified-service',
      source: source || 'user_report',
      reporter: reporter || 'anonymous',
      createdAt: new Date().toISOString(),
      groundTruth
    };

    const result = await triageEngine.triageTicket(ticket);
    triageHistory.unshift({ ticket, result });

    return res.json({ ticket, result });
  } catch (error: any) {
    console.error('Error during triage:', error);
    return res.status(500).json({ error: error.message || 'Internal triage error' });
  }
});

// 2. Get synthetic tickets
app.get('/api/synthetic-tickets', (req, res) => {
  res.json(SYNTHETIC_INCIDENT_DATASET);
});

// 3. Generate a new synthetic ticket
app.post('/api/synthetic-tickets/generate', (req, res) => {
  const { category, severity } = req.body || {};
  const ticket = generateSyntheticIncident(category, severity);
  res.json(ticket);
});

// 4. Get all runbooks
app.get('/api/runbooks', (req, res) => {
  const runbooks = ragService.getAllRunbooks();
  res.json(runbooks);
});

// 5. Ingest new runbook into RAG knowledge base
app.post('/api/runbooks', (req, res) => {
  try {
    const runbook: Runbook = req.body;
    if (!runbook.id || !runbook.title || !runbook.category) {
      return res.status(400).json({ error: 'Invalid runbook format.' });
    }
    ragService.addRunbook(runbook);
    res.json({ message: 'Runbook successfully indexed in RAG knowledge base', runbook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get team registry
app.get('/api/teams', (req, res) => {
  res.json(TEAMS_REGISTRY);
});

// 7. Run synthetic data benchmark evaluation
app.post('/api/benchmark/run', async (req, res) => {
  try {
    const metrics = await benchmarkService.runEvaluation();
    res.json(metrics);
  } catch (error: any) {
    console.error('Error running benchmark:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Configuration & Model engine status
app.get('/api/config', (req, res) => {
  res.json({
    geminiConfigured: triageEngine.isGeminiConfigured(),
    activeModel: triageEngine.getModelName(),
    defaultEngine: triageEngine.isGeminiConfigured() ? triageEngine.getModelName() : 'local-semantic-rag'
  });
});

app.post('/api/config', (req, res) => {
  const { geminiApiKey, geminiModel } = req.body;
  triageEngine.updateApiKey(geminiApiKey, geminiModel);
  res.json({
    success: true,
    geminiConfigured: triageEngine.isGeminiConfigured(),
    activeModel: triageEngine.getModelName(),
    activeEngine: triageEngine.isGeminiConfigured() ? triageEngine.getModelName() : 'local-semantic-rag'
  });
});

// 9. Get triage history
app.get('/api/history', (req, res) => {
  res.json(triageHistory.slice(0, 50));
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` 🚨 AI Incident Triage Assistant listening on port ${PORT}`);
  console.log(` 🌐 Dashboard: http://localhost:${PORT}`);
  console.log(` 🤖 Active AI Engine: ${triageEngine.isGeminiConfigured() ? 'Gemini 2.5 Flash' : 'Local Deterministic RAG'}`);
  console.log(`====================================================`);
});
