import { NextRequest, NextResponse } from "next/server";
import { readConfig } from "@/lib/data";
import { decodeSession, getSessionCookieName } from "@/lib/session";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(getSessionCookieName());
  if (!cookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = decodeSession(cookie.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { promptId, userInput } = await req.json();
  const config = readConfig();

  // Find the prompt
  const prompt = config.prompts.find((p: { id: string }) => p.id === promptId);
  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const { aiSettings } = config;
  const userMessage = prompt.userPromptTemplate.replace("{{input}}", userInput);

  try {
    let result = "";

    if (aiSettings.provider === "anthropic") {
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json(
          { error: "Anthropic API key not configured" },
          { status: 400 }
        );
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: aiSettings.anthropicModel,
          max_tokens: 1024,
          system: prompt.systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { error: data.error?.message || "Anthropic API error" },
          { status: 500 }
        );
      }
      result = data.content[0]?.text || "";
    } else if (aiSettings.provider === "openai") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 400 }
        );
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: aiSettings.openaiModel,
          messages: [
            { role: "system", content: prompt.systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: 1024,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { error: data.error?.message || "OpenAI API error" },
          { status: 500 }
        );
      }
      result = data.choices[0]?.message?.content || "";
    } else {
      return NextResponse.json({ error: "Unknown AI provider" }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: "AI call failed" }, { status: 500 });
  }
}
