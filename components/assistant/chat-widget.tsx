"use client";

import { useState } from "react";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-3 sm:right-6 md:bottom-6">
      {isOpen && (
        <section
          aria-label="FarmLoop chat"
          className="w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-3xl border border-[#e3e9df] bg-white shadow-[0_20px_60px_-24px_rgba(37,71,44,0.35)]"
          id="farmloop-chat-panel"
        >
          <div className="flex items-center justify-between bg-[#315c3b] px-5 py-4 text-white">
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
                <h2 className="text-sm font-semibold">FarmLoop chat</h2>
                <p className="mt-0.5 text-xs text-white/75">Here to help</p>
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
          <div className="bg-[#f7f8f3] p-5">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-[#e3e9df] bg-white px-4 py-3 shadow-sm">
              <p className="text-sm leading-6 text-[#405847]">
                Hi! We’re getting chat ready. Soon you’ll be able to ask us
                about products, listings, and your account.
              </p>
              <p className="mt-2 text-[11px] text-[#89948a]">FarmLoop support</p>
            </div>
          </div>
          <div className="border-t border-[#e3e9df] bg-white px-5 py-3">
            <p className="text-center text-xs text-[#778278]">
              Chat support is coming soon.
            </p>
          </div>
        </section>
      )}

      <button
        aria-controls="farmloop-chat-panel"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close FarmLoop chat" : "Open FarmLoop chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#315c3b] text-white shadow-[0_8px_24px_-8px_rgba(37,71,44,0.55)] transition hover:-translate-y-0.5 hover:bg-[#24492e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c3b]"
        onClick={() => setIsOpen((open) => !open)}
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