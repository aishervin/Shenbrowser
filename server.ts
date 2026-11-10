import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { BrowserUse } from 'browser-use-sdk/v4';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Base URL for Browser Use Cloud EU deployment
const BROWSER_USE_BASE_URL =
  process.env.BROWSER_USE_BASE_URL || 'https://api.eu.browser-use.com/api/v4';

// Helper to obtain authenticated BrowserUse client
function getBrowserClient(): BrowserUse | null {
  const apiKey = process.env.BROWSER_USE_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new BrowserUse({
    apiKey: apiKey.trim(),
    baseUrl: BROWSER_USE_BASE_URL,
  });
}

// Server-side Gemini client for prompt optimization & result synthesis
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Resilient Gemini call with exponential backoff & model fallback
async function callGeminiWithRetry(params: any, retries = 2) {
  const modelPreference = [params.model || 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const modelName of modelPreference) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || '');
        const isTransient =
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('RESOURCE_EXHAUSTED');

        if (isTransient && attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
          continue;
        }
        break;
      }
    }
  }
  throw lastError;
}

// -------------------------------------------------------------
// System Status Endpoint
// -------------------------------------------------------------
app.get('/api/status', (req, res) => {
  const buKey = process.env.BROWSER_USE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  res.json({
    browserUseConfigured: Boolean(buKey && buKey.trim().length > 0),
    browserUseKeyMasked: buKey ? `bu_***${buKey.slice(-4)}` : null,
    geminiConfigured: Boolean(geminiKey && geminiKey.trim().length > 0),
    baseUrl: BROWSER_USE_BASE_URL,
    recommendedModels: ['gpt-5.6-luna', 'gpt-5.6-sol'],
  });
});

// -------------------------------------------------------------
// Standalone Cloud Browser Endpoints
// -------------------------------------------------------------

// Start a standalone cloud browser
app.post('/api/browser/start', async (req, res) => {
  const client = getBrowserClient();
  const { timeout = 10, proxyCountryCode = 'de', enableRecording = true, testMode = false } = req.body;

  if (!client) {
    if (testMode) {
      // Friendly simulation preview when user has not yet configured the API key
      const simId = `sim-browser-${Date.now()}`;
      return res.json({
        id: simId,
        status: 'running',
        liveUrl: 'https://example.com',
        cdpUrl: `wss://api.eu.browser-use.com/cdp/${simId}`,
        timeout,
        proxyCountryCode,
        isSimulated: true,
        createdAt: new Date().toISOString(),
        message: 'Running in demo mode. Add BROWSER_USE_API_KEY for live cloud Chrome instances.',
      });
    }

    return res.status(401).json({
      error: 'BROWSER_USE_API_KEY is not configured in environment secrets.',
      code: 'API_KEY_REQUIRED',
      hint: 'Get your EU API key in one click at https://cloud.eu.browser-use.com/settings?tab=api-keys&new=1 and add it to the Secrets panel in AI Studio.',
    });
  }

  try {
    const browser = await client.browsers.create({
      timeout: Number(timeout),
      proxyCountryCode: proxyCountryCode === 'none' ? null : (proxyCountryCode as any),
      enableRecording: Boolean(enableRecording),
    });

    res.json(browser);
  } catch (error: any) {
    console.error('Failed to create browser:', error);
    res.status(500).json({
      error: error?.message || 'Failed to start cloud browser session',
      details: error,
    });
  }
});

// Stop a standalone cloud browser (immediately ends billing and refunds unused time)
app.post('/api/browser/:id/stop', async (req, res) => {
  const client = getBrowserClient();
  const { id } = req.params;

  if (!client) {
    return res.json({ success: true, isSimulated: true, id, status: 'stopped' });
  }

  try {
    const stopped = await client.browsers.stop(id);
    res.json({ success: true, result: stopped });
  } catch (error: any) {
    console.error(`Failed to stop browser ${id}:`, error);
    res.status(500).json({
      error: error?.message || 'Failed to stop browser session',
    });
  }
});

// List cloud browser sessions
app.get('/api/browser/list', async (req, res) => {
  const client = getBrowserClient();
  if (!client) {
    return res.json({ items: [] });
  }

  try {
    const list = await client.browsers.list({
      pageSize: req.query.limit ? Number(req.query.limit) : 20,
    });
    res.json(list);
  } catch (error: any) {
    console.error('Failed to list browsers:', error);
    res.status(500).json({ error: error?.message || 'Failed to list browsers' });
  }
});

