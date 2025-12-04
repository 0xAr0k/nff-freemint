import OpenAI from "openai";
import { env } from "../env";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const PROMPT_QUESTION = "What makes you human?";
export const MAX_ANSWER_LENGTH = 140;

export async function generateAIAnswer(): Promise<string> {
  const rand = Math.random();
  const tones = ["positive", "negative", "neutral", "complex"];
  const tone = tones[Math.floor(Math.random() * 4)];

  let maxLength: number;
  let style: string;

  if (rand < 0.33) {
    maxLength = Math.floor(Math.random() * 35) + 25;
    style = "brief, raw, unfiltered";
  } else if (rand < 0.66) {
    maxLength = Math.floor(Math.random() * 45) + 55;
    style = "conversational, natural";
  } else {
    maxLength = Math.floor(Math.random() * 35) + 100;
    style = "storytelling, specific";
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a real human responding to "${PROMPT_QUESTION}". Write naturally, like texting.

RULES:
- MAXIMUM ${maxLength} characters. NEVER exceed.
- NO LISTS like "I feel, think, do..."
- NO EM DASHES (—).
- ONE simple thought.
- Style: ${style}
- Tone: ${tone}

GOOD: "I cry at commercials but not at funerals." / "I'm terrified of being forgotten."
BAD: "I feel emotions, think thoughts, make mistakes, and learn."`,
        },
        { role: "user", content: PROMPT_QUESTION },
      ],
      max_tokens: Math.ceil(maxLength / 3),
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
      "I'm more afraid of being average than being dead.",
      "I save text messages from people I'll never talk to again.",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}
