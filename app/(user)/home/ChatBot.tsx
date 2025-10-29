"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendChatMessage } from "./actions";

// Simple message type
type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{
    id: crypto.randomUUID(),
    role: "assistant",
    content: "Hi! I’m your site assistant. Ask me anything about this page."
  }]);
  const [input, setInput] = useState("");
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus the input when widget opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Send message to OpenAI backend
  const sendToOpenAI = async (userText: string, currentMessages: Msg[]) => {
    const thinking: Msg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Thinking…"
    };
    setMessages(prev => [...prev, thinking]);

    try {
      const response = await sendChatMessage(
        currentMessages.map(m => ({
          role: m.role,
          content: m.content,
        }))
      );

      const assistantMessage = response.content || "I couldn't generate a response. Please try again.";

      setMessages(prev => prev.map(m => m.id === thinking.id ? ({
        ...m,
        content: assistantMessage,
      }) : m));
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m => m.id === thinking.id ? ({
        ...m,
        content: "Sorry, I encountered an error. Please try again later.",
      }) : m));
    }
  };

  const onSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    // Send to OpenAI backend
    sendToOpenAI(text, [...messages, userMsg]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSend();
    }
  };

  // A minimal visual derived from shadcn/ui primitives
  return (
    <div className="fixed right-4 bottom-4 z-50">
      {/* FAB (closed state) */}
      {!open && (
        <button
          aria-label="Open chat"
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center border border-white/70 bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Widget (open state) */}
      {open && (
        <Card className="w-[320px] sm:w-[360px] max-h-[70vh] shadow-2xl border-blue-100">
          <CardHeader className="p-3 pb-2 bg-blue-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Chat</CardTitle>
              <Button
                size="icon"
                variant="secondary"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col h-[52vh]">
              {/* Messages */}
              <ScrollArea className="flex-1 p-3 overflow-y-auto">
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={
                          m.role === "user"
                            ? "max-w-[80%] rounded-2xl px-3 py-2 bg-blue-600 text-white shadow break-words"
                            : "max-w-[80%] rounded-2xl px-3 py-2 bg-white text-blue-900 border border-blue-100 shadow break-words"
                        }
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={listEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Type your message…"
                    className="focus-visible:ring-blue-600"
                  />
                  <Button onClick={onSend} className="bg-blue-600 text-white hover:bg-blue-700" aria-label="Send message">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}