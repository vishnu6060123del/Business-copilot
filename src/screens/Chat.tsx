import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { Button, Card, CardHeader, CardTitle } from "@/components/ui";
import type { ChatMessage } from "@/lib/types";
import { loadChatHistory, persistChatHistory, queryChat } from "@/server/api";

const suggestedPrompts = [
  "Which contracts expire next month?",
  "Who is my most expensive supplier?",
  "Show vendors where we are overpaying",
  "What is our total spend?",
];

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSQL, setShowSQL] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadChatHistory());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const result = await queryChat(text);
      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: result.answer,
        createdAt: new Date().toISOString(),
      };
      const updated = [...next, assistantMsg];
      setMessages(updated);
      persistChatHistory(updated);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    persistChatHistory([]);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <CardTitle>AI Procurement Assistant</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <input type="checkbox" checked={showSQL} onChange={(e) => setShowSQL(e.target.checked)} className="rounded" />
                Show SQL
              </label>
              <Button variant="ghost" size="sm" onClick={clearChat} className="gap-1">
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="space-y-4">
              <p className="text-center text-slate-500 dark:text-slate-400">
                Ask anything about your contracts, suppliers, and spend.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
                {showSQL && msg.role === "assistant" && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-2 text-xs text-slate-300">
                    {msg.content.includes("SELECT") ? "SQL generated for this query." : "-- No structured query generated."}
                  </pre>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="h-4 w-4 animate-pulse rounded-full bg-indigo-500" />
                Analyzing procurement data...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <Button type="submit" disabled={loading || !input.trim()} className="gap-2">
              <Send className="h-4 w-4" /> Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
