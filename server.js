require("dotenv").config();

const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

/* ── MIDDLEWARE ── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── RATE LIMITING: 20 requests per IP per hour ── */
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please try again later." },
});
app.use("/api/speakup", limiter);

/* ── HEALTH CHECK ── */
app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

/* ── HELPER: get Gemini model ── */
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

/* ── POST /api/speakup/topic ── */
app.post("/api/speakup/topic", async (req, res) => {
  const { category } = req.body;

  if (!category || typeof category !== "string") {
    return res.status(400).json({ error: "category is required" });
  }

  let model;
  try {
    model = getModel();
  } catch {
    return res
      .status(500)
      .json({ error: "Gemini API key is not configured on the server." });
  }

  try {
    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    console.log("KEY:", process.env.GEMINI_API_KEY);
    console.log("MODEL:", model);

    const result = await model.generateContent(
      `Give me one random, surprising, thought-provoking speaking topic from the category: ${category}. Return only the topic as a single sentence. No explanation, no numbering, no quotes.`
    );

    const topic = result.response.text().trim();

    res.json({ topic });

  } catch (err) {
    console.error("Gemini topic error:", err.message);

    res.status(500).json({
      error: "Failed to generate topic. Please try again."
    });
  }
    console.error("Gemini topic error:", err.message);
    res
      .status(500)
      .json({ error: "Failed to generate topic. Please try again." });
  }
});

/* ── POST /api/speakup/feedback ── */
app.post("/api/speakup/feedback", async (req, res) => {
  const { topic, category, transcript, duration } = req.body;

  if (!topic || !category || !transcript || duration === undefined) {
    return res
      .status(400)
      .json({
        error: "topic, category, transcript, and duration are all required.",
      });
  }

  let model;
  try {
    model = getModel();
  } catch {
    return res
      .status(500)
      .json({ error: "Gemini API key is not configured on the server." });
  }

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a friendly communication coach. The user was given this topic: "${topic}" from category: "${category}". They spoke for ${duration} seconds. Here is their transcript: "${transcript}".

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
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const raw = result.response.text();
    let feedback;
    try {
      feedback = JSON.parse(raw);
    } catch {
      feedback = { raw };
    }
    res.json(feedback);
  } catch (err) {
    console.error("Gemini feedback error:", err.message);
    res
      .status(500)
      .json({ error: "Failed to generate feedback. Please try again." });
  }
});

/* ── START ── */
console.log("GEMINI:", process.env.GEMINI_API_KEY);

app.listen(PORT, () => {
  console.log(`SpeakUp API server running on port ${PORT}`);
});
