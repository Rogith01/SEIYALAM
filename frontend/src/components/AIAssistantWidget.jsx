
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  MessageCircle,
  Send,
  Sparkles,
  X,
  Minimize2,
  UserRound,
  LoaderCircle,
} from "lucide-react";
import api from "../services/api";

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.question === "string") return data.question;

  if (error?.response?.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (error?.response?.status === 403) {
    return "You don't have permission to access this information.";
  }

  return "I couldn't process that message. Please try again.";
}

export default function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages, sending]);

  const sendMessage = async (event) => {
    event?.preventDefault();

    const text = question.trim();

    if (text.length < 2 || sending) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setSending(true);
    setError("");

    try {
      const payload = {
        action: "chat",
        question: text,
        retrieval_mode: "keyword",
      };

      if (conversationId) {
        payload.conversation_id = conversationId;
      }

      const response = await api.post("/knowledge/chat/", payload);
      const result = response.data;

      setConversationId(result.conversation_id);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.answer || "I couldn't generate an answer.",
          sources: result.sources || [],
        },
      ]);
    } catch (err) {
      setMessages((current) =>
        current.filter((message) => message.id !== userMessage.id)
      );
      setQuestion(text);
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const startNewChat = async () => {
    setError("");
    setSending(true);

    try {
      const response = await api.post("/knowledge/chat/", {
        action: "new",
      });

      setConversationId(response.data.conversation_id);
      setMessages([]);
      setQuestion("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {/* Floating assistant button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open SEIYALAM AI assistant"
          title="Ask SEIYALAM AI"
          className="fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl transition hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
        >
          <Bot size={27} />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
        </button>
      )}

      {/* Floating chat panel */}
      {open && (
        <section
          aria-label="SEIYALAM AI assistant chat"
          className="fixed bottom-4 right-4 z-[100] flex h-[min(620px,calc(100dvh-32px))] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          {/* Header */}
          <header className="flex items-center justify-between bg-indigo-600 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-2">
                <Sparkles size={21} />
              </div>

              <div>
                <h2 className="text-sm font-bold">SEIYALAM AI</h2>
                <p className="mt-0.5 text-xs text-indigo-100">
                  Your business assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startNewChat}
                disabled={sending}
                title="Start a new conversation"
                aria-label="Start a new conversation"
                className="rounded-lg p-2 transition hover:bg-white/15 disabled:opacity-50"
              >
                <MessageCircle size={18} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close assistant"
                aria-label="Close assistant"
                className="rounded-lg p-2 transition hover:bg-white/15"
              >
                <X size={19} />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
            {messages.length === 0 && (
              <div className="flex min-h-full flex-col items-center justify-center px-3 text-center">
                <div className="mb-4 rounded-2xl bg-indigo-100 p-4 text-indigo-600">
                  <Bot size={34} />
                </div>

                <h3 className="text-base font-bold text-slate-800">
                  Hi! How can I help?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Ask me a question about your company's knowledge or policies.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setQuestion("What can you help me with?")
                  }
                  className="mt-5 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-left text-sm text-indigo-700 transition hover:bg-indigo-50"
                >
                  What can you help me with?
                </button>
              </div>
            )}

            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="mt-1 rounded-lg bg-indigo-100 p-2 text-indigo-600">
                      <Bot size={16} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-3 text-sm leading-6 ${
                      isUser
                        ? "rounded-br-md bg-indigo-600 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>

                    {!isUser && message.sources?.length > 0 && (
                      <div className="mt-3 border-t border-slate-100 pt-2">
                        <p className="mb-1 text-xs font-semibold text-slate-500">
                          Sources
                        </p>

                        {message.sources.map((source, index) => (
                          <p
                            key={`${index}-${source.title || source.name || "source"}`}
                            className="text-xs text-slate-500"
                          >
                            {source.title ||
                              source.name ||
                              source.filename ||
                              `Source ${index + 1}`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="mt-1 rounded-lg bg-slate-200 p-2 text-slate-600">
                      <UserRound size={16} />
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <LoaderCircle size={17} className="animate-spin" />
                SEIYALAM AI is thinking...
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Message input */}
          <form
            onSubmit={sendMessage}
            className="border-t border-slate-200 bg-white p-3"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                maxLength={10000}
                placeholder="Ask your question..."
                aria-label="Ask SEIYALAM AI"
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={sending || question.trim().length < 2}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={17} />
              </button>
            </div>

            <p className="mt-2 text-center text-[11px] text-slate-400">
              AI responses can be inaccurate. Verify important information.
            </p>
          </form>
        </section>
      )}
    </>
  );
}
