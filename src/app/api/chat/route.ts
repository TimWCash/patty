import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, runReadOnlyQuery } from "@/lib/assistant";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MODEL = "claude-opus-4-8";
const MAX_TOOL_ITERATIONS = 8;

const tools: Anthropic.Tool[] = [
  {
    name: "run_sql",
    description:
      "Run a read-only SQL SELECT query against the Client Hub SQLite database. Call this whenever the answer depends on hub data: companies, contacts, engagements, emails, meetings, documents, tasks, or activities.",
    input_schema: {
      type: "object",
      properties: {
        sql: { type: "string", description: "A single SQLite SELECT statement." },
      },
      required: ["sql"],
    },
  },
];

type ChatTurn = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  let body: { messages?: ChatTurn[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const turns = (body.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim()
  );
  if (!turns.length || turns[turns.length - 1].role !== "user") {
    return Response.json({ error: "Last message must be from the user." }, { status: 400 });
  }

  const client = new Anthropic();
  const system = buildSystemPrompt();
  const messages: Anthropic.MessageParam[] = turns.map((t) => ({ role: t.role, content: t.content }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      try {
        for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
          const msgStream = client.messages.stream({
            model: MODEL,
            max_tokens: 16000,
            thinking: { type: "adaptive" },
            system,
            tools,
            messages,
          });

          msgStream.on("text", (delta) => send({ type: "text", text: delta }));

          const message = await msgStream.finalMessage();

          if (message.stop_reason !== "tool_use") break;

          const toolUses = message.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          messages.push({ role: "assistant", content: message.content });

          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            const sql = (tu.input as { sql?: string }).sql ?? "";
            send({ type: "status", text: "Checking the hub data..." });
            const result = runReadOnlyQuery(sql);
            results.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify(result),
              is_error: "error" in result,
            });
          }
          messages.push({ role: "user", content: results });
        }
        send({ type: "done" });
      } catch (error) {
        let text = "Something went wrong talking to the assistant.";
        if (error instanceof Anthropic.AuthenticationError) {
          text = "No Anthropic API key found. Add ANTHROPIC_API_KEY to .env.local and restart the dev server.";
        } else if (error instanceof Anthropic.RateLimitError) {
          text = "Rate limited by the Claude API. Try again in a moment.";
        } else if (error instanceof Anthropic.APIError) {
          text = `Claude API error (${error.status}): ${error.message}`;
        } else if (error instanceof Error && /api key|auth/i.test(error.message)) {
          text = "No Anthropic API key found. Add ANTHROPIC_API_KEY to .env.local and restart the dev server.";
        }
        send({ type: "error", text });
        send({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
