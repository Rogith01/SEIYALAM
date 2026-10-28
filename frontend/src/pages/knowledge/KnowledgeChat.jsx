
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Building2,
  ChevronDown,
  FileText,
  LoaderCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import api from "../../services/api";

const getErrorMessage = (error) => {
  const data = error?.response?.data;

  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.question === "string") return data.question;
  if (typeof data?.company_id === "string") return data.company_id;

  if (error?.response?.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (error?.response?.status === 403) {
    return "You do not have permission to access this company's knowledge.";
  }

  if (typeof error?.message === "string" && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

const downloadReport = async (postChat, action, reportQuestion = "") => {
  const response = await postChat(
    {
      action,
      question: reportQuestion.trim() || "Generate a business report",
    },
    { responseType: "blob" }
  );

  const contentType = response.headers?.["content-type"] || "";

  // When the backend returns an error with responseType=blob, decode its JSON.
  if (contentType.includes("application/json")) {
    const errorText = await response.data.text();
    let message = "The report could not be generated.";
    try {
      const errorData = JSON.parse(errorText);
      message = errorData.detail || errorData.question || message;
    } catch {
      // Keep the fallback message when the response is not valid JSON.
    }
    throw new Error(message);
  }

  const blob = response.data instanceof Blob
    ? response.data
    : new Blob([response.data], {
        type: action === "export_csv" ? "text/csv;charset=utf-8" : "application/pdf",
      });

  const disposition = response.headers?.["content-disposition"];
  const filenameMatch = disposition?.match(/filename="?([^";]+)"?/i);
  const filename = filenameMatch?.[1] ||
    (action === "export_csv"
      ? "seiyalam-business-report.csv"
      : "seiyalam-business-report.pdf");

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
};

export default function KnowledgeChat() {
  const navigate = useNavigate();
  const founderToken = localStorage.getItem("founder_access_token");
  const isFounder = Boolean(founderToken);

  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [companyLoading, setCompanyLoading] = useState(isFounder);

  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [retrievalMode, setRetrievalMode] = useState("keyword");

  const [historyLoading, setHistoryLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const requestConfig = useCallback(() => {
    if (isFounder) {
      return {
        headers: {
          Authorization: `Bearer ${founderToken}`,
        },
      };
    }

    return {};
  }, [isFounder, founderToken]);

  const requestPayload = useCallback(
    (payload) => {
      if (isFounder) {
        return { ...payload, company_id: Number(companyId) };
      }

      // The backend resolves the Admin's company from the authenticated user.
      return payload;
    },
    [isFounder, companyId]
  );

  const postChat = useCallback(
    async (payload, options = {}) =>
      api.post(
        "/knowledge/chat/",
        requestPayload(payload),
        {
          ...requestConfig(),
          ...options,
        }
      ),
    [requestConfig, requestPayload]
  );

  useEffect(() => {
    if (!isFounder) return undefined;

    let active = true;

    const loadCompanies = async () => {
      setCompanyLoading(true);
      setError("");

      try {
        const response = await api.get(
          "/founder/companies/list/",
          requestConfig()
        );

        const data = response.data;
        const items = Array.isArray(data)
          ? data
          : data?.companies || [];

        if (!active) return;

        setCompanies(items);

        setCompanyId((current) => {
          if (current && items.some((item) => String(item.id) === current)) {
            return current;
          }

          return items.length ? String(items[0].id) : "";
        });
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setCompanyLoading(false);
      }
    };

    loadCompanies();

    return () => {
      active = false;
    };
  }, [isFounder, requestConfig]);

  const loadConversations = useCallback(async () => {
    if (isFounder && !companyId) {
      setConversations([]);
      setConversationId(null);
      setMessages([]);
      return;
    }

    setHistoryLoading(true);
    setError("");

    try {
      const response = await postChat({ action: "list" });
      setConversations(response.data.conversations || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }, [companyId, isFounder, postChat]);

  useEffect(() => {
    setConversationId(null);
    setMessages([]);

    if (!isFounder || companyId) {
      loadConversations();
    }
  }, [companyId, isFounder, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const loadHistory = async (id) => {
    setConversationId(id);
    setMessages([]);
    setError("");

    try {
      const response = await postChat({
        action: "history",
        conversation_id: id,
      });

      setMessages(response.data.messages || []);
      setSidebarOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const createConversation = async () => {
    if (isFounder && !companyId) {
      setError("Select a company before starting a conversation.");
      return;
    }

    setError("");

    try {
      const response = await postChat({ action: "new" });
      const created = response.data;

      setConversationId(created.conversation_id);
      setMessages([]);
      setConversations((current) => [
        {
          id: created.conversation_id,
          title: created.title || "New conversation",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...current,
      ]);

      setSidebarOpen(false);
      inputRef.current?.focus();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const sendMessage = async (event) => {
    event?.preventDefault();

    const text = question.trim();

    if (text.length < 2 || sending) return;

    if (isFounder && !companyId) {
      setError("Select a company before sending a question.");
      return;
    }

    const previousMessages = messages;
    const optimisticMessage = {
      id: `pending-${Date.now()}`,
      role: "user",
      content: text,
      sources: [],
      created_at: new Date().toISOString(),
    };

    setMessages([...previousMessages, optimisticMessage]);
    setQuestion("");
    setSending(true);
    setError("");

    try {
      const normalizedText = text.toLowerCase();
      const asksForExport = /\b(export|download|generate)\b/.test(normalizedText) ||
        /\bbusiness report\b/.test(normalizedText);
      const wantsCsv = /\bcsv\b/.test(normalizedText);
      const wantsPdf = /\bpdf\b/.test(normalizedText);

      if (asksForExport && (wantsCsv || wantsPdf)) {
        const action = wantsCsv ? "export_csv" : "export_pdf";
        await downloadReport(postChat, action, text);

        setMessages((current) => [
          ...current.filter((item) => item.id !== optimisticMessage.id),
          optimisticMessage,
          {
            id: `answer-${Date.now()}`,
            role: "assistant",
            content: `Your ${wantsCsv ? "CSV" : "PDF"} business report has been downloaded.`,
            sources: [],
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        const payload = {
          action: "chat",
          question: text,
          retrieval_mode: retrievalMode,
        };

        if (conversationId) {
          payload.conversation_id = conversationId;
        }

        const response = await postChat(payload);
        const result = response.data;

        setConversationId(result.conversation_id);

        setMessages((current) => [
          ...current.filter((item) => item.id !== optimisticMessage.id),
          optimisticMessage,
          {
            id: `answer-${Date.now()}`,
            role: "assistant",
            content: result.answer,
            sources: result.sources || [],
            used_ai: result.used_ai,
            created_at: new Date().toISOString(),
          },
        ]);

        await loadConversations();
      }
    } catch (err) {
      setMessages((current) =>
        current.filter((item) => item.id !== optimisticMessage.id)
      );
      setQuestion(text);
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const selectedCompany = companies.find(
    (item) => String(item.id) === companyId
  );

  const ready = !isFounder || Boolean(companyId);

  return (
    <div className="flex h-[calc(100vh-2rem)] min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close conversation sidebar"
          className="fixed inset-0 z-20 bg-slate-950/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-slate-50 transition-transform md:relative md:inset-auto md:z-0 md:translate-x-0 ${
          sidebarOpen ? "md:flex" : "md:hidden"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-indigo-600 p-2 text-white">
              <Bot size={21} />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Knowledge AI</p>
              <p className="text-xs text-slate-500">SEIYALAM assistant</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 hover:bg-slate-200 md:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={createConversation}
            disabled={!ready || companyLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            New conversation
          </button>
        </div>

        {isFounder && (
          <div className="px-3 pb-3">
            <label
              htmlFor="knowledge-company"
              className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <Building2 size={15} />
              Company
            </label>

            <div className="relative">
              <select
                id="knowledge-company"
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                disabled={companyLoading}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">
                  {companyLoading ? "Loading companies..." : "Select company"}
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={String(company.id)}>
                    {company.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recent conversations
          </p>
          <button
            type="button"
            onClick={loadConversations}
            disabled={historyLoading || !ready}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200"
            title="Refresh conversations"
          >
            <RefreshCw
              size={14}
              className={historyLoading ? "animate-spin" : ""}
            />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => loadHistory(conversation.id)}
              className={`w-full rounded-xl px-3 py-3 text-left transition ${
                conversationId === conversation.id
                  ? "bg-indigo-100 text-indigo-900"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare size={16} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {conversation.title || "New conversation"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(conversation.updated_at)}
                  </p>
                </div>
              </div>
            </button>
          ))}

          {!historyLoading && ready && conversations.length === 0 && (
            <p className="px-3 py-4 text-center text-xs leading-5 text-slate-400">
              Your conversations will appear here.
            </p>
          )}
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={() =>
              navigate(isFounder ? "/founder/dashboard" : "/admin/dashboard")
            }
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-200"
          >
            ← Back to dashboard
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 md:hidden"
              aria-label="Open conversation sidebar"
            >
              <MessageSquare size={18} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900">
                AI Knowledge Chat
              </h1>
              <p className="truncate text-xs text-slate-500">
                {isFounder
                  ? selectedCompany?.name || "Choose a company"
                  : "Your company's knowledge base"}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
            <Sparkles size={14} />
            Document-grounded answers
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
          {!ready ? (
            <div className="m-auto max-w-sm px-6 text-center">
              <Building2 className="mx-auto mb-3 text-indigo-500" size={36} />
              <h2 className="font-semibold text-slate-900">
                Select a company
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Choose a company from the sidebar to access its knowledge base.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="m-auto w-full max-w-2xl px-5 py-10">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Sparkles size={28} />
              </div>

              <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
                Ask your company knowledge
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-6 text-slate-500">
                Ask questions about documents available to this company. The
                assistant can use retrieved document passages to help answer.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Summarize the key points in our documents",
                  "What procedures are documented?",
                  "Find important requirements",
                  "Explain a topic from the uploaded files",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setQuestion(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="rounded-xl border border-slate-200 p-4 text-left text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/50"
                  >
                    <MessageSquare
                      size={16}
                      className="mb-3 text-indigo-500"
                    />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl flex-1 space-y-7 px-4 py-6 sm:px-6">
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <article
                    key={message.id}
                    className={`flex gap-3 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isUser
                          ? "bg-slate-200 text-slate-700"
                          : "bg-indigo-600 text-white"
                      }`}
                    >
                      {isUser ? <UserRound size={18} /> : <Bot size={19} />}
                    </div>

                    <div
                      className={`min-w-0 max-w-[88%] ${
                        isUser ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`mb-1 text-xs font-semibold ${
                          isUser ? "text-slate-500" : "text-indigo-700"
                        }`}
                      >
                        {isUser ? "You" : "SEIYALAM AI"}
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-3 text-left text-sm leading-7 ${
                          isUser
                            ? "whitespace-pre-wrap bg-indigo-600 text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      </div>

                      {!isUser && message.used_ai === false && (
                        <p className="mt-2 text-xs text-amber-700">
                          No AI-generated answer was used for this response.
                        </p>
                      )}

                      {!isUser &&
                        Array.isArray(message.sources) &&
                        message.sources.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                              <FileText size={14} />
                              Sources ({message.sources.length})
                            </p>

                            {message.sources.map((source, index) => (
                              <details
                                key={`${source.document_id}-${source.chunk_index}-${index}`}
                                className="rounded-xl border border-slate-200 bg-white text-left"
                              >
                                <summary className="cursor-pointer list-none px-3 py-3 text-xs font-medium text-indigo-700 hover:bg-indigo-50/50">
                                  <span className="mr-2 text-slate-400">
                                    [{index + 1}]
                                  </span>
                                  {source.title || `Document ${source.document_id}`}
                                  {source.chunk_index !== undefined &&
                                    source.chunk_index !== null && (
                                      <span className="ml-2 text-slate-400">
                                        · Passage {source.chunk_index}
                                      </span>
                                    )}
                                </summary>
                                {source.text && (
                                  <div className="border-t border-slate-100 px-3 py-3 text-xs leading-6 text-slate-600">
                                    {source.text}
                                  </div>
                                )}
                              </details>
                            ))}
                          </div>
                        )}
                    </div>
                  </article>
                );
              })}

              {sending && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <Bot size={19} />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
                    <LoaderCircle size={16} className="animate-spin" />
                    Searching documents and preparing an answer...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </section>

        <footer className="border-t border-slate-200 bg-white p-3 sm:p-5">
          <div className="mx-auto max-w-3xl">
            {error && (
              <div
                role="alert"
                className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={sendMessage}>
              <label htmlFor="knowledge-question" className="sr-only">
                Ask a question about company documents
              </label>

              <div className="rounded-2xl border border-slate-300 bg-white shadow-sm transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                <textarea
                  id="knowledge-question"
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
                      sendMessage(event);
                    }
                  }}
                  rows={2}
                  maxLength={4000}
                  disabled={!ready || sending}
                  placeholder="Ask a question about your documents..."
                  className="max-h-40 min-h-14 w-full resize-y bg-transparent px-4 pt-4 text-sm leading-6 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="retrieval-mode"
                      className="text-xs text-slate-500"
                    >
                      Retrieval
                    </label>
                    <select
                      id="retrieval-mode"
                      value={retrievalMode}
                      onChange={(event) =>
                        setRetrievalMode(event.target.value)
                      }
                      disabled={sending}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-indigo-400"
                    >
                      <option value="keyword">Keyword</option>
                      <option value="semantic">Semantic</option>
                    </select>
                    <span className="hidden text-xs text-slate-400 sm:inline">
                      Enter to send · Shift+Enter for a new line
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!ready || sending || question.trim().length < 2}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Send
                  </button>
                </div>
              </div>
            </form>

            <p className="mt-2 text-center text-xs text-slate-400">
              Answers depend on the available documents. Verify important
              information against the cited sources.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
