
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type StoredMessage = Omit<Message, "id">;

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! Welcome to FarmLoop. I'm your AI assistant. Ask me about products, listings, or how to use the platform.",
};

function isStoredMessage(value: unknown): value is StoredMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "role" in value &&
    (value.role === "user" || value.role === "assistant") &&
    "content" in value &&
    typeof value.content === "string" &&
    value.content.trim().length > 0
  );
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedConversation, setHasLoadedConversation] = useState(false);
  const [error, setError] = useState("");
  const isLoadingConversation =
    isOpen && !hasLoadedConversation && !error;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || hasLoadedConversation) return;

    const controller = new AbortController();

    async function loadConversation() {
      try {
        const response = await fetch("/api/chat", {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load your conversation.");
        }

        if (
          !Array.isArray(data.messages) ||
          !data.messages.every(isStoredMessage)
        ) {
          throw new Error("Unable to load your conversation.");
        }

        const savedMessages: Message[] = data.messages.map(
          (message: StoredMessage, index: number) => ({
            ...message,
            id: `saved-${index}`,
          })
        );
        setMessages([
          welcomeMessage,
          ...savedMessages.filter(
            (message) =>
              message.role !== welcomeMessage.role ||
              message.content !== welcomeMessage.content
          ),
        ]);
        setHasLoadedConversation(true);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your conversation."
          );
        }
      }
    }

    void loadConversation();
    return () => controller.abort();
  }, [hasLoadedConversation, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isLoadingConversation]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const userMessage = input.trim();

    if (
      !userMessage ||
      isLoading ||
      isLoadingConversation ||
      !hasLoadedConversation
    ) {
      return;
    }

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
    };

    setMessages((previous) => [...previous, newMessage]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to get a response.");
      }

      if (typeof data.response !== "string" || !data.response.trim()) {
        throw new Error("The AI returned an empty response. Please try again.");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (err) {
      setMessages((previous) =>
        previous.filter((message) => message.id !== newMessage.id)
      );
      setInput(userMessage);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-3 sm:right-6 md:bottom-6">

      {isOpen && (
        <section
          aria-label="FarmLoop chat"
          className="flex h-[min(32rem,calc(100dvh-9rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-[#e3e9df] bg-white shadow-[0_20px_60px_-24px_rgba(37,71,44,0.35)]"
          id="farmloop-chat-panel"
        >

          {/* Chat header */}
          <div className="flex shrink-0 items-center justify-between bg-[#315c3b] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
                </svg>
              </span>

              <div>
                <h2 className="text-sm font-semibold">FarmLoop AI</h2>
                <p className="mt-0.5 text-xs text-white/75">
                  Here to help
                </p>
              </div>
            </div>

            <button
              aria-label="Close chat"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          {/* Messages area */}
          <div
            aria-live="polite"
            className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#f7f8f3] p-5"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === "user"
                      ? "rounded-tr-sm bg-[#315c3b] text-white"
                      : "rounded-tl-sm border border-[#e3e9df] bg-white text-[#405847]"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {message.content}
                  </p>

                  {message.role === "assistant" && (
                    <p className="mt-2 text-[11px] text-[#89948a]">
                      FarmLoop AI
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm border border-[#e3e9df] bg-white px-4 py-3">
                  <p className="text-sm text-[#778278]">
                    FarmLoop AI is thinking...
                  </p>
                </div>
              </div>
            )}

            {isLoadingConversation && (
              <p className="text-center text-xs text-[#778278]">
                Loading your conversation...
              </p>
            )}

            {error && (
              <p role="alert" className="text-center text-xs text-red-600">
                {error}
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <form
            onSubmit={handleSubmit}
            className="flex shrink-0 gap-2 border-t border-[#e3e9df] bg-white p-3"
          >
            <input
              aria-label="Type your message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask FarmLoop anything..."
              disabled={
                isLoading || isLoadingConversation || !hasLoadedConversation
              }
              className="min-w-0 flex-1 rounded-xl border border-[#e3e9df] px-3 py-2 text-sm text-[#405847] outline-none placeholder:text-[#89948a] focus:border-[#315c3b] focus:ring-1 focus:ring-[#315c3b] disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={
                isLoading ||
                isLoadingConversation ||
                !hasLoadedConversation ||
                !input.trim()
              }
              className="rounded-xl bg-[#315c3b] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#24492e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>
      )}

      {/* Floating chat button */}
      <button
        aria-controls="farmloop-chat-panel"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close FarmLoop chat" : "Open FarmLoop chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#315c3b] text-white shadow-[0_8px_24px_-8px_rgba(37,71,44,0.55)] transition hover:-translate-y-0.5 hover:bg-[#24492e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c3b]"
        onClick={() => {
          setError("");
          if (isOpen) {
            setMessages([welcomeMessage]);
            setHasLoadedConversation(false);
          }
          setIsOpen(!isOpen);
        }}
        type="button"
      >
        {isOpen ? (
          <svg
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
