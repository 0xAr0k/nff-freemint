import OpenAI from "openai";
import { env } from "../env";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const PROMPT_QUESTION = "What makes you human?";
const MAX_ANSWER_LENGTH = 140;

export async function generateAIAnswer(): Promise<string> {
  const rand = Math.random();
  let config: { maxLength: number; style: string; tone: string };

  if (rand < 0.33) {
    config = {
      maxLength: Math.floor(Math.random() * 35) + 25,
      style: "brief, raw, unfiltered",
      tone: ["positive", "negative", "neutral", "complex"][
        Math.floor(Math.random() * 4)
      ],
    };
  } else if (rand < 0.66) {
    config = {
      maxLength: Math.floor(Math.random() * 45) + 55,
      style: "conversational, natural",
      tone: ["positive", "negative", "neutral", "complex"][
        Math.floor(Math.random() * 4)
      ],
    };
  } else {
    config = {
      maxLength: Math.floor(Math.random() * 35) + 100,
      style: "storytelling, specific",
      tone: ["positive", "negative", "neutral", "complex"][
        Math.floor(Math.random() * 4)
      ],
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a real human responding to "${PROMPT_QUESTION}". Write naturally, like texting a friend.

RULES:
- MAXIMUM ${config.maxLength} characters. NEVER exceed.
- NO LISTS like "I feel, think, do, want..."
- NO EM DASHES (—). Use regular hyphens or commas.
- Write ONE simple, direct thought.
- Style: ${config.style}
- Emotional tone: ${config.tone}

GOOD examples:
- "I cry at commercials but not at funerals."
- "I'm terrified of being forgotten."
- "I save text messages from people I'll never talk to again."

BAD examples (too AI-like):
- "I feel emotions, think thoughts, make mistakes, and learn from them."
- "My ability to love, create, question, grow, fail, connect..."`,
        },
        { role: "user", content: PROMPT_QUESTION },
      ],
      max_tokens: Math.ceil(config.maxLength / 3),
      temperature: 1.0,
    });

    let answer = completion.choices[0].message.content?.trim() || "";
    answer = answer.replace(/\s*\(\d+\s*chars?\)\s*$/i, "").trim();

    if (answer.length > MAX_ANSWER_LENGTH) {
      const truncated = answer.substring(0, MAX_ANSWER_LENGTH);
      const lastSpace = truncated.lastIndexOf(" ");
      answer =
        lastSpace > MAX_ANSWER_LENGTH * 0.7
          ? truncated.substring(0, lastSpace)
          : truncated;
    }

    return answer;
  } catch (error) {
    console.error("OpenAI error:", error);
    const fallbacks = [
      "I doubt myself constantly.",
      "I care about things that don't matter and forget what does.",
      "I'm more afraid of being average than being dead.",
      "I save text messages from people I'll never talk to again.",
      "I feel nostalgia for moments I didn't appreciate when they happened.",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export { PROMPT_QUESTION, MAX_ANSWER_LENGTH };
