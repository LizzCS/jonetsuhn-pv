"use client";

export default function ChatbotButton() {
  return (
    <button
      type="button"
      aria-label="Abrir chat"
      onClick={() => {
        // TODO: abrir el chatbot
      }}
      className="fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-full bg-sun text-paper shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
      </svg>
    </button>
  );
}