// Get browser details
app.get('/api/browser/:id', async (req, res) => {
  const client = getBrowserClient();
  if (!client) {
    return res.json({ id: req.params.id, status: 'unknown' });
  }

  try {
    const browser = await client.browsers.get(req.params.id);
    res.json(browser);
  } catch (error: any) {
    console.error(`Failed to get browser ${req.params.id}:`, error);
    res.status(500).json({ error: error?.message || 'Failed to get browser' });
  }
});

// -------------------------------------------------------------
// Browser Use Agent Run Endpoints
// -------------------------------------------------------------

// Create and trigger an autonomous agent run
app.post('/api/agent/run', async (req, res) => {
  const client = getBrowserClient();
  const {
    task,
    model = 'gpt-5.6-luna',
    proxyCountryCode = 'de',
    record = true,
    keepAlive = 120,
    sessionId,
    testMode = false,
  } = req.body;

  if (!task || typeof task !== 'string') {
    return res.status(400).json({ error: 'task string is required' });
  }

  if (!client) {
    if (testMode) {
      // Mock simulation for initial onboarding
      const simRunId = `run-sim-${Date.now()}`;
      return res.json({
        id: simRunId,
        sessionId: `session-sim-${Date.now()}`,
        status: 'running',
        task,
        model,
        isSimulated: true,
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(401).json({
      error: 'BROWSER_USE_API_KEY is not configured in environment secrets.',
      code: 'API_KEY_REQUIRED',
      hint: 'Get your EU API key at https://cloud.eu.browser-use.com/settings?tab=api-keys&new=1',
    });
  }

  try {
    const run = await client.runs.create({
      task: task.trim(),
      model: model || 'gpt-5.6-luna',
      sessionId: sessionId || undefined,
      keepAlive: Number(keepAlive) || 120,
      browserSettings: {
        proxyCountryCode: proxyCountryCode === 'none' ? null : proxyCountryCode,
        record: Boolean(record),
      },
    });

    res.json(run);
  } catch (error: any) {
    console.error('Failed to create agent run:', error);
    res.status(500).json({
      error: error?.message || 'Failed to create agent run',
      details: error,
    });
  }
});

// Fast poll target for run status
app.get('/api/agent/run/:id/status', async (req, res) => {
  const client = getBrowserClient();
  const { id } = req.params;

  if (!client) {
    return res.json({ id, status: 'completed', isSimulated: true });
  }

  try {
    const status = await client.runs.status(id);
    res.json(status);
  } catch (error: any) {
    console.error(`Failed to poll status for run ${id}:`, error);
    res.status(500).json({ error: error?.message || 'Failed to poll run status' });
  }
});

// Incremental events (steps, actions, thoughts)
app.get('/api/agent/run/:id/events', async (req, res) => {
  const client = getBrowserClient();
  const { id } = req.params;
  const after = req.query.after ? Number(req.query.after) : undefined;

  if (!client) {
    return res.json({
      items: [
        {
          id: 1,
          type: 'agent.thought',
          data: { thought: 'Navigating to website to extract information...' },
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          type: 'browser.navigate',
          data: { url: 'https://example.com' },
          createdAt: new Date().toISOString(),
        },
      ],
      hasMore: false,
    });
  }

  try {
    const events = await client.runs.events(id, {
      after: after !== undefined ? after : null,
      limit: 50,
    });
    res.json(events);
  } catch (error: any) {
    console.error(`Failed to fetch events for run ${id}:`, error);
    res.status(500).json({ error: error?.message || 'Failed to fetch run events' });
  }
});

// Full summary fetch (called upon completion)
app.get('/api/agent/run/:id', async (req, res) => {
  const client = getBrowserClient();
  const { id } = req.params;

  if (!client) {
    return res.json({
      id,
      status: 'completed',
      isSimulated: true,
      result: 'Simulated task execution completed successfully.',
    });
  }

  try {
    const summary = await client.runs.get(id);
    res.json(summary);
  } catch (error: any) {
    console.error(`Failed to get run summary for ${id}:`, error);
    res.status(500).json({ error: error?.message || 'Failed to get run summary' });
  }
});

// Cancel run
app.post('/api/agent/run/:id/cancel', async (req, res) => {
  const client = getBrowserClient();
  const { id } = req.params;

  if (!client) {
    return res.json({ success: true, id, status: 'cancelled' });
  }

  try {
    const result = await client.runs.cancel(id);
    res.json(result);
  } catch (error: any) {
    console.error(`Failed to cancel run ${id}:`, error);
    res.status(500).json({ error: error?.message || 'Failed to cancel run' });
  }
});

// List recent runs
app.get('/api/agent/runs', async (req, res) => {
  const client = getBrowserClient();
  if (!client) {
    return res.json({ items: [] });
  }

  try {
    const runs = await client.runs.list({
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    res.json(runs);
  } catch (error: any) {
    console.error('Failed to list runs:', error);
    res.status(500).json({ error: error?.message || 'Failed to list runs' });
  }
});

// -------------------------------------------------------------
// Gemini AI Prompt Architect & Result Synthesizer
// -------------------------------------------------------------

// Turns a simple idea into an ultra-precise Browser Use agent instruction
app.post('/api/agent/optimize-prompt', async (req, res) => {
  try {
    const { rawPrompt, targetUrl, desiredOutputFormat = 'JSON' } = req.body;

    if (!rawPrompt) {
      return res.status(400).json({ error: 'rawPrompt is required' });
    }

    const systemInstruction = `
You are the world's foremost Browser Use Cloud automation prompt engineer.
You convert vague web automation intentions into deterministic, step-by-step instructions for AI browser agents.
Follow these key best practices:
1. Always specify starting URLs explicitly (with https://).
2. Detail exact sequential actions: search, wait for navigation, click specific element classes or text labels.
3. Explicitly describe how to bypass cookie banners, popups, or overlays if encountered.
4. Specify structured extraction requirements with exact keys.
5. End with a definite completion criteria so the agent knows when the task is finished.
`;

    const prompt = `
Goal/Intent: "${rawPrompt}"
Starting Target URL: "${targetUrl || 'Auto-detect'}"
Desired Output Format: "${desiredOutputFormat}"

Return a JSON object with:
- "optimizedTask": The refined, highly reliable natural language prompt to give to the Browser Use agent.
- "recommendedModel": "gpt-5.6-luna" or "gpt-5.6-sol"
- "recommendedProxyCountry": "de" or null
- "estimatedSteps": expected number of navigation/interaction steps
- "outputSchemaDescription": description of the extracted schema
- "tips": 2 bullet points for highest reliability.
`;

    let parsed;
    try {
      const response = await callGeminiWithRetry({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              optimizedTask: { type: Type.STRING },
              recommendedModel: { type: Type.STRING },
              recommendedProxyCountry: { type: Type.STRING },
              estimatedSteps: { type: Type.INTEGER },
              outputSchemaDescription: { type: Type.STRING },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['optimizedTask', 'recommendedModel', 'estimatedSteps', 'tips'],
          },
        },
      });
      parsed = JSON.parse(response.text || '{}');
    } catch (modelErr) {
      // Deterministic fallback if model under temporary load
      parsed = {
        optimizedTask: `Go to ${targetUrl || 'the target website'}. Execute task: "${rawPrompt}". Handle any cookie or privacy banners by dismissing them. Extract all relevant records and format as structured ${desiredOutputFormat}. Finish when the primary table or list is collected.`,
        recommendedModel: 'gpt-5.6-luna',
        recommendedProxyCountry: 'de',
        estimatedSteps: 4,
        outputSchemaDescription: `Structured ${desiredOutputFormat} containing extracted data fields.`,
        tips: [
          'Specify explicit anchor selectors or visible text if elements take time to load.',
          'Keep residential proxy enabled in Germany (de) to bypass geo-restrictions.',
        ],
      };
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Prompt optimization error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to optimize prompt',
      fallbackTask: req.body.rawPrompt,
    });
  }
});

// Synthesize and format results
app.post('/api/agent/synthesize', async (req, res) => {
  try {
    const { task, rawOutput } = req.body;

    const prompt = `You are a data synthesis analyst.
A browser automation agent executed the following task: "${task}"
Here is the raw extracted output from the webpage:
${typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput)}

Synthesize this data into:
1. A clean, executive markdown summary
2. Formatted tables where appropriate
3. Key insights or takeaways.`;

    try {
      const response = await callGeminiWithRetry({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      res.json({ synthesizedText: response.text });
    } catch (e) {
      res.json({
        synthesizedText: `### Extracted Data Overview\n\nTask: ${task}\n\n${typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput, null, 2)}`,
      });
    }
  } catch (error: any) {
    console.error('Data synthesis error:', error);
    res.status(500).json({ error: error?.message || 'Failed to synthesize output' });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`AI Browser Agent Builder running at http://0.0.0.0:${port}`);
  });
}

startServer();
