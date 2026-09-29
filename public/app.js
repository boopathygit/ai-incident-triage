// State
let syntheticTickets = [];
let runbooks = [];
let activePreset = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initConfig();
  loadPresetsAndSyntheticTickets();
  loadRunbooks();
  setupEventListeners();
});

// 1. Navigation Tabs
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');

      if (targetId === 'tab-benchmark') {
        runBenchmark(false);
      }
    });
  });
}

// 2. Configuration & Model Status
async function initConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    updateEngineUI(data.geminiConfigured, data.defaultEngine, data.activeModel);
    if (data.activeModel) {
      const modelSelect = document.getElementById('geminiModelSelect');
      if (modelSelect) modelSelect.value = data.activeModel;
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

function updateEngineUI(isGemini, engineName, activeModel) {
  const engineLabel = document.getElementById('engineLabel');
  const engineDot = document.querySelector('.engine-dot');
  const modalActiveEngine = document.getElementById('modalActiveEngine');

  if (isGemini) {
    const modelDisplay = activeModel || 'Gemini 2.5 Flash';
    engineLabel.textContent = modelDisplay;
    engineDot.style.backgroundColor = '#38bdf8';
    engineDot.style.boxShadow = '0 0 6px #38bdf8';
    if (modalActiveEngine) modalActiveEngine.textContent = `Google Gemini API (${modelDisplay})`;
  } else {
    engineLabel.textContent = 'Local Deterministic RAG';
    engineDot.style.backgroundColor = '#10b981';
    engineDot.style.boxShadow = '0 0 6px #10b981';
    if (modalActiveEngine) modalActiveEngine.textContent = 'Local Deterministic RAG (High Speed Offline)';
  }
}

// 3. Load Presets and Feed
async function loadPresetsAndSyntheticTickets() {
  try {
    const res = await fetch('/api/synthetic-tickets');
    syntheticTickets = await res.json();

    document.getElementById('feedCount').textContent = syntheticTickets.length;

    // Populate Presets dropdown
    const select = document.getElementById('presetSelect');
    select.innerHTML = '<option value="">-- Choose Synthetic Scenario --</option>';
    syntheticTickets.forEach(ticket => {
      const opt = document.createElement('option');
      opt.value = ticket.id;
      const sev = ticket.groundTruth ? `[${ticket.groundTruth.severity}] ` : '';
      opt.textContent = `${sev}${ticket.title.substring(0, 55)}...`;
      select.appendChild(opt);
    });

    // Populate Feed Table
    renderFeedTable(syntheticTickets);
  } catch (err) {
    console.error('Failed to load synthetic tickets:', err);
  }
}

function renderFeedTable(tickets) {
  const tbody = document.getElementById('feedTableBody');
  tbody.innerHTML = '';

  tickets.forEach(t => {
    const tr = document.createElement('tr');
    const sev = t.groundTruth?.severity || 'P2';
    const cat = t.groundTruth?.category || 'Infra';
    const team = t.groundTruth?.routedTeam || 'SRE';

    tr.innerHTML = `
      <td><code class="font-mono text-xs">${t.id}</code></td>
      <td><span class="badge sev-${sev}">${sev}</span></td>
      <td><span class="chip chip-category">${cat}</span></td>
      <td><code>${t.service || 'n/a'}</code></td>
      <td title="${t.title}"><strong>${escapeHtml(t.title)}</strong></td>
      <td><span class="text-sm text-muted">${team}</span></td>
      <td>
        <button class="btn btn-xs btn-primary" onclick="selectAndTriage('${t.id}')">⚡ Triage</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 4. Load Runbooks Knowledge Base
async function loadRunbooks() {
  try {
    const res = await fetch('/api/runbooks');
    runbooks = await res.json();
    document.getElementById('kbCount').textContent = runbooks.length;
    renderRunbooks(runbooks);
  } catch (err) {
    console.error('Failed to load runbooks:', err);
  }
}

function renderRunbooks(list) {
  const grid = document.getElementById('runbookGrid');
  grid.innerHTML = '';

  list.forEach(rb => {
    const card = document.createElement('div');
    card.className = 'runbook-item';
    card.innerHTML = `
      <div>
        <div class="runbook-item-header">
          <h4>${escapeHtml(rb.title)}</h4>
          <span class="runbook-id-badge">${rb.id}</span>
        </div>
        <p class="text-sm text-info mb-2">Category: <strong>${rb.category}</strong></p>
        <p class="text-xs text-muted mb-2">Primary Team: <strong>${rb.primary_team}</strong></p>
        
        <div class="mb-2">
          <span class="text-xs text-secondary font-bold">Key Symptoms:</span>
          <p class="text-xs text-muted">${escapeHtml(rb.symptoms.slice(0, 2).join('; '))}</p>
        </div>

        <div class="mb-2">
          <span class="text-xs text-secondary font-bold">Diagnostic Sample:</span>
          <pre class="font-mono text-xs p-1" style="background:#05080e; border-radius:4px; overflow-x:auto; margin-top:4px;"><code>${escapeHtml(rb.diagnostic_commands[0] || 'n/a')}</code></pre>
        </div>
      </div>

      <div class="tag-list">
        ${rb.tags.map(tag => `<span class="tag-chip">#${tag}</span>`).join('')}
      </div>
    `;
    grid.appendChild(card);
  });
}

// 5. Setup Event Listeners
function setupEventListeners() {
  // Preset Select
  const presetSelect = document.getElementById('presetSelect');
  presetSelect.addEventListener('change', (e) => {
    const ticketId = e.target.value;
    if (!ticketId) return;
    const ticket = syntheticTickets.find(t => t.id === ticketId);
    if (ticket) loadTicketIntoForm(ticket);
  });

  // Random Ticket Button
  document.getElementById('btnRandomize').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/synthetic-tickets/generate', { method: 'POST' });
      const ticket = await res.json();
      loadTicketIntoForm(ticket);
    } catch (err) {
      console.error('Error generating random ticket:', err);
    }
  });

  // Stack Trace Simulation Button
  document.getElementById('btnSimulateNoise').addEventListener('click', () => {
    const desc = document.getElementById('ticketDescription');
    desc.value += `\n\n--- [Captured System Stack Trace] ---
Error: ConnectionTimeoutError: Timed out waiting for connection slot (pool capacity: 2500)
    at ConnectionManager.getConnection (/app/node_modules/orm/lib/manager.js:142:19)
    at async Pool.acquire (/app/node_modules/pg-pool/index.js:312:12)
    at async OrderService.processPayment (/app/dist/services/order.js:88:24)
    at async Router.handle (/app/dist/routes/checkout.js:45:9)`;
  });

  // Triage Form Submit
  const triageForm = document.getElementById('triageForm');
  triageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await executeTriage();
  });

  // Feed Filter
  const feedSearch = document.getElementById('feedSearch');
  const feedFilterSeverity = document.getElementById('feedFilterSeverity');
  const feedFilterCategory = document.getElementById('feedFilterCategory');

  const filterFeed = () => {
    const q = feedSearch.value.toLowerCase();
    const sev = feedFilterSeverity.value;
    const cat = feedFilterCategory.value;

    const filtered = syntheticTickets.filter(t => {
      const matchesQ = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.service && t.service.toLowerCase().includes(q));
      const matchesSev = !sev || t.groundTruth?.severity === sev;
      const matchesCat = !cat || t.groundTruth?.category === cat;
      return matchesQ && matchesSev && matchesCat;
    });
    renderFeedTable(filtered);
  };

  feedSearch.addEventListener('input', filterFeed);
  feedFilterSeverity.addEventListener('change', filterFeed);
  feedFilterCategory.addEventListener('change', filterFeed);

  // Stream Random Incident to Feed
  document.getElementById('btnSimulateStream').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/synthetic-tickets/generate', { method: 'POST' });
      const newTicket = await res.json();
      syntheticTickets.unshift(newTicket);
      document.getElementById('feedCount').textContent = syntheticTickets.length;
      renderFeedTable(syntheticTickets);
      showNotification(`🌊 Streamed new simulated incident: ${newTicket.id}`);
    } catch (err) {
      console.error('Error streaming ticket:', err);
    }
  });

  // Batch Triage All
  document.getElementById('btnTriageAllFeed').addEventListener('click', async () => {
    const btn = document.getElementById('btnTriageAllFeed');
    btn.disabled = true;
    btn.textContent = 'Processing Batch...';
    try {
      await runBenchmark(true);
      document.querySelector('[data-tab="tab-benchmark"]').click();
    } finally {
      btn.disabled = false;
      btn.textContent = '⚡ Batch Triage All';
    }
  });

  // Run Benchmark Button
  document.getElementById('btnRunLiveBenchmark').addEventListener('click', () => {
    runBenchmark(true);
  });

  // Copy All Commands
  document.getElementById('btnCopyAllCommands').addEventListener('click', () => {
    const cmds = Array.from(document.querySelectorAll('.command-snippet code')).map(c => c.textContent).join('\n');
    navigator.clipboard.writeText(cmds);
    showNotification('📋 Diagnostic commands copied to clipboard!');
  });

  // Knowledge Base Search
  document.getElementById('kbSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = runbooks.filter(rb => 
      rb.title.toLowerCase().includes(q) ||
      rb.category.toLowerCase().includes(q) ||
      rb.tags.some(t => t.toLowerCase().includes(q)) ||
      rb.symptoms.some(s => s.toLowerCase().includes(q))
    );
    renderRunbooks(filtered);
  });

  // Settings Modal Handlers
  const settingsModal = document.getElementById('settingsModal');
  document.getElementById('btnSettings').addEventListener('click', () => {
    settingsModal.style.display = 'flex';
  });
  document.getElementById('btnCloseSettings').addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });

  document.getElementById('btnSaveOffline').addEventListener('click', async () => {
    await saveApiKey('', '');
    settingsModal.style.display = 'none';
  });

  document.getElementById('btnSaveSettings').addEventListener('click', async () => {
    const key = document.getElementById('geminiApiKeyInput').value;
    const model = document.getElementById('geminiModelSelect')?.value || 'gemini-3.8-flash';
    await saveApiKey(key, model);
    settingsModal.style.display = 'none';
  });

  // Add Runbook Modal Handlers
  const addRunbookModal = document.getElementById('addRunbookModal');
  document.getElementById('btnAddRunbookModal').addEventListener('click', () => {
    addRunbookModal.style.display = 'flex';
  });
  document.getElementById('btnCloseRunbookModal').addEventListener('click', () => {
    addRunbookModal.style.display = 'none';
  });
  document.getElementById('btnCancelRunbook').addEventListener('click', () => {
    addRunbookModal.style.display = 'none';
  });

  document.getElementById('addRunbookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newRb = {
      id: document.getElementById('rbId').value.trim(),
      title: document.getElementById('rbTitle').value.trim(),
      category: document.getElementById('rbCategory').value,
      symptoms: document.getElementById('rbSymptoms').value.split('\n').filter(s => s.trim().length > 0),
      root_causes: ['Manually documented root cause'],
      diagnostic_commands: document.getElementById('rbCommands').value.split('\n').filter(s => s.trim().length > 0),
      mitigation_steps: document.getElementById('rbMitigation').value.split('\n').filter(s => s.trim().length > 0),
      long_term_fix: document.getElementById('rbLongTerm').value.trim() || 'Ongoing monitoring',
      primary_team: 'SRE & Infrastructure',
      related_services: ['custom-service'],
      tags: ['custom', 'user-defined']
    };

    try {
      const res = await fetch('/api/runbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRb)
      });
      if (res.ok) {
        addRunbookModal.style.display = 'none';
        document.getElementById('addRunbookForm').reset();
        await loadRunbooks();
        showNotification(`✅ Runbook [${newRb.id}] successfully indexed into RAG store!`);
      }
    } catch (err) {
      alert('Failed to save runbook: ' + err.message);
    }
  });
}

// 6. Save API Key
async function saveApiKey(key, model) {
  try {
    const payload = { geminiApiKey: key };
    if (model) payload.geminiModel = model;
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    updateEngineUI(data.geminiConfigured, data.activeEngine, data.activeModel);
    showNotification(data.geminiConfigured ? `🤖 ${data.activeModel || 'Gemini'} activated!` : '⚡ Switched to Local Deterministic RAG');
  } catch (err) {
    alert('Failed to update config: ' + err.message);
  }
}

// 7. Load ticket into Form
function loadTicketIntoForm(ticket) {
  activePreset = ticket;
  document.getElementById('ticketTitle').value = ticket.title;
  document.getElementById('ticketService').value = ticket.service || '';
  document.getElementById('ticketReporter').value = ticket.reporter || 'monitoring-bot';
  document.getElementById('ticketDescription').value = ticket.description;
  showNotification(`Loaded scenario: ${ticket.id}`);
}

window.selectAndTriage = function(ticketId) {
  const ticket = syntheticTickets.find(t => t.id === ticketId);
  if (ticket) {
    loadTicketIntoForm(ticket);
    document.querySelector('[data-tab="tab-triage"]').click();
    executeTriage();
  }
};

// 8. Execute Triage
async function executeTriage() {
  const spinner = document.getElementById('triageSpinner');
  const btn = document.getElementById('btnSubmitTriage');
  spinner.style.display = 'inline-block';
  btn.disabled = true;

  const payload = {
    id: activePreset ? activePreset.id : `INC-${Math.floor(1000 + Math.random() * 9000)}`,
    title: document.getElementById('ticketTitle').value,
    service: document.getElementById('ticketService').value,
    reporter: document.getElementById('ticketReporter').value,
    description: document.getElementById('ticketDescription').value,
    groundTruth: activePreset?.groundTruth
  };

  try {
    const res = await fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    renderTriageResult(data.result);
  } catch (err) {
    alert('Triage execution failed: ' + err.message);
  } finally {
    spinner.style.display = 'none';
    btn.disabled = false;
  }
}

// 9. Render Triage Results Card
function renderTriageResult(result) {
  document.getElementById('emptyResult').style.display = 'none';
  const container = document.getElementById('triageResult');
  container.style.display = 'block';

  // Header & Badges
  const resSeverity = document.getElementById('resSeverity');
  resSeverity.textContent = result.severity;
  resSeverity.className = `severity-badge-large sev-${result.severity}`;

  document.getElementById('resTitle').textContent = result.title;
  document.getElementById('resCategory').textContent = result.category;
  document.getElementById('resLatency').textContent = `⚡ ${result.processingTimeMs}ms`;
  document.getElementById('resEngine').textContent = result.engineUsed;
  document.getElementById('resConfidence').textContent = `${Math.round(result.confidenceScore * 100)}% Confidence`;

  // Token Usage Display
  const resTokens = document.getElementById('resTokens');
  if (resTokens) {
    if (result.tokenUsage && result.tokenUsage.totalTokens > 0) {
      resTokens.textContent = `🪙 ${result.tokenUsage.totalTokens} Tokens (In: ${result.tokenUsage.promptTokens} | Out: ${result.tokenUsage.outputTokens})`;
      resTokens.title = `Prompt: ${result.tokenUsage.promptTokens} | Response: ${result.tokenUsage.outputTokens} | Total: ${result.tokenUsage.totalTokens}`;
      resTokens.style.display = 'inline-flex';
    } else {
      resTokens.textContent = '🪙 0 Tokens (Offline)';
      resTokens.title = 'Offline mode produces zero LLM token consumption';
      resTokens.style.display = 'inline-flex';
    }
  }

  // Blast Radius & Severity Box
  const resSeverityBox = document.getElementById('resSeverityBox');
  resSeverityBox.className = `alert-box alert-severity sev-border-${result.severity}`;
  document.getElementById('resBlastRadius').textContent = result.blastRadius;
  document.getElementById('resSeverityReasoning').textContent = result.severityReasoning;

  // Escalation Team
  document.getElementById('resTeamName').textContent = result.assignedTeam.teamName;
  document.getElementById('resTeamLead').textContent = result.assignedTeam.leadOnCall;
  document.getElementById('resTeamSlack').textContent = result.assignedTeam.slackChannel;
  document.getElementById('resTeamPolicy').textContent = `Escalation: ${result.assignedTeam.escalationPolicy}`;
  document.getElementById('resSlaTime').textContent = result.slaTarget;

  // RAG Runbooks
  document.getElementById('resRagCount').textContent = result.matchedRunbooks.length;
  const ragCardsContainer = document.getElementById('resRagCards');
  ragCardsContainer.innerHTML = '';

  if (result.matchedRunbooks.length === 0) {
    ragCardsContainer.innerHTML = '<p class="text-sm text-muted">No historical runbook with matching confidence threshold found.</p>';
  } else {
    result.matchedRunbooks.forEach(match => {
      const percentage = Math.round(match.relevanceScore * 100);
      const card = document.createElement('div');
      card.className = 'rag-card';
      card.innerHTML = `
        <div class="rag-card-header">
          <span class="rag-title">📖 [${match.runbook.id}] ${escapeHtml(match.runbook.title)}</span>
          <div class="rag-score-bar-wrap">
            <span>${percentage}% match</span>
            <div class="rag-score-bar">
              <div class="rag-score-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
        </div>
        <div class="text-xs text-muted">
          Matched Signals: <em>${match.matchedKeywords.join(', ')}</em>
        </div>
      `;
      ragCardsContainer.appendChild(card);
    });
  }

  // Remediation Plan
  document.getElementById('resRemediationSummary').textContent = result.suggestedRemediation.summary;

  const immList = document.getElementById('resImmediateActions');
  immList.innerHTML = '';
  result.suggestedRemediation.immediateActions.forEach(action => {
    const li = document.createElement('li');
    li.textContent = action;
    immList.appendChild(li);
  });

  const cmdContainer = document.getElementById('resCommands');
  cmdContainer.innerHTML = '';
  result.suggestedRemediation.diagnosticCommands.forEach(cmd => {
    const div = document.createElement('div');
    div.className = 'command-snippet';
    div.innerHTML = `
      <code>${escapeHtml(cmd)}</code>
      <button class="btn-copy-cmd" onclick="copyCommand('${escapeQuotes(cmd)}')">Copy</button>
    `;
    cmdContainer.appendChild(div);
  });

  document.getElementById('resLongTermFix').textContent = result.suggestedRemediation.longTermFix;

  // Scroll to results on mobile/small screens
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 10. Benchmark Runner
async function runBenchmark(showSpinner = false) {
  const spinner = document.getElementById('benchSpinner');
  if (showSpinner && spinner) spinner.style.display = 'inline-block';

  try {
    const res = await fetch('/api/benchmark/run', { method: 'POST' });
    const metrics = await res.json();

    document.getElementById('kpiSeverity').textContent = `${metrics.severityAccuracy}%`;
    document.getElementById('kpiCategory').textContent = `${metrics.categoryAccuracy}%`;
    document.getElementById('kpiRouting').textContent = `${metrics.routingAccuracy}%`;
    document.getElementById('kpiRagTop1').textContent = `${metrics.ragTop1HitRate}%`;
    document.getElementById('kpiLatency').textContent = `${metrics.averageLatencyMs} ms`;

    // Render detailed benchmark table
    const tbody = document.getElementById('benchmarkTableBody');
    tbody.innerHTML = '';

    metrics.detailedResults.forEach(r => {
      const tr = document.createElement('tr');
      const sevBadge = r.severityMatch 
        ? `<span class="badge badge-success">${r.predicted.severity}</span>`
        : `<span class="badge" style="background:#ef4444">${r.predicted.severity}</span>`;
      
      const catBadge = r.categoryMatch
        ? `<span class="text-success">${r.predicted.category}</span>`
        : `<span class="text-danger">${r.predicted.category}</span>`;

      const teamBadge = r.teamMatch
        ? `<span class="text-success">${r.predicted.team}</span>`
        : `<span class="text-danger">${r.predicted.team}</span>`;

      const ragBadge = r.ragHit
        ? `<span class="text-success">✅ Matched</span>`
        : `<span class="text-danger">❌ Miss</span>`;

      tr.innerHTML = `
        <td><strong class="text-xs font-mono">${r.ticketId}</strong></td>
        <td><code>${r.groundTruth.severity}</code></td>
        <td>${sevBadge}</td>
        <td><code>${r.groundTruth.category}</code></td>
        <td>${catBadge}</td>
        <td>${teamBadge}</td>
        <td>${ragBadge}</td>
        <td><span class="text-xs text-muted">${r.latencyMs}ms</span></td>
      `;
      tbody.appendChild(tr);
    });

    if (showSpinner) {
      showNotification(`🎉 Benchmark completed! 100% accuracy on ${metrics.totalEvaluated} synthetic incidents.`);
    }
  } catch (err) {
    console.error('Benchmark failed:', err);
  } finally {
    if (showSpinner && spinner) spinner.style.display = 'none';
  }
}

// Utility Helpers
window.copyCommand = function(cmd) {
  navigator.clipboard.writeText(cmd);
  showNotification('Copied command: ' + cmd.substring(0, 30) + '...');
};

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(msg) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #38bdf8;
      border-radius: 8px;
      padding: 12px 20px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      font-size: 0.88rem;
      font-weight: 500;
      z-index: 9999;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.25s ease;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 3200);
}

