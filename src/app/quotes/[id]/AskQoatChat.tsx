"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: string;
  content: string;
  createdAt: string;
};

type Props = {
  quoteId: string;
  initialMessages: Message[];
  priceScore: number | null;
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(isoString).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const BASE_CHIPS = [
  "Is this price reasonable?",
  "What should I negotiate?",
  "What questions should I ask the supplier?",
  "Are there any risks I should know about?",
];

export default function AskQoatChat({ quoteId, initialMessages, priceScore }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const starterChips = [...BASE_CHIPS];
  if (priceScore !== null) {
    if (priceScore <= 5) starterChips.push("Why did you score the price low?");
    else if (priceScore >= 8) starterChips.push("Why did you score the price well?");
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function growTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const optimistic: Message = {
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setError(null);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch(`/api/quotes/${quoteId}/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message as Message]);
      } else {
        const err = await res.json().catch(() => ({}));
        setError((err as { error?: string }).error ?? "Something went wrong. Try again.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const charCount = input.length;
  const nearLimit = charCount > 800;

  return (
    <div className="space-y-4">
      {/* Message list */}
      {messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className="rounded-[12px] px-4 py-3 text-sm leading-relaxed"
                style={{
                  maxWidth: "75%",
                  ...(msg.role === "user"
                    ? { backgroundColor: "#111111", color: "#ffffff" }
                    : { backgroundColor: "#F9F9F7", color: "#111111", border: "1px solid #E8E8E4" }),
                }}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:mb-2.5 [&>ul]:mb-2.5 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:mb-2.5 [&>ol]:list-decimal [&>ol]:pl-4 [&>li]:mb-1 [&>hr]:hidden [&_hr]:hidden [&_strong]:font-semibold [&_code]:text-[12px] [&_code]:font-mono [&_code]:bg-black/5 [&_code]:px-1 [&_code]:rounded">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-on-surface-variant px-1">
                {timeAgo(msg.createdAt)}
              </span>
            </div>
          ))}

          {/* Thinking indicator */}
          {isLoading && (
            <div className="flex flex-col items-start gap-1">
              <div
                className="rounded-[12px] px-4 py-3 text-sm"
                style={{
                  backgroundColor: "#F9F9F7",
                  border: "1px solid #E8E8E4",
                  color: "#888888",
                }}
              >
                <span className="inline-flex items-center gap-1">
                  QOAT is thinking
                  <span className="inline-flex gap-0.5 ml-1">
                    {[0, 1, 2].map((j) => (
                      <span
                        key={j}
                        className="w-1 h-1 rounded-full bg-current animate-bounce"
                        style={{ animationDelay: `${j * 0.15}s` }}
                      />
                    ))}
                  </span>
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Starter chips — only when conversation is empty */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {starterChips.map((chip) => (
            <button
              key={chip}
              onClick={() => void sendMessage(chip)}
              disabled={isLoading}
              className="text-xs font-semibold px-3 py-2 rounded-[10px] border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              growTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your quote…"
            disabled={isLoading}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-[12px] px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none disabled:opacity-60"
            style={{ minHeight: "52px", maxHeight: "120px", overflowY: "auto" }}
          />
          {nearLimit && (
            <p
              className={`text-[11px] mt-1 text-right ${charCount >= 1000 ? "text-red-500 font-semibold" : "text-on-surface-variant"}`}
            >
              {charCount}/1000
            </p>
          )}
        </div>
        <button
          onClick={() => void sendMessage(input)}
          disabled={!input.trim() || isLoading || charCount > 1000}
          className="shrink-0 bg-[#111111] text-white text-sm font-bold px-5 rounded-[12px] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
          style={{ height: "52px" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
