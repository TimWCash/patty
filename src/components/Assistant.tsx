"use client";

import { useEffect, useRef, useState } from "react";
import { PattyMark } from "./Logo";

type Msg = { role: "user" | "assistant"; content: string; status?: string };

const SUGGESTIONS = [
  "What's our total open pipeline value?",
  "Who haven't we emailed in over a week?",
  "Summarize the latest meeting with Pacific Bowl",
  "Which tasks are overdue?",
];

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    const history = [...messages, { role: "user" as const, content: q }];
    setMessages([...history, { role: "assistant", content: "", status: "Thinking..." }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";

      const update = (status?: string) =>
        setMessages([...history, { role: "assistant", content: answer, status }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6));
          if (event.type === "text") {
            answer += event.text;
            update();
          } else if (event.type === "status") {
            update(answer ? undefined : event.text);
          } else if (event.type === "error") {
            answer = answer ? `${answer}\n\n${event.text}` : event.text;
            update();
          }
        }
      }
      if (!answer) {
        answer = "I didn't get a response. Try rephrasing the question.";
        update();
      }
    } catch {
      setMessages([
        ...history,
        { role: "assistant", content: "Could not reach the assistant. Is the dev server still running?" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="assistant-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? (
          <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        )}
      </button>

      {open && (
        <div className="assistant-panel" role="dialog" aria-label="Ask Patty">
          <div className="assistant-head">
            <PattyMark size={28} />
            <div>
              <div className="assistant-title">Patty</div>
              <div className="assistant-sub">Ask anything about your clients, pipeline, emails, or meetings</div>
            </div>
          </div>

          <div className="assistant-body" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="assistant-suggestions">
                <div className="tl-meta" style={{ marginBottom: 8 }}>Try one of these:</div>
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="assistant-chip" onClick={() => ask(s)}>{s}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`assistant-msg ${m.role}`}>
                {m.content}
                {m.status && <span className="assistant-status"><span className="spinner dark" /> {m.status}</span>}
              </div>
            ))}
          </div>

          <form
            className="assistant-input"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask Patty anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              aria-label="Ask the assistant"
            />
            <button className="btn orange" type="submit" disabled={busy || !input.trim()}>
              {busy ? <span className="spinner" /> : "Ask"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
