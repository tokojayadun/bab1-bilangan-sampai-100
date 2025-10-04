import { NextResponse } from "next/server";
import Groq from "groq-sdk";

type GroqRequestBody = {
  systemPrompt?: string;
  userPrompt?: string;
};

const groqApiKey = process.env.GROQ_API_KEY;

const groq = new Groq({
  apiKey: groqApiKey,
});

export async function POST(request: Request) {
  try {
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Server configuration error: GROQ_API_KEY is not set." },
        { status: 500 },
      );
    }

    const { systemPrompt = "You are a helpful assistant.", userPrompt = "" } =
      (await request.json()) as GroqRequestBody;

    if (!userPrompt.trim()) {
      return NextResponse.json(
        { error: "userPrompt is required" },
        { status: 400 },
      );
    }

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content =
      chatCompletion.choices[0]?.message?.content ??
      "Maaf, saya tidak bisa memberikan jawaban saat ini.";

    return NextResponse.json({ answer: content });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error("Groq API error:", details);
    return NextResponse.json(
      { error: "Failed to fetch completion from Groq.", details },
      { status: 500 },
    );
  }
}
