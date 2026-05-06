require('dotenv').config();

const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

/* ── TRUST PROXY (needed behind Replit's reverse proxy) ── */
app.set('trust proxy', 1);

/* ── MIDDLEWARE ── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── RATE LIMITING: 20 requests per IP per hour ── */
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again later.' },
});
app.use('/api/speakup', limiter);

/* ── HEALTH CHECK ── */
app.get('/api/healthz', (_req, res) => res.json({ status: 'ok' }));

/* ── HELPER: get Gemini AI client ── */
function getAI() {
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error('Gemini AI integration env vars are not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion: '',
      baseUrl,
    },
  });
}

/* ── POST /api/speakup/topic ── */
app.post('/api/speakup/topic', async (req, res) => {
  const { category } = req.body;

  if (!category || typeof category !== 'string') {
    return res.status(400).json({ error: 'category is required' });
  }

  let ai;
  try {
    ai = getAI();
  } catch {
    return res.status(500).json({ error: 'AI service is not configured on the server.' });
  }

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate one speaking topic from the category: ${category}.

Rules:
- Write it like a question a friend would ask you over coffee
- Use short, simple, everyday words — no academic or formal language
- Avoid words like: abolished, concept, implications, fundamental, discourse, paradigm, societal, worldwide
- Keep it under 20 words
- Make it thought-provoking but easy to understand for a college student or young professional
- Return only the topic as a single sentence, no quotes, no numbering

Examples of the right tone:
- "Do you think social media is making us lonelier, or more connected?"
- "Would you take a job you hate if it paid really well?"
- "Is it okay to lie to protect someone's feelings?"`,
    });
    const topic = result.text.trim();
    res.json({ topic });
  } catch (err) {
    console.error('Gemini topic error:', err.message);
    res.status(500).json({ error: 'Failed to generate topic. Please try again.' });
  }
});

/* ── POST /api/speakup/feedback ── */
app.post('/api/speakup/feedback', async (req, res) => {
  const { topic, category, transcript, duration } = req.body;

  if (!topic || !category || !transcript || duration === undefined) {
    return res.status(400).json({ error: 'topic, category, transcript, and duration are all required.' });
  }

  let ai;
  try {
    ai = getAI();
  } catch {
    return res.status(500).json({ error: 'AI service is not configured on the server.' });
  }

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a friendly communication coach. The user was given this topic: "${topic}" from category: "${category}". They spoke for ${duration} seconds. Here is their transcript: "${transcript}".

Give feedback on:
1) Filler words used (list them with count)
2) Clarity (score out of 10 with one line reason)
3) Pace (too fast / good / too slow)
4) Structure (did they open, elaborate, and close properly?)
5) One specific actionable tip to improve
6) One encouraging closing line

Keep tone friendly and constructive.

Return a JSON object with exactly these keys:
- fillers: object mapping each filler word string to its integer count
- clarity: object with "score" (number 1-10) and "reason" (string)
- pace: string, one of "too fast", "good", or "too slow"
- structure: string describing their structure
- tip: string with one actionable improvement tip
- encouragement: string with an encouraging closing line

Return ONLY the JSON object, no markdown, no code fences.`,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      },
    });

    let feedback;
    try {
      feedback = JSON.parse(result.text);
    } catch {
      feedback = { raw: result.text };
    }
    res.json(feedback);
  } catch (err) {
    console.error('Gemini feedback error:', err.message);
    res.status(500).json({ error: 'Failed to generate feedback. Please try again.' });
  }
});

/* ── START ── */
app.listen(PORT, () => {
  console.log(`SpeakUp API server running on port ${PORT}`);
});
