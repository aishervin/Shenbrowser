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

// Base URL for Browser Use Cloud deployment (with auto-detect failover)
const EU_BASE_URL = 'https://api.eu.browser-use.com/api/v4';
const GLOBAL_BASE_URL = 'https://api.browser-use.com/api/v4';

let ACTIVE_BASE_URL = EU_BASE_URL;

// Helper to obtain authenticated BrowserUse client
function getBrowserClient(baseUrl?: string): BrowserUse | null {
  const apiKey = process.env.BROWSER_USE_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new BrowserUse({
    apiKey: apiKey.trim(),
    baseUrl: baseUrl || ACTIVE_BASE_URL,
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
// System Status Endpoint & Key Validity Cache
// -------------------------------------------------------------
let cachedKeyStatus: { isValid: boolean; error?: string } | null = null;
let lastKeyChecked: string | null = null;

async function checkApiKeyValidity(client: BrowserUse | null): Promise<{ isValid: boolean; error?: string; region?: string }> {
  const currentKey = process.env.BROWSER_USE_API_KEY || '';
  if (!client || !currentKey.trim()) {
    return { isValid: false, error: 'BROWSER_USE_API_KEY is not configured in environment secrets.' };
  }
  if (lastKeyChecked === currentKey && cachedKeyStatus) {
    return cachedKeyStatus;
  }

  // Try EU first
  try {
    const euClient = getBrowserClient(EU_BASE_URL)!;
    await euClient.profiles.list({ pageSize: 1 });
    ACTIVE_BASE_URL = EU_BASE_URL;
    cachedKeyStatus = { isValid: true };
    lastKeyChecked = currentKey;
    return { ...cachedKeyStatus, region: 'EU' };
  } catch (err: any) {
    // If EU fails with auth error, try Global
    const isAuthError = err?.message?.includes('Invalid API key') || err?.status === 401;
    if (isAuthError) {
      try {
        const globalClient = getBrowserClient(GLOBAL_BASE_URL)!;
        await globalClient.profiles.list({ pageSize: 1 });
        ACTIVE_BASE_URL = GLOBAL_BASE_URL;
        cachedKeyStatus = { isValid: true };
        lastKeyChecked = currentKey;
        return { ...cachedKeyStatus, region: 'Global' };
      } catch (gErr: any) {
        const errorMsg = String(gErr?.message || gErr || 'Invalid API key on all regions');
        cachedKeyStatus = { isValid: false, error: errorMsg };
        lastKeyChecked = currentKey;
        return cachedKeyStatus;
      }
    }
    
    const errorMsg = String(err?.message || err || 'Network error');
    cachedKeyStatus = { isValid: false, error: errorMsg };
    lastKeyChecked = currentKey;
    return cachedKeyStatus;
  }
}

app.get('/api/status', async (req, res) => {
  const buKey = process.env.BROWSER_USE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const client = getBrowserClient();
  const validity = await checkApiKeyValidity(client);

  res.json({
    browserUseConfigured: Boolean(buKey && buKey.trim().length > 0 && validity.isValid),
    browserUseKeyPresent: Boolean(buKey && buKey.trim().length > 0),
    browserUseKeyValid: validity.isValid,
    browserUseError: validity.error || null,
    browserUseKeyMasked: buKey ? `bu_***${buKey.slice(-4)}` : null,
    geminiConfigured: Boolean(geminiKey && geminiKey.trim().length > 0),
    baseUrl: ACTIVE_BASE_URL,
    region: (validity as any).region || (validity.isValid ? 'Auto' : 'Unknown'),
    recommendedModels: ['gpt-5.6-luna', 'gpt-5.6-sol'],
  });
});

// -------------------------------------------------------------
// Standalone Cloud Browser Endpoints
// -------------------------------------------------------------

// Start a standalone cloud browser
app.post('/api/browser/start', async (req, res) => {
  const client = getBrowserClient();
  const {
    timeout = 10,
    proxyCountryCode = 'de',
    enableRecording = true,
    profileId,
    startUrl,
    testMode = false,
  } = req.body;

  const returnSimulation = (warning?: string) => {
    const simId = `sim-browser-${Date.now()}`;
    return res.json({
      id: simId,
      status: 'running',
      liveUrl: startUrl || 'https://accounts.google.com',
      cdpUrl: `wss://api.eu.browser-use.com/cdp/${simId}`,
      timeout,
      proxyCountryCode,
      profileId,
      isSimulated: true,
      createdAt: new Date().toISOString(),
      message: 'Running in interactive simulation mode.',
      warning: warning || 'Running in interactive simulation mode.',
    });
  };

  if (!client || testMode) {
    return returnSimulation();
  }

  try {
    const browser = await client.browsers.create({
      timeout: Number(timeout),
      proxyCountryCode: proxyCountryCode === 'none' ? null : (proxyCountryCode as any),
      enableRecording: Boolean(enableRecording),
      profileId: profileId || undefined,
    });

    res.json(browser);
  } catch (error: any) {
    console.warn('Failed to create cloud browser session, falling back to simulated session:', error?.message);
    const errorMsg = String(error?.message || '');
    const isAuthError =
      errorMsg.includes('Invalid API key') ||
      errorMsg.includes('401') ||
      errorMsg.includes('unauthorized') ||
      errorMsg.includes('credit') ||
      error?.status === 401;

    // Automatically fall back to simulation so the user experience is smooth and uninterrupted
    if (isAuthError || testMode) {
      if (cachedKeyStatus) cachedKeyStatus = { isValid: false, error: errorMsg };
      return returnSimulation(errorMsg);
    }

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
    console.warn('Failed to list browsers:', error?.message);
    res.json({ items: [] });
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
    console.warn(`Failed to get browser ${req.params.id}:`, error?.message);
    res.json({ id: req.params.id, status: 'unknown' });
  }
});

// -------------------------------------------------------------
// Persistent Profiles Endpoints (For Multi-Account Google Logins)
// -------------------------------------------------------------
app.get('/api/profiles', async (req, res) => {
  const client = getBrowserClient();
  const fallbackProfiles = [
    { id: 'profile-google-1', name: 'اکانت ۱ (اصلی)', status: 'authenticated', isSimulated: true },
    { id: 'profile-google-2', name: 'اکانت ۲ (توسعه)', status: 'needs_login', isSimulated: true },
    { id: 'profile-google-3', name: 'اکانت ۳ (رزرو)', status: 'needs_login', isSimulated: true },
    { id: 'profile-google-4', name: 'اکانت ۴ (سرویس‌ها)', status: 'needs_login', isSimulated: true },
  ];

  if (!client) {
    return res.json({ items: fallbackProfiles });
  }

  try {
    const list = await client.profiles.list();
    res.json(list);
  } catch (error: any) {
    console.warn('Failed to list profiles from cloud, falling back to local profiles:', error?.message);
    res.json({ items: fallbackProfiles, warning: error?.message });
  }
});

app.post('/api/profiles', async (req, res) => {
  const client = getBrowserClient();
  const { name } = req.body;

  const fallback = {
    id: `sim-profile-${Date.now()}`,
    name: name || 'Google Account Profile',
    createdAt: new Date().toISOString(),
    status: 'needs_login',
    isSimulated: true,
  };

  if (!client) {
    return res.json(fallback);
  }

  try {
    const profile = await client.profiles.create({ name: name || 'Google Account Profile' });
    res.json(profile);
  } catch (error: any) {
    console.warn('Failed to create profile on cloud:', error?.message);
    res.json({ ...fallback, warning: error?.message });
  }
});

app.delete('/api/profiles/:id', async (req, res) => {
  const client = getBrowserClient();
  const { id } = req.params;

  if (!client) {
    return res.json({ success: true, id });
  }

  try {
    await client.profiles.delete(id);
    res.json({ success: true, id });
  } catch (error: any) {
    console.warn(`Failed to delete profile ${id}:`, error?.message);
    res.json({ success: true, id });
  }
});

// -------------------------------------------------------------
// Free API Services Directory & Harvester Endpoints
// -------------------------------------------------------------
const HARVESTER_SERVICES = [
  {
    id: 'groq',
    name: 'Groq Cloud',
    logo: '⚡',
    websiteUrl: 'https://console.groq.com',
    keyUrl: 'https://console.groq.com/keys',
    freeTierDescription: 'Ultra-fast Llama 3 & Mixtral inference (Generous free tier tokens)',
    instructionsPrompt: 'Go to https://console.groq.com/keys. Click "Continue with Google" or "Sign in with Google" to authenticate using the existing session. Once in the dashboard, navigate to API Keys (https://console.groq.com/keys). Click "Create API Key", name it "AutoKey", copy the generated secret key (gsk_...), and output it as JSON with keys: service, apiKey.',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    logo: '🤗',
    websiteUrl: 'https://huggingface.co',
    keyUrl: 'https://huggingface.co/settings/tokens',
    freeTierDescription: 'Free Inference API tokens for open-source AI models',
    instructionsPrompt: 'Navigate to https://huggingface.co/login. Click "Sign in with Google" to authenticate with the existing Google session. Once logged in, go to https://huggingface.co/settings/tokens. Click "Create new token", choose type "Read", name it "HarvesterToken", submit, and copy the token (hf_...). Return JSON with keys: service, apiKey.',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    logo: '🔀',
    websiteUrl: 'https://openrouter.ai',
    keyUrl: 'https://openrouter.ai/keys',
    freeTierDescription: 'Unified access to multiple LLMs with free tier models',
    instructionsPrompt: 'Navigate to https://openrouter.ai/keys. Click "Sign in" and select "Continue with Google". Once authenticated, click "Create Key", name it "AutoKey", copy the secret key (sk-or-...), and output JSON with keys: service, apiKey.',
  },
  {
    id: 'tavily',
    name: 'Tavily Search API',
    logo: '🔍',
    websiteUrl: 'https://tavily.com',
    keyUrl: 'https://app.tavily.com/home',
    freeTierDescription: '1,000 free real-time search queries/month for AI agents',
    instructionsPrompt: 'Go to https://app.tavily.com/sign-in. Click "Continue with Google". Once the dashboard loads, locate the API Key on the home dashboard or API Keys section (tvly-...). Copy the full API key and output as JSON with keys: service, apiKey.',
  },
  {
    id: 'cerebras',
    name: 'Cerebras Cloud',
    logo: '🧠',
    websiteUrl: 'https://cloud.cerebras.ai',
    keyUrl: 'https://cloud.cerebras.ai/platform',
    freeTierDescription: 'High-speed Llama 3.1 70B & 8B inference free tier',
    instructionsPrompt: 'Go to https://cloud.cerebras.ai. Click "Sign in with Google". Once in the dashboard, navigate to API Keys. Click "Create API Key", copy the key (csk-...), and output JSON with keys: service, apiKey.',
  },
  {
    id: 'mistral',
    name: 'Mistral AI Console',
    logo: '🌪️',
    websiteUrl: 'https://console.mistral.ai',
    keyUrl: 'https://console.mistral.ai/api-keys',
    freeTierDescription: 'La Plateforme free tier access for Mistral models',
    instructionsPrompt: 'Go to https://console.mistral.ai/api-keys. Click "Sign in with Google". Navigate to API Keys section. Click "Create new key", name it "AutoKey", copy the secret token, and output as JSON with keys: service, apiKey.',
  },
];

app.get('/api/harvester/services', (req, res) => {
  res.json({ services: HARVESTER_SERVICES });
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
    profileId,
    testMode = false,
  } = req.body;

  const returnSimRun = (warning?: string) => {
    const simRunId = `run-sim-${Date.now()}`;
    return res.json({
      id: simRunId,
      sessionId: `session-sim-${Date.now()}`,
      status: 'running',
      task,
      model,
      profileId,
      isSimulated: true,
      createdAt: new Date().toISOString(),
      warning: warning || 'Executing in interactive simulation mode.',
    });
  };

  if (!client || testMode) {
    return returnSimRun();
  }

  try {
    const run = await client.runs.create({
      task: task.trim(),
      model: model || 'gpt-5.6-luna',
      sessionId: sessionId || undefined,
      keepAlive: Number(keepAlive) || 120,
      browserSettings: {
        profileId: profileId || undefined,
        proxyCountryCode: proxyCountryCode === 'none' ? null : proxyCountryCode,
        record: Boolean(record),
      },
    });

    res.json(run);
  } catch (error: any) {
    console.warn('Failed to create agent run on cloud, falling back to simulation:', error?.message);
    const errorMsg = String(error?.message || '');
    const isAuthError =
      errorMsg.includes('Invalid API key') ||
      errorMsg.includes('401') ||
      errorMsg.includes('unauthorized') ||
      errorMsg.includes('credit') ||
      error?.status === 401;

    if (isAuthError || testMode) {
      if (cachedKeyStatus) cachedKeyStatus = { isValid: false, error: errorMsg };
      return returnSimRun(errorMsg);
    }

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
    console.warn('Failed to list runs:', error?.message);
    res.json({ items: [] });
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
