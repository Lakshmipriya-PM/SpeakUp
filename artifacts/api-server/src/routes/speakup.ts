import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

function getOpenAI(): OpenAI {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }
  return new OpenAI({ apiKey });
}

router.post("/topic", async (req: Request, res: Response) => {
  const { category } = req.body as { category?: string };

  if (!category || typeof category !== "string") {
    res.status(400).json({ error: "category is required" });
    return;
  }

  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch {
    res.status(500).json({ error: "OpenAI API key is not configured on the server." });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Give me one random, surprising, thought-provoking speaking topic from the category: ${category}. Return only the topic as a single sentence. No explanation, no numbering, no quotes.`,
        },
      ],
      max_tokens: 100,
    });

    const topic = completion.choices[0]?.message?.content?.trim() ?? "";
    res.json({ topic });
  } catch (err) {
    req.log.error({ err }, "Error calling OpenAI for topic");
    res.status(500).json({ error: "Failed to generate topic" });
  }
});

router.post("/feedback", async (req: Request, res: Response) => {
  const { topic, category, transcript, duration } = req.body as {
    topic?: string;
    category?: string;
    transcript?: string;
    duration?: number;
  };

  if (!topic || !category || !transcript || duration === undefined) {
    res.status(400).json({ error: "topic, category, transcript, and duration are required" });
    return;
  }

  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch {
    res.status(500).json({ error: "OpenAI API key is not configured on the server." });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `You are a friendly communication coach. The user was given this topic: ${topic} from category: ${category}. They spoke for ${duration} seconds. Here is their transcript: ${transcript}. Give feedback on: 1) Filler words used (list them with count), 2) Clarity (score out of 10 with one line reason), 3) Pace (too fast / good / too slow), 4) Structure (did they open, elaborate, and close properly?), 5) One specific actionable tip to improve, 6) One encouraging closing line. Keep tone friendly and constructive. Return a JSON object with these exact keys: fillers (object mapping filler word to count), clarity (object with score number and reason string), pace (string: "too fast", "good", or "too slow"), structure (string describing their structure), tip (string), encouragement (string).`,
        },
      ],
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let feedback: unknown;
    try {
      feedback = JSON.parse(raw);
    } catch {
      feedback = { raw };
    }
    res.json(feedback);
  } catch (err) {
    req.log.error({ err }, "Error calling OpenAI for feedback");
    res.status(500).json({ error: "Failed to generate feedback" });
  }
});

export default router;
